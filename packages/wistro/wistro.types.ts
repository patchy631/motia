import { z, ZodObject } from 'zod'
import { Server } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Logger } from './dev/logger'
import { StateAdapter } from './state/StateAdapter'

export type EmitData = { type: string; data: Record<string, unknown> }
export type Emitter = (event: EmitData) => Promise<void>
export type FlowContext = {
  emit: Emitter
  traceId: string
  state: StateAdapter
  logger: Logger
}
export type EventHandler<TInput extends ZodObject<any>> = (input: z.infer<TInput>, ctx: FlowContext) => Promise<void>

export type Emit = string | { type: string; label?: string; conditional?: boolean }

export type EventConfig<TInput extends ZodObject<any>> = {
  type: 'event'
  name: string
  description?: string
  subscribes: string[]
  emits: Emit[]
  virtualEmits?: Emit[]
  input: TInput
  flows: string[]
}

export type NoopConfig = {
  type: 'noop'
  name: string
  description?: string
  virtualEmit: Emit
  virtualSubscribes?: string[]
  flows: string[]
}

export type ApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

export type ApiRouteConfig = {
  type: 'api'
  name: string
  description?: string
  path: string
  method: ApiRouteMethod
  emits: string[]
  virtualEmits?: Emit[]
  virtualSubscribes?: string[]
  flows: string[]
  bodySchema?: ZodObject<any>
}

export type ApiRequest = {
  pathParams: Record<string, string>
  queryParams: Record<string, string | string[]>
  body: Record<string, any>
  headers: Record<string, string | string[]>
}

export type ApiResponse = {
  status: number
  headers?: Record<string, string>
  body: string | Buffer | Record<string, any>
}

export type ApiRouteHandler = (req: ApiRequest, ctx: FlowContext) => Promise<ApiResponse>

export type StepHandler<T> =
  T extends EventConfig<any> ? EventHandler<T['input']> : T extends ApiRouteConfig ? ApiRouteHandler : never

export type WistroServer = Server<any>
export type WistroSockerServer = SocketIOServer

export type Event<TData> = {
  type: string
  data: TData
  traceId: string
  flows: string[]
  logger: Logger
}

export type Handler<TData = unknown> = (event: Event<TData>) => Promise<void>

export type EventManager = {
  emit: <TData>(event: Event<TData>, file?: string) => Promise<void>
  subscribe: <TData>(event: string, handlerName: string, handler: Handler<TData>) => void
}

export type LockFlow = {
  name: string
  description: string
  steps: { filePath: string; version: string }[]
  version: string
}

export type LockFile = {
  baseDir: string
  version: string
  port?: number
  flows: Record<string, LockFlow>
  state: {
    adapter: string
    host: string
    port: number
  }
  triggers: {
    api: {
      paths: Record<
        string,
        {
          method: string
          emits: string
          name: string
          description: string
          flows: string[]
        }
      >
    }
    cron: Record<
      string,
      {
        name: string
        description: string
        cron: string
        emits: string
        flows: string[]
      }
    >
  }
}

export type StepConfig = EventConfig<ZodObject<any>> | NoopConfig | ApiRouteConfig
