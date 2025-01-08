import { applyMiddleware } from '@wistro/ui'
import { Server as SocketIOServer } from 'socket.io'
import bodyParser from 'body-parser'
import { randomUUID } from 'crypto'
import express, { Request, Response } from 'express'
import http from 'http'
import { Config, FlowStep } from './config.types'
import { Event, EventManager, WistroServer, WistroSockerServer } from './../wistro.types'

export const createServer = async (
  config: Config,
  flowSteps: FlowStep[],
  eventManager: EventManager,
  options?: {
    skipSocketServer?: boolean
  },
): Promise<{ server: WistroServer; socketServer?: WistroSockerServer }> => {
  const app = express()
  const server = http.createServer(app)
  let io: SocketIOServer | undefined

  if (!options?.skipSocketServer) {
    io = new SocketIOServer(server)
  }

  console.log('[API] Registering routes', config.api.paths)

  const asyncHandler = (emits: string) => {
    return async (req: Request, res: Response) => {
      const traceId = randomUUID()
      const event: Event<unknown> = {
        traceId,
        type: emits,
        data: req.body,
      }

      console.log('[API] Request received', event)

      try {
        await eventManager.emit(event)
        res.send({ success: true, eventType: emits, traceId })
      } catch (error) {
        console.error('[API] Error emitting event', error)
        res.status(500).send({ error: 'Internal server error' })
      }
    }
  }

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  for (const path in config.api.paths) {
    const { method, emits } = config.api.paths[path]

    console.log('[API] Registering route', { method, path, emits })

    if (method === 'POST') {
      app.post(path, asyncHandler(emits))
    } else if (method === 'GET') {
      app.get(path, asyncHandler(emits))
    } else {
      throw new Error(`Unsupported method: ${method}`)
    }
  }

  flowsEndpoint(config, flowSteps, app)
  await applyMiddleware(app)

  console.log('[API] Server listening on port', config.port)

  server.listen(config.port)

  return { server, socketServer: io }
}
