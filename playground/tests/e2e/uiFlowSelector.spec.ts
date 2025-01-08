import { test, expect } from '@playwright/test'

// We'll define a helper array of flows we want to test
// Each object has the flow's "selectOption" value and a unique node label.
const FLOWS = [
  {
    // This is the "name" from wistroServerExample/config.js
    // which your UI returns in /api/flows
    flowName: 'wistroServerExample',
    uniqueNodeLabel: 'ws-server-example.start', // e.g. the label from your node's UI
  },
  {
    // The "name" from hybridEndpointExample/config.js
    flowName: 'hybridEndpointExample',
    uniqueNodeLabel: 'hybrid.validated', // or "Transform Data", etc.
  },
  {
    // The "name" from endpointServerHandshake/config.js
    flowName: 'endpointServerHandshake',
    uniqueNodeLabel: 'handshake.',
  },
]

test.describe('Flow Selector & Visual Tests', () => {
  test('the flow selector is visible', async ({ page }) => {
    // Go to your Playground UI root (adjust if needed)
    await page.goto('http://localhost:3000/')
    const selectorHeading = page.locator('text=Booking Example')
    await expect(selectorHeading).toBeVisible()
  })

  test('can switch among the three flows', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    // Wait for the flow selector to appear
    const flowSelect = page.locator('select')
    await expect(flowSelect).toBeVisible()

    // For each flow definition, select it and check a unique node
    for (const wf of FLOWS) {
      await flowSelect.selectOption(wf.flowName)
      // Wait for a UI element that's unique to that flow
      await page.locator(`text=${wf.uniqueNodeLabel}`).first().waitFor()
    }
  })

  test('visual regression for the three flows', async ({ page }) => {
    // 1) Navigate to the main Playground UI
    await page.goto('http://localhost:3000/')
    await page.locator('text=Booking Example').waitFor()

    // 2) For each flow, select it, wait for the node, then take a screenshot
    const flowSelect = page.locator('select')
    for (const wf of FLOWS) {
      // Switch flow
      await flowSelect.selectOption(wf.flowName)
      // Wait for a known node label
      await page.locator(`text=${wf.uniqueNodeLabel}`).first().waitFor()

      // 3) Visual regression screenshot
      // This will create or compare against a baseline named <flowName>.png
      await expect(page).toHaveScreenshot(`${wf.flowName}.png`)
    }
  })
})
