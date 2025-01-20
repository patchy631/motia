require 'json'

# Get the FD from ENV with a default fallback for testing
NODEIPCFD = (ENV['NODE_CHANNEL_FD'] || 1).to_i

def send_message(message)
  begin
    io = IO.new(NODEIPCFD, 'w')
    json_message = message.to_json + "\n"
    io.write(json_message)
    io.flush
  rescue Errno::EBADF => e
    warn "Error writing to IPC channel: #{e.message}"
    exit(1)
  ensure
    io.close if io && !io.closed?
  end
end

def extract_config(file_path)
  begin
    # Remove previous Config class if it exists
    Object.send(:remove_const, :Config) if Object.const_defined?(:Config)
    
    # Create a new binding for evaluation
    evaluation_binding = binding
    
    # Load and evaluate the file content in our binding
    file_content = File.read(file_path)
    evaluation_binding.eval(file_content)
    
    # Get the config variable from our binding
    config = evaluation_binding.eval('config')
    
    # Convert config instance to hash with symbol keys
    {
      type: config.type,
      name: config.name,
      subscribes: config.subscribes,
      emits: config.emits,
      input: config.input,
      flows: config.flows
    }
  rescue NameError => e
    raise "Error accessing config: #{e.message}"
  rescue => e
    raise "Error processing config file: #{e.message}"
  end
end

# Main execution block
begin
  if ARGV.empty?
    warn 'Error: No file path provided'
    exit(1)
  end

  file_path = ARGV[0]
  
  unless File.exist?(file_path)
    warn "Error: File not found: #{file_path}"
    exit(1)
  end
  
  unless File.readable?(file_path)
    warn "Error: File is not readable: #{file_path}"
    exit(1)
  end

  # Extract and send config
  config = extract_config(file_path)
  send_message(config)
  
  exit(0)
rescue => e
  warn "Error: #{e.message}"
  exit(1)
end