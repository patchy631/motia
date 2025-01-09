const Redis = require('ioredis')

class StateAdapter {
  ttl = 300 // Default TTL in seconds

  constructor(traceId, stateConfig) {
    this.traceId = traceId
    this.client = new Redis(stateConfig)
    this.prefix = 'wistro:state'
    this.rootKey = this._makeRootKey()

    if (stateConfig.ttl) {
      this.ttl = stateConfig.ttl
    }
  }

  async get(path) {
    const value = await this.client.get(this.rootKey)
    if (!value) return null

    const data = JSON.parse(value)
    if (!path) return data

    return path.split('.').reduce((obj, key) => obj?.[key], data) ?? null
  }

  async set(path, value) {
    if (!path) {
      await this.client.multi().set(this.rootKey, JSON.stringify(value)).expire(this.rootKey, this.ttl).exec()
      return
    }

    const existing = (await this.get('')) || {}
    const segments = path.split('.')
    let current = existing

    // Create nested structure
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i]
      current[segment] = current[segment] || {}
      current = current[segment]
    }

    // Set the final value
    current[segments[segments.length - 1]] = value

    await this.client.multi().set(this.rootKey, JSON.stringify(existing)).expire(this.rootKey, this.ttl).exec()
  }

  async delete(path) {
    if (!path) {
      await this.client.del(this.rootKey)
      return
    }

    const existing = (await this.get('')) || {}
    const segments = path.split('.')
    let current = existing

    // Navigate to parent of target
    for (let i = 0; i < segments.length - 1; i++) {
      current = current[segments[i]]
      if (!current) return // Path doesn't exist
    }

    // Delete the target property
    delete current[segments[segments.length - 1]]

    await this.client.multi().set(this.rootKey, JSON.stringify(existing)).expire(this.rootKey, this.ttl).exec()
  }

  async clear() {
    await this.client.del(this.rootKey)
  }

  async cleanup() {
    await this.client.quit()
  }

  _makeRootKey() {
    return `${this.prefix}:${this.traceId}`
  }
}

module.exports = { StateAdapter }
