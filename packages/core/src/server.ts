import { CronManager, setupCronHandlers } from './cron-handler'
import bodyParser from 'body-parser'
import express, { Express, Request, Response } from 'express'
import http from 'http'
import { Server as WsServer } from 'ws'
import multer from 'multer'
import cors from 'cors'
import { flowsEndpoint } from './flows-endpoint'
import { isApiStep } from './guards'
import { globalLogger } from './logger'
import {
  ApiRequest,
  ApiResponse,
  ApiRouteConfig,
  ApiRouteMethod,
  BaseStateStreamData,
  EventManager,
  InternalStateManager,
  IStateStream,
  StateStreamEvent,
  StateStreamEventChannel,
  Step,
} from './types'
import { systemSteps } from './steps'
import { LockedData } from './locked-data'
import { callStepFile } from './call-step-file'
import { LoggerFactory } from './logger-factory'
import { generateTraceId } from './generate-trace-id'
import { flowsConfigEndpoint } from './flows-config-endpoint'
import { apiEndpoints } from './streams/api-endpoints'
import { createSocketServer } from './socket-server'
import { Log, LogsStream } from './streams/logs-stream'

export type MotiaServer = {
  app: Express
  server: http.Server
  socketServer: WsServer
  close: () => Promise<void>
  removeRoute: (step: Step<ApiRouteConfig>) => void
  addRoute: (step: Step<ApiRouteConfig>) => void
  cronManager: CronManager
}

type MotiaServerConfig = {
  isVerbose: boolean
}

