import request, { Response } from 'supertest'
import { createServer, Event } from 'wistro'
import { createEventManager } from 'wistro/dev/event-manager'
import { buildFlows } from 'wistro/dev/flow-builder'
import { loadLockFile } from 'wistro/dev/load-lock-file'
import { createStateAdapter } from 'wistro/state/createStateAdapter'
import { createFlowHandlers } from 'wistro/dev/flow-handlers'
import { CapturedEvent, Log, RequestOptions } from './types'

type Watcher<TData = unknown> = {
  pullEvents(quantity: number, options?: { timeout?: number }): Promise<void>
  getCapturedEvents(): CapturedEvent<TData>[]
  getLastCapturedEvent(): CapturedEvent<TData> | undefined
  getCapturedEvent(index: number): CapturedEvent<TData> | undefined
}

interface WistroTester {
  watchLog(callback: (event: Log) => void): Promise<VoidFunction>
  post(path: string, options: RequestOptions): Promise<Response>
  get(path: string, options: RequestOptions): Promise<Response>
  emit(event: Event<any>): Promise<void>
  watch<TData>(event: string): Promise<Watcher<TData>>
  sleep(ms: number): Promise<void>
  close(): Promise<void>
}

export const createWistroTester = (): WistroTester => {
  const promise = (async () => {
    const lockData = loadLockFile()
    const steps = await buildFlows(lockData)
    const eventManager = createEventManager()
    const state = createStateAdapter(lockData.state)
    const { server, socketServer } = await createServer({ steps, state, eventManager, disableUi: true })

    createFlowHandlers(steps, eventManager, lockData.state)

    return { server, socketServer, eventManager, state }
  })()

  return {
    watchLog: async (callback) => {
      const { socketServer } = await promise
      socketServer.on('log', callback)

      return () => {
        socketServer.off('log', callback)
      }
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
      const { eventManager } = await promise
      return eventManager.emit(event)
    },
    watch: async <TData>(event: string) => {
      const { eventManager } = await promise
      const events: CapturedEvent<TData>[] = []

      eventManager.subscribe(event, '$watcher', async (event: Event<TData>) => {
        const { logger, ...rest } = event
        events.push(rest)
      })

      const watcher: Watcher<TData> = {
        pullEvents: async (count, options) => {
          let elapsedTime = 0

          await new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
              elapsedTime += 10

              if (events.length >= count) {
                clearInterval(intervalId)
                resolve(void 0)
              } else if (elapsedTime >= (options?.timeout ?? 1000)) {
                clearInterval(intervalId)
                reject(new Error('Timeout waiting for event'))
              }
            }, 10)
          })
        },
        getCapturedEvents: () => events,
        getLastCapturedEvent: () => events[events.length - 1],
        getCapturedEvent: (index) => events[index],
      }

      return watcher
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
