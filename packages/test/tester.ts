import request, { Response } from 'supertest'
import { createServer, Event } from 'wistro'
import { buildFlows } from 'wistro/dev/flow-builder'
import { createFlowHandlers } from 'wistro/dev/flow-handlers'
import { loadLockFile } from 'wistro/dev/load-lock-file'
import { createStateAdapter } from 'wistro/state/createStateAdapter'
import { createEventManager } from './event-manager'
import { CapturedEvent, RequestOptions } from './types'

type Watcher<TData = unknown> = {
  getCapturedEvents(): CapturedEvent<TData>[]
  getLastCapturedEvent(): CapturedEvent<TData> | undefined
  getCapturedEvent(index: number): CapturedEvent<TData> | undefined
}

interface WistroTester {
  post(path: string, options: RequestOptions): Promise<Response>
  get(path: string, options: RequestOptions): Promise<Response>
  emit(event: Event<any>): Promise<void>
  watch<TData>(event: string): Promise<Watcher<TData>>
  sleep(ms: number): Promise<void>
  close(): Promise<void>
  waitEvents(): Promise<void>
}

export const createWistroTester = (): WistroTester => {
  const eventManager = createEventManager()
  const promise = (async () => {
    const lockData = loadLockFile()
    const steps = await buildFlows(lockData)
    const state = createStateAdapter(lockData.state)
    const { server, socketServer } = await createServer({ steps, state, eventManager, disableUi: true })

    createFlowHandlers(steps, eventManager, lockData.state)

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
