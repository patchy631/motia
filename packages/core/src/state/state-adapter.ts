import { InternalStateManager } from '../types'

/**
 * Interface for state management adapters
 */
export interface StateAdapter extends InternalStateManager {
  get<T>(traceId: string, key: string): Promise<T | null>
  set<T>(traceId: string, key: string, value: T): Promise<T>
  delete<T>(traceId: string, key: string): Promise<T | null>
  clear(traceId: string): Promise<void>
  cleanup(): Promise<void>

  keys(traceId: string): Promise<string[]>
  traceIds(): Promise<string[]>
}
