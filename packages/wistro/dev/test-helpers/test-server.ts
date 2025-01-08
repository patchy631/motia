import path from 'path'
import fs from 'fs'
import { parse } from 'yaml'
import { Config } from './../config.types'
import { buildFlows } from './../flow-builder'
import { createEventManager } from './../event-manager'
import { createServer } from './../server'
import { WistroServer, EventManager, Event } from './../../wistro.types'
import { createFlowHandlers } from './../flow-handlers'

type Response = Promise<{
  eventManager: EventManager
  server: WistroServer
}>

export const createTestServer = async <EData>(
  configPath: string,
  eventSubscriber?: (event: Event<EData>) => void,
  configOverrides?: Config,
): Response => {
  const configYaml = fs.readFileSync(path.join(configPath, 'config.yml'), 'utf8')
  const config: Config = parse(configYaml)
  const flowSteps = await buildFlows()
  const eventManager = createEventManager(eventSubscriber as (event: Event<unknown>) => void)
  const { server } = await createServer({ ...config, ...(configOverrides ?? {}) }, flowSteps, eventManager, {
    skipSocketServer: true,
  })

  createFlowHandlers(flowSteps, eventManager, config.state)

  return { server, eventManager }
}
