import { z, ZodObject } from 'zod'
import { Logger } from './dev/logger'

export type Emitter = (event: any) => Promise<void>
export type FlowContext = {
  traceId: string
  state: {
    get: <T>(traceId: string, key: string) => Promise<T>
    clear: (traceId: string) => Promise<void>
    set: <T>(traceId: string, key: string, value: T) => Promise<void>
  }
  logger: Logger
}
export type FlowExecutor<TInput extends ZodObject<any>> = (
  input: z.infer<TInput>,
  emit: Emitter,
  ctx: FlowContext,
) => Promise<void>

export type Emit = string | { type: string; label?: string; conditional?: boolean }

export type FlowConfig<TInput extends ZodObject<any>> = {
  name: string
  description?: string
  subscribes: string[]
  emits: Emit[]
  input: TInput
  workflow: string
}

export type Flow<TInput extends ZodObject<any>> = {
  config: FlowConfig<TInput>
  executor: FlowExecutor<TInput>
}
