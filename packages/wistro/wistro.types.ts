import { z, ZodObject } from 'zod'
import { Server } from 'http'
import { Server as SocketIOServer } from 'socket.io'

export type Emitter = (event: any) => Promise<void>
export type FlowContext = {
  traceId: string
  state: {
    get: <T>(traceId: string, key: string) => Promise<T>
    clear: (traceId: string) => Promise<void>
    set: <T>(traceId: string, key: string, value: T) => Promise<void>
  }
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
  flows: string[]
}

export type Flow<TInput extends ZodObject<any>> = {
  config: FlowConfig<TInput>
  executor: FlowExecutor<TInput>
}

export type WistroServer = Server<any>
export type WistroSockerServer = SocketIOServer

export type Event<TData> = {
  type: string
  data: TData
  traceId: string
}

export type Handler<TData = unknown> = (event: Event<TData>) => Promise<void>

export type EventManager = {
  emit: <TData>(event: Event<TData>) => Promise<void>
  subscribe: <TData>(event: string, handlerName: string, handler: Handler<TData>) => void
}
