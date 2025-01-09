import { test, expect } from '@playwright/test'

// We'll define a helper array of flows we want to test
// Each object has the flow's "selectOption" value and a unique node label.
const FLOWS = [
  {
    // This is the "name" from wistroServerExample/config.js
    // which your UI returns in /api/flows
    name: 'wistro-server',
    topic: 'ws-server-example.start', // e.g. the label from your node's UI
  },
  {
    // The "name" from hybridEndpointExample/config.js
    name: 'hybrid-example',
    topic: 'hybrid.validated', // or "Transform Data", etc.
  },
  {
    // The "name" from endpointServerHandshake/config.js
    name: 'handshake',
    topic: 'handshake.initiate',
  },
]

const wistroWorkbenchUrl = 'http://localhost:3000'

test.describe('Flow Selector & Visual Tests', () => {
  test('the flow selector is visible', async ({ page }) => {
    // Go to your Playground UI root (adjust if needed)
    await page.goto(wistroWorkbenchUrl)
    await expect(page.locator('text=Endpoint Server Handshake')).toBeVisible()
  })

  test('can switch among the three flows', async ({ page }) => {
    await page.goto(wistroWorkbenchUrl)

    // Wait for the flow selector to appear
    const flowSelect = page.locator('select')
    await expect(page.locator('text=Endpoint Server Handshake')).toBeVisible()

    // For each flow definition, select it and check a unique node
    for (const flow of FLOWS) {
      await page.getByTestId(`flow-link-${flow.name}`).click()
      // Wait for a UI element that's unique to that flow
      await page.getByTestId('subscribes__' + flow.topic).waitFor()
    }
  })

  test('visual regression for the three flows', async ({ page }) => {
    // 1) Navigate to the main Playground UI
    await page.goto(wistroWorkbenchUrl)
    await page.locator('text=Endpoint Server Handshake').waitFor()

    // 2) For each flow, select it, wait for the node, then take a screenshot
    const flowSelect = page.locator('select')
    for (const flow of FLOWS) {
      // Switch flow
      await page.getByTestId(`flow-link-${flow.name}`).click()

      // Wait for a known node label
      await page.getByTestId('subscribes__' + flow.topic).waitFor()

      // 3) Visual regression screenshot
      // This will create or compare against a baseline named <flowName>.png
      await expect(page).toHaveScreenshot(`${flow.name}.png`)
    }
  })
})
