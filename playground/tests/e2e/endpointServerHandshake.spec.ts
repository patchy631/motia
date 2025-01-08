import { test, expect } from '@playwright/test'
import path from 'path'
import { createTestServer, WistroServer, Event } from 'wistro'

test.describe('endpointServerHandshake + Redis E2E', () => {
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

  test('Verifies handshake flow & Redis events are published', async ({ page }) => {
    // 1) Go to the Playground UI
    await page.goto('http://localhost:3000')
    // Wait for the flow dropdown or a known element
    await expect(page.locator('text=Endpoint Server Handshake')).toBeVisible()

    // 2) Select 'endpointServerHandshake' in the dropdown (from config)
    const flowSelect = page.getByTestId('handshake')
    await flowSelect.click()

    // Wait for some node label to appear, e.g. "Node Starter"
    await expect(page.getByTestId('subscribes__handshake.initiate')).toBeVisible()

    // 3) Trigger the flow by calling the inbound route
    const response = await fetch('http://localhost:3000/api/endpoint-server-handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Optionally pass some JSON data to your flow
      body: JSON.stringify({
        message: 'Hello from endpointServerHandshake test',
      }),
    })

    expect(response.status).toBe(200)

    // Wait a bit for the events to propagate
    await page.waitForTimeout(1000)

    // 4) Check Redis events
    // Extract the eventType from each collected event
    const eventTypes = collectedEvents.map((ev) => ev.type)
    // We expect handshake.initiate => handshake.callApi => handshake.apiResponse
    // Possibly the flow might skip some if there's a direct route, adjust as needed
    // We'll just check that at least these show up somewhere.
    expect(eventTypes).toEqual(
      expect.arrayContaining(['handshake.initiate', 'handshake.callApi', 'handshake.apiResponse']),
    )

    // (Optional) Check the final event's data
    const finalEvent = collectedEvents.find((e) => e.type === 'handshake.apiResponse')
    expect(finalEvent).toBeDefined()
    // If you want to confirm shape:
    // expect(finalEvent.data).toHaveProperty("externalTodo");
    // expect(finalEvent.data).toHaveProperty("userMessage");

    // 5) (Optional) Confirm final node label or UI text
    await expect(page.getByTestId('subscribes__handshake.apiResponse').last()).toBeVisible()
  })
})
