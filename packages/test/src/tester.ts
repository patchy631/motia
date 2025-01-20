import request, { Response } from 'supertest'
import { createServer, createStateAdapter, createStepHandlers, Event } from '@motiadev/core'
import { generateLockedData } from '@motiadev/snap/src/generate-locked-data'
import { createEventManager } from './event-manager'
import { CapturedEvent, RequestOptions } from './types'
import path from 'path'

type Watcher<TData = unknown> = {
  getCapturedEvents(): CapturedEvent<TData>[]
  getLastCapturedEvent(): CapturedEvent<TData> | undefined
  getCapturedEvent(index: number): CapturedEvent<TData> | undefined
}

interface MotiaTester {
  post(path: string, options: RequestOptions): Promise<Response>
  get(path: string, options: RequestOptions): Promise<Response>
  emit(event: Event<any>): Promise<void>
  watch<TData>(event: string): Promise<Watcher<TData>>
  sleep(ms: number): Promise<void>
  close(): Promise<void>
  waitEvents(): Promise<void>
}

export const createMotiaTester = (): MotiaTester => {
  const eventManager = createEventManager()
  const promise = (async () => {
    const lockedData = await generateLockedData(path.join(process.cwd()))
    const steps = [...lockedData.steps.active, ...lockedData.steps.dev]
    const state = createStateAdapter({
      adapter: 'default',
      filePath: path.join(process.cwd(), '.motia'),
    })
    const { server, socketServer } = await createServer({
      steps,
      flows: lockedData.flows,
      state,
      eventManager,
    })

    createStepHandlers(steps, eventManager, state)

    return { server, socketServer, eventManager, state }
  })()

  return {
    waitEvents: async () => {
      const { eventManager } = await promise
      await eventManager.waitEvents()
    },
    post: async (path, options) => {
      const { server } = await promise
      return request(server).post(path).send(options.body)
    },
    get: async (path, options) => {
      const { server } = await promise
      return request(server).get(path).send(options.body)
    },
    emit: async (event) => {
      return eventManager.emit(event)
    },
    watch: async <TData>(event: string) => {
      const events: CapturedEvent<TData>[] = []

      eventManager.subscribe(event, '$watcher', async (event: Event<TData>) => {
        const { logger, ...rest } = event
        events.push(rest)
      })

      return {
        getCapturedEvents: () => events,
        getLastCapturedEvent: () => events[events.length - 1],
        getCapturedEvent: (index) => events[index],
      }
    },
    sleep: async (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
    close: async () => {
      const { server, socketServer, state } = await promise
      await state.cleanup()
      await socketServer.close()
      server.close()
    },
  }
}
