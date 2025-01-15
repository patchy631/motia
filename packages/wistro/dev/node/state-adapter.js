const Redis = require('ioredis')

class StateAdapter {
  constructor(stateConfig) {
    this.client = new Redis(6379, 'localhost')
    this.prefix = 'wistro:state'

    if (stateConfig.ttl) {
      this.ttl = stateConfig.ttl
    }
  }

  async get(traceId, key) {
    const fullKey = this._makeKey(traceId, key)
    const value = await this.client.get(fullKey)
    return value ? JSON.parse(value) : null
  }

  async set(traceId, key, value) {
    const fullKey = this._makeKey(traceId, key)
    if (this.ttl) {
      await this.client.set(fullKey, JSON.stringify(value), 'EX', this.ttl)
    } else {
      await this.client.set(fullKey, JSON.stringify(value))
    }
  }

  async delete(traceId, key) {
    const fullKey = this._makeKey(traceId, key)
    await this.client.del(fullKey)
  }

  async clear(traceId) {
    const pattern = this._makeKey(traceId, '*')
    const keys = await this.client.keys(pattern)
    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  async cleanup() {
    await this.client.quit()
  }

  _makeKey(traceId, key) {
    return `${this.prefix}:${traceId}:${key}`
  }
}

module.exports = { StateAdapter }
