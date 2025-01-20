require 'net/http'
require 'json'
require 'uri'
require 'logger'

class StateManagerError < StandardError; end

LOGGER = Logger.new($stdout)

def get_state_manager_handler(state_manager_url)
  lambda do |action, payload|
    begin
      uri = URI("#{state_manager_url}/#{action}")
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request['x-trace-id'] = payload[:traceId]
      # TODO: Add internal auth token for security
      # TODO: Encrypt the payload for security
      request.body = payload.to_json

      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
        http.request(request)
      end

      unless response.is_a?(Net::HTTPSuccess)
        error_message = "Failed posting state change: #{response.code} - #{response.message}"
        LOGGER.error(error_message)
        raise StateManagerError, error_message
      end

      if action == 'get'
        result = JSON.parse(response.body, object_class: OpenStruct)
        return result.data
      end

      nil
    rescue StandardError => error
      LOGGER.error("[internal state manager] failed posting state change: #{error.message}")
      raise StateManagerError, "Failed posting state change: #{error.message}"
    end
  end
end

def create_internal_state_manager(state_manager_url:)
  handler = get_state_manager_handler(state_manager_url)

  {
    get: ->(trace_id, key) { 
      result = handler.call('get', { traceId: trace_id, key: key })
      { data: result }
    },
    set: ->(trace_id, key, value) { 
      handler.call('set', { traceId: trace_id, key: key, value: value })
    },
    delete: ->(trace_id, key) { 
      handler.call('delete', { traceId: trace_id, key: key })
    },
    clear: ->(trace_id) {
      handler.call('clear', { traceId: trace_id })
    }
  }
end
