import { z, ZodObject } from 'zod'
import { BaseLogger, Logger } from './logger'

export type InternalStateManager = {
  get<T>(traceId: string, key: string): Promise<T | null>
  set<T>(traceId: string, key: string, value: T): Promise<T>
  delete(traceId: string, key: string): Promise<void>
  clear(traceId: string): Promise<void>
}

export type EmitData = { topic: ''; data: unknown }
export type Emitter<TData> = (event: TData) => Promise<void>

export interface FlowContextStreams {}

export interface StreamConfig {
  name: string
  type: 'object' | 'list'
  schema: ZodObject<any>
}

export interface FlowContext<TEmitData> {
  emit: Emitter<TEmitData>
  traceId: string
  state: InternalStateManager
  logger: Logger
  streams: FlowContextStreams
}

export interface ObjectStream<TData extends object> {
  get(id: string): Promise<TData | null>
  update(id: string, data: TData): Promise<TData>
  delete(id: string): Promise<void>
  create(id: string, data: TData): Promise<TData>

  getGroupId(data: TData): string | null
  getList(groupId: string): Promise<TData[]>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandler<TInput extends ZodObject<any>, TEmitData> = (
  input: z.infer<TInput>,
  ctx: FlowContext<TEmitData>,
) => Promise<void>

export type Emit = string | { topic: string; label?: string; conditional?: boolean }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventConfig<TInput extends ZodObject<any> = any> = {
  type: 'event'
  name: string
  description?: string
  subscribes: string[]
  emits: Emit[]
  virtualEmits?: Emit[]
  input: TInput
  flows?: string[]
  /**
   * Files to include in the step bundle.
   * Needs to be relative to the step file.
   */
  includeFiles?: string[]
}

export type NoopConfig = {
  type: 'noop'
  name: string
  description?: string
  virtualEmits: Emit[]
  virtualSubscribes: string[]
  flows?: string[]
}

export type ApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

export type ApiMiddleware<TBody = {}, TEmitData = never, TResult = unknown> = (
  req: ApiRequest<TBody>,
  ctx: FlowContext<TEmitData>,
  next: () => Promise<ApiResponse<TResult>>,
) => Promise<ApiResponse<TResult>>

type QueryParam = {
  name: string
  description: string
}

export type ApiRouteConfig = {
  type: 'api'
  name: string
  description?: string
  path: string
  method: ApiRouteMethod
  emits: Emit[]
  virtualEmits?: Emit[]
  virtualSubscribes?: string[]
  flows?: string[]
  middleware?: ApiMiddleware<any, any, any>[]
  bodySchema?: ZodObject<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  responseBody?: ZodObject<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  queryParams?: QueryParam[]
  /**
   * Files to include in the step bundle.
   * Needs to be relative to the step file.
   */
  includeFiles?: string[]
}

export type ApiRequest<TBody> = {
  pathParams: Record<string, string>
  queryParams: Record<string, string | string[]>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: TBody
  headers: Record<string, string | string[]>
  files?:
    | Express.Multer.File[]
    | {
        [fieldname: string]: Express.Multer.File[]
      }
}

export type ApiResponse<TBody = string | Buffer | Record<string, unknown>> = {
  status: number
  headers?: Record<string, string>
  body: TBody
}

export type ApiRouteHandler<TRequestBody = never, TResponseBody = never, TEmitData = never> = (
  req: ApiRequest<TRequestBody>,
  ctx: FlowContext<TEmitData>,
) => Promise<ApiResponse<TResponseBody>>

export type CronConfig = {
  type: 'cron'
  name: string
  description?: string
  cron: string
  virtualEmits?: Emit[]
  emits: Emit[]
  flows?: string[]
  /**
   * Files to include in the step bundle.
   * Needs to be relative to the step file.
   */
  includeFiles?: string[]
}

export type CronHandler<TEmitData = never> = (ctx: FlowContext<TEmitData>) => Promise<void>

export type StepHandler<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends EventConfig<any>
    ? EventHandler<T['input'], { topic: string; data: any }>
    : T extends ApiRouteConfig
      ? ApiRouteHandler<any, any, { topic: string; data: any }>
      : T extends CronConfig
        ? CronHandler<{ topic: string; data: any }>
        : never

export type Event<TData = unknown> = {
  topic: string
  data: TData
  traceId: string
  flows?: string[]
  logger: BaseLogger
}

export type Handler<TData = unknown> = (event: Event<TData>) => Promise<void>

export type SubscribeConfig<TData> = {
  event: string
  handlerName: string
  filePath: string
  handler: Handler<TData>
}

export type UnsubscribeConfig = {
  filePath: string
  event: string
}

export type EventManager = {
  emit: <TData>(event: Event<TData>, file?: string) => Promise<void>
  subscribe: <TData>(config: SubscribeConfig<TData>) => void
  unsubscribe: (config: UnsubscribeConfig) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StepConfig = EventConfig<ZodObject<any>> | NoopConfig | ApiRouteConfig | CronConfig

export type Step<TConfig extends StepConfig = StepConfig> = { filePath: string; version: string; config: TConfig }

export type Flow = {
  name: string
  description?: string
  steps: Step[]
}

export type Handlers = {
  [key: string]: StepHandler<StepConfig>
}
