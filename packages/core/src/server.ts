import { CronManager, setupCronHandlers } from './cron-handler'
import bodyParser from 'body-parser'
import express, { Express, Request, Response } from 'express'
import http from 'http'
import multer from 'multer'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import { flowsEndpoint } from './flows-endpoint'
import { isApiStep } from './guards'
import { globalLogger } from './logger'
import { StateAdapter } from './state/state-adapter'
import { ApiRequest, ApiResponse, ApiRouteConfig, ApiRouteMethod, EventManager, Step } from './types'
import { systemSteps } from './steps'
import { LockedData } from './locked-data'
import { callStepFile } from './call-step-file'
import { LoggerFactory } from './LoggerFactory'
import { generateTraceId } from './generate-trace-id'
import { flowsConfigEndpoint } from './flows-config-endpoint'
import { createTelemetry, Telemetry } from './telemetry'
import { apiEndpoints } from './api-endpoints'

export type MotiaServer = {
  app: Express
  server: http.Server
  socketServer: SocketIOServer
  close: () => Promise<void>
  removeRoute: (step: Step<ApiRouteConfig>) => void
  addRoute: (step: Step<ApiRouteConfig>) => void
  cronManager: CronManager
  telemetry?: Telemetry
}

type MotiaServerConfig = {
  isVerbose: boolean
  telemetry?: {
    enabled?: boolean
    serviceName?: string
    serviceVersion?: string
    environment?: string
    endpoint?: string
    debug?: boolean
    customAttributes?: Record<string, string>
  }
}

export const createServer = async (
  lockedData: LockedData,
  eventManager: EventManager,
  state: StateAdapter,
  config: MotiaServerConfig,
): Promise<MotiaServer> => {
  // Pass telemetry to lockedData if it wasn't already set
  if (lockedData.telemetry === undefined && config.telemetry?.enabled !== false) {
    lockedData.telemetry = createTelemetry({
      serviceName: config.telemetry?.serviceName || 'motia-core',
      serviceVersion: process.env.npm_package_version || '0.0.0',
      environment: config.telemetry?.environment || process.env.NODE_ENV || 'development',
      instrumentationName: 'motia-core',
      tracing: {
        endpoint: config.telemetry?.endpoint,
        debug: config.telemetry?.debug || false,
      },
      customAttributes: config.telemetry?.customAttributes,
      enableGlobalErrorHandlers: true,
    });
  }

  const printer = lockedData.printer
  const app = express()
  const server = http.createServer(app)
  const io = new SocketIOServer(server)
  const loggerFactory = new LoggerFactory(config.isVerbose, io)
  const upload = multer()

  const allSteps = [...systemSteps, ...lockedData.activeSteps]
  const cronManager = setupCronHandlers(lockedData, eventManager, state, loggerFactory, lockedData.telemetry)


  const asyncHandler = (step: Step<ApiRouteConfig>) => {
    return async (req: Request, res: Response) => {
      const traceId = generateTraceId()
      const { name: stepName, flows } = step.config
      const logger = loggerFactory.create({ traceId, flows, stepName })

      logger.debug('[API] Received request, processing step', { path: req.path })

      const spanName = `api.${step.config.method.toLowerCase()}.${stepName}`

      lockedData.telemetry?.tracer.startActiveSpan(spanName, async (span) => {
        // Set span attributes for the API request
        lockedData.telemetry?.tracer.setAttributes({
          'http.method': req.method,
          'http.url': req.url,
          'http.route': step.config.path,
          'step.name': stepName,
          'step.type': 'api',
          'trace.id': traceId,
        });

        const request: ApiRequest = {
          body: req.body,
          headers: req.headers as Record<string, string | string[]>,
          pathParams: req.params,
          queryParams: req.query as Record<string, string | string[]>,
          files: req.files,
        }

        try {
          // Record request metrics
          lockedData.telemetry?.metrics.incrementCounter('api.requests', 1, {
            method: req.method,
            path: req.path,
            stepName,
          });

          // Start timer for request duration
          const endTimer = lockedData.telemetry?.metrics.startTimer('api.request.duration', {
            method: req.method,
            path: req.path,
            stepName,
          });

          const data = request
          const result = await callStepFile<ApiResponse>({
            contextInFirstArg: false,
            data,
            step,
            printer,
            logger,
            eventManager,
            state,
            traceId,
            telemetry: lockedData.telemetry,
          })

          // End timer and record duration
          if (endTimer) endTimer();

          if (!result) {
            lockedData.telemetry?.tracer.addEvent('api.response.error', {
              error: 'Internal server error',
              status: 500
            });
            lockedData.telemetry?.metrics.incrementCounter('api.errors', 1, {
              method: req.method,
              path: req.path,
              status: '500',
              error: 'Internal server error'
            });

            res.status(500).json({ error: 'Internal server error' })
            return
          }

          if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value))
          }

          lockedData.telemetry?.tracer.addEvent('api.response.success', {
            status: result.status
          });
          lockedData.telemetry?.metrics.incrementCounter('api.responses', 1, {
            method: req.method,
            path: req.path,
            status: result.status.toString()
          });

          res.status(result.status)
          res.json(result.body)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'

          lockedData.telemetry?.tracer.recordException(error instanceof Error ? error : new Error(errorMessage))
          lockedData.telemetry?.metrics.incrementCounter('api.errors', 1, {
            method: req.method,
            path: req.path,
            status: '500',
            error: errorMessage
          });

          logger.error(`Error handling request: ${errorMessage}`)
          res.status(500).json({ error: errorMessage })
        }
      })
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

    lockedData.telemetry?.metrics.incrementCounter('api.routes.added', 1, {
      method: step.config.method,
      path: step.config.path,
      step_name: step.config.name,
    });

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

    lockedData.telemetry?.metrics.incrementCounter('api.routes.removed', 1, {
      method: step.config.method,
      path: step.config.path,
      step_name: step.config.name,
    });

    router.stack = filteredStack
  }

  allSteps.filter(isApiStep).forEach(addRoute)

  app.use(cors())
  app.use(router)

  apiEndpoints(lockedData, app, io)
  flowsEndpoint(lockedData, app)
  flowsConfigEndpoint(app, process.cwd())

  server.on('error', (error) => {
    console.error('Server error:', error)
    lockedData.telemetry?.tracer.recordException(error instanceof Error ? error : new Error('Server error'));
  })

  const close = async (): Promise<void> => {
    cronManager.close()
    await io.close()
    server.close()

    // Shutdown telemetry
    if (lockedData.telemetry) {
      await lockedData.telemetry.shutdown();
    }
  }

  return { app, server, socketServer: io, close, removeRoute, addRoute, cronManager, telemetry: lockedData.telemetry }
}
