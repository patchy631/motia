import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 3000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000', // Change if your Playground runs on a different port
    headless: true,
  },
  globalSetup: require.resolve('./tests/e2e/utils/globalSetup'),
  globalTeardown: require.resolve('./tests/e2e/utils/globalTeardown'),
})
