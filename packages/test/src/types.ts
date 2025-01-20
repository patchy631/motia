import type { Event } from '@motiadev/core'

export type RequestOptions = {
  body?: Record<string, unknown>
}

export type CapturedEvent<TData = unknown> = Omit<Event<TData>, 'logger'>
