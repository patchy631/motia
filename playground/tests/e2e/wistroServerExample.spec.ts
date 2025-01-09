import { test, expect } from '@playwright/test'
import { Event } from 'wistro'

test.describe('WistroServerExample + Redis E2E', () => {
  test('verifies wistroServerExample flow & Redis events', async ({ page }) => {
    // 2) Navigate to Playground UI
    await page.goto('http://localhost:3000')
    // Wait for the flow selection sidebar to appear
    await expect(page.locator('text=Endpoint Server Handshake')).toBeVisible()

    // 3) Select the "wistroServerExample" flow
    const workflowSelect = page.getByTestId('flow-link-wistro-server')
    await workflowSelect.click()

    // Wait for some node label to appear, e.g. "Node Starter"
    await expect(page.getByTestId('subscribes__ws-server-example.trigger')).toBeVisible()

    // 4) Trigger the flow by POSTing to the Wistro server
    const response = await fetch('http://localhost:3000/api/wistro-server-example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ greeting: 'Hello from Redis E2E test' }),
    })
    expect(response.status).toBe(200)
    const { traceId } = await response.json()

    // Give time for the flow to run and events to publish
    await page.waitForTimeout(1000)

    // 5) Assert we saw expected Redis events
    // For example, if your flow emits “wistroServerExample.started”, “wistroServerExample.processed”, etc.
    const allEvents = globalThis.__ALL_EVENTS__ || []
    const eventTypes = allEvents.filter((ev) => ev.traceId === traceId)

    // Check that we have at least one or more relevant event types
    // Adjust these to match your actual event names:
    expect(eventTypes).toEqual(
      expect.arrayContaining(['ws-server-example.trigger', 'ws-server-example.start', 'ws-server-example.processed']),
    )

    // Optional: Inspect the data of a particular event
    const doneEvent = eventTypes.find((ev) => ev.type === 'ws-server-example.processed')
    expect(doneEvent).toBeDefined()
    // If there's some known shape of doneEvent.data, e.g. { result: ... }
    // expect(doneEvent.data.result).toBe("SomeValue");

    // 6) Optionally confirm the final UI state
    // e.g., a "Finalizer" node or some text indicating completion
    await expect(page.getByTestId('subscribes__ws-server-example.processed')).toBeVisible()
  })
})
