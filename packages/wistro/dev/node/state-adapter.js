const Redis = require('ioredis')

class StateAdapter {
  constructor(traceId, stateConfig) {
    this.traceId = traceId
    this.client = new Redis(stateConfig)
    this.prefix = 'wistro:state:'

    if (stateConfig.ttl) {
      this.ttl = stateConfig.ttl
    }
  }

  async get(key) {
    const fullKey = this._makeKey(key)
    const value = await this.client.get(fullKey)
    return value ? JSON.parse(value) : null
  }

  async set(key, value) {
    const fullKey = this._makeKey(key)
    await this.client.set(fullKey, JSON.stringify(value), 'EX', this.ttl)
  }

  async delete(key) {
    const fullKey = this._makeKey(key)
    await this.client.del(fullKey)
  }

  async clear() {
    const pattern = this._makeKey('*')
    const keys = await this.client.keys(pattern)

    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  async cleanup() {
    await this.client.quit()
  }

  _makeKey(key) {
    return `${this.prefix}${this.traceId}:${key}`
  }
}

module.exports = { StateAdapter }