export const createServer = async (
  lockedData: LockedData,
  eventManager: EventManager,
  state: InternalStateManager,
  config: MotiaServerConfig,
): Promise<MotiaServer> => {
  const printer = lockedData.printer
  const app = express()
  const server = http.createServer(app)
  const upload = multer()

  const { pushEvent, socketServer } = createSocketServer({
    server,
    onJoin: async (streamName: string, id: string) => {
      const streams = lockedData.getStreams()
      const stream = streams[streamName]

      if (stream) {
        const result = await stream(state).get(id)
        delete result.__motia // deleting because we don't need it in the socket
        return result
      }
    },
    onJoinGroup: async (streamName: string, groupId: string) => {
      const streams = lockedData.getStreams()
      const stream = streams[streamName]

      if (stream) {
        const result = stream ? await stream(state).getList(groupId) : []
        return result.map(({ __motia, ...rest }) => rest)
      }
    },
  })

  lockedData.applyStreamWrapper((streamName, stream) => {
    return (state: InternalStateManager): IStateStream<BaseStateStreamData> => {
      const suuper = stream(state)
      const wrapObject = (id: string, object: any) => ({
        ...object,
        __motia: { type: 'state-stream', streamName, id },
      })

      const wrapper: IStateStream<BaseStateStreamData> = {
        ...suuper,

        async send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>) {
          pushEvent({ streamName, ...channel, event: { type: 'event', event } })
        },

        async get(id: string) {
          const result = await suuper.get.apply(wrapper, [id])
          return wrapObject(id, result)
        },

        async update(id: string, data: BaseStateStreamData) {
          if (!data) {
            return null
          }

          const updated = await suuper.update.apply(wrapper, [id, data])
          const result = updated ?? data
          const wrappedResult = wrapObject(id, result)
          const groupId = suuper.getGroupId(result)

          pushEvent({ streamName, id, event: { type: 'update', data: result } })

          if (groupId) {
            pushEvent({ streamName, groupId, event: { type: 'update', data: result } })
          }

          return wrappedResult
        },

        async delete(id: string) {
          const result = await suuper.delete.apply(wrapper, [id])
          const groupId = result && suuper.getGroupId(result)

          pushEvent({ streamName, id, event: { type: 'delete', data: result } })

          if (groupId) {
            pushEvent({ streamName, groupId, event: { type: 'delete', data: result } })
          }

          return wrapObject(id, result)
        },

        async create(id: string, data: BaseStateStreamData) {
          const created = await suuper.create.apply(wrapper, [id, data])
          const result = created ?? data
          const wrappedResult = wrapObject(id, result)
          const groupId = suuper.getGroupId(result)

          pushEvent({ streamName, id, event: { type: 'create', data: result } })

          if (groupId) {
            pushEvent({ streamName, groupId, event: { type: 'create', data: result } })
          }

          return wrappedResult
        },

        getList: async (groupId: string) => {
          const list = await suuper.getList.apply(wrapper, [groupId])
          return list.map((object: BaseStateStreamData) => wrapObject(object.id, object))
        },
      }

      return wrapper
    }
  })

  const logStream = lockedData.createStream<Log>({
    filePath: '__motia.logs',
    hidden: true,
    config: {
      name: '__motia.logs',
      baseConfig: { type: 'custom', factory: () => new LogsStream() },
      schema: null as never,
    },
  })(state)

  const allSteps = [...systemSteps, ...lockedData.activeSteps]
  const loggerFactory = new LoggerFactory(config.isVerbose, logStream)
  const cronManager = setupCronHandlers(lockedData, eventManager, state, loggerFactory)

  const asyncHandler = (step: Step<ApiRouteConfig>) => {
    return async (req: Request, res: Response) => {
      const traceId = generateTraceId()
      const { name: stepName, flows } = step.config
      const logger = loggerFactory.create({ traceId, flows, stepName })

      logger.debug('[API] Received request, processing step', { path: req.path })

      const request: ApiRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | string[]>,
        pathParams: req.params,
        queryParams: req.query as Record<string, string | string[]>,
        files: req.files,
      }

      try {
        const data = request
        const result = await callStepFile<ApiResponse>({
          contextInFirstArg: false,
          lockedData,
          data,
          step,
          printer,
          logger,
          eventManager,
          state,
          traceId,
        })

        if (!result) {
          res.status(500).json({ error: 'Internal server error' })
          return
        }

        if (result.headers) {
          Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value))
        }

        res.status(result.status)
        res.json(result.body)
      } catch (error) {
        logger.error('[API] Internal server error', { error })
        console.log(error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  const router = express.Router()

  const addRoute = (step: Step<ApiRouteConfig>) => {
    const { method, path } = step.config
    globalLogger.debug('[API] Registering route', step.config)

    const handler = asyncHandler(step)
    const methods: Record<ApiRouteMethod, () => void> = {
      GET: () => router.get(path, handler),
      POST: () => router.post(path, upload.any(), handler),
      PUT: () => router.put(path, upload.any(), handler),
      DELETE: () => router.delete(path, handler),
      PATCH: () => router.patch(path, upload.any(), handler),
      OPTIONS: () => router.options(path, handler),
      HEAD: () => router.head(path, handler),
    }

    const methodHandler = methods[method]
    if (!methodHandler) {
      throw new Error(`Unsupported method: ${method}`)
    }

    methodHandler()
  }

  const removeRoute = (step: Step<ApiRouteConfig>) => {
    const { path, method } = step.config
    const routerStack = router.stack

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredStack = routerStack.filter((layer: any) => {
      if (layer.route) {
        const match = layer.route.path === path && layer.route.methods[method.toLowerCase()]
        return !match
      }
      return true
    })
    router.stack = filteredStack
  }

  allSteps.filter(isApiStep).forEach(addRoute)

  app.use(cors())
  app.use(router)

  apiEndpoints(lockedData, state)
  flowsEndpoint(lockedData, app, state)
  flowsConfigEndpoint(app, process.cwd())

  server.on('error', (error) => {
    console.error('Server error:', error)
  })

  const close = async (): Promise<void> => {
    cronManager.close()
    socketServer.close()
  }

  return { app, server, socketServer, close, removeRoute, addRoute, cronManager }
}
