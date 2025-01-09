import { createTestServer } from 'wistro'
import path from 'path'

let server: import('http').Server
let allEvents: Array<any> = []

export default async function globalSetup() {
  const eventSubscriber = (event: any) => {
    allEvents.push(event)
  }

  const result = await createTestServer(
    path.join(__dirname, '../../../'),
    eventSubscriber,
    /* any config overrides, port, etc. */
  )

  server = result.server
  // Store references in the globalThis or a global object
  globalThis.__TEST_SERVER__ = server
  globalThis.__ALL_EVENTS__ = allEvents
}
