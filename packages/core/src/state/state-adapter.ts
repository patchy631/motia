/**
 * Interface for state management adapters
 */
export interface StateAdapter {
  get<T>(traceId: string, key: string): Promise<T | null>
  set<T>(traceId: string, key: string, value: T): Promise<void>
  delete(traceId: string, key: string): Promise<void>
  clear(traceId: string): Promise<void>
  cleanup(): Promise<void>
}
