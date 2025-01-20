import { StateAdapter } from '../state-adapter'
import Redis from 'ioredis'

export type RedisAdapterConfig = {
  host: string
  port: number
  password?: string
  ttl?: number
}

export class RedisStateAdapter implements StateAdapter {
  private client: Redis
  private prefix: string
  private ttl = 3600

  constructor(config: RedisAdapterConfig) {
    this.client = new Redis(config)
    this.prefix = 'motia:state'
    if (config.ttl) {
      this.ttl = config.ttl
    }
  }

  async get(traceId: string, key: string) {
    const fullKey = this._makeKey(traceId, key)
    const value = await this.client.get(fullKey)
    return value ? JSON.parse(value) : null
  }

  async set(traceId: string, key: string, value: any) {
    const fullKey = this._makeKey(traceId, key)
    await this.client.set(fullKey, JSON.stringify(value), 'EX', this.ttl)
  }

  async delete(traceId: string, key: string) {
    const fullKey = this._makeKey(traceId, key)
    await this.client.del(fullKey)
  }

  async clear(traceId: string) {
    const pattern = this._makeKey(traceId, '*')
    const keys = await this.client.keys(pattern)
    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  async cleanup() {
    await this.client.quit()
  }

  _makeKey(traceId: string, key: string) {
    return `${this.prefix}:${traceId}:${key}`
  }
}
