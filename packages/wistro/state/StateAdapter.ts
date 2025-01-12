/**
 * Interface for state management adapters
 */
export class StateAdapter {
  async get<T>(traceId: string, key: string): Promise<T | null> {
    throw new Error('Method not implemented')
  }

  async set<T>(traceId: string, key: string, value: T) {
    throw new Error('Method not implemented')
  }

  async delete(traceId: string, key: string) {
    throw new Error('Method not implemented')
  }

  async clear(traceId: string) {
    throw new Error('Method not implemented')
  }

  async cleanup() {
    throw new Error('Method not implemented')
  }
}
