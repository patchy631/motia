import { Event } from 'wistro'

export type RequestOptions = {
  body?: Record<string, unknown>
}

export type Log = {
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any
}

export type CapturedEvent<TData = unknown> = Omit<Event<TData>, 'logger'>
