import { test, expect } from '@playwright/test'
import path from 'path'
import { createTestServer, Event, WistroServer } from 'wistro'

test.describe('WistroServerExample + Redis E2E', () => {
  let collectedEvents: Array<Event<unknown>> = []
  let server: WistroServer
  let eventSubscriber = (event: Event<unknown>) => {
    collectedEvents.push(event)
  }

  test.beforeAll(async () => {
    const result = await createTestServer(path.join(__dirname, '../../'), eventSubscriber)
    server = result.server
  })

  test.afterAll(async () => {
    await server.close()
  })

  test.beforeEach(async () => {
    // Reset our array for each test
    collectedEvents = []
  })

  test('verifies wistroServerExample flow & Redis events', async ({ page }) => {
    // 2) Navigate to Playground UI
    await page.goto('http://localhost:3000')
    await expect(page.locator('text=Wistro Server Example')).toBeVisible()

    // 3) Select the "wistroServerExample" flow
    const flowSelect = page.locator('select')
    await flowSelect.selectOption('wistroServerExample')

    // For example, wait for a node named "Start Event"
    await expect(page.locator('text=.start').first()).toBeVisible()

    // 4) Trigger the flow by POSTing to the Wistro server
    const response = await fetch('http://localhost:3000/api/wistro-server-example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ greeting: 'Hello from Redis E2E test' }),
    })
    expect(response.status).toBe(200)

    // Give time for the flow to run and events to publish
    await page.waitForTimeout(1000)

    // 5) Assert we saw expected Redis events
    // For example, if your flow emits “wistroServerExample.started”, “wistroServerExample.processed”, etc.
    const eventTypes = collectedEvents.map((ev) => ev.type)

    // Check that we have at least one or more relevant event types
    // Adjust these to match your actual event names:
    expect(eventTypes).toEqual(
      expect.arrayContaining(['ws-server-example.trigger', 'ws-server-example.start', 'ws-server-example.processed']),
    )

    // Optional: Inspect the data of a particular event
    const doneEvent = collectedEvents.find((ev) => ev.type === 'ws-server-example.processed')
    expect(doneEvent).toBeDefined()
    // If there's some known shape of doneEvent.data, e.g. { result: ... }
    // expect(doneEvent.data.result).toBe("SomeValue");

    // 6) Optionally confirm the final UI state
    // e.g., a "Finalizer" node or some text indicating completion
    await expect(page.locator('text=Subscribes: ws-server-example.processed')).toBeVisible()
  })
})
