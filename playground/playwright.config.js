import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 3000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000', // Change if your Playground runs on a different port
    headless: true,
  },
  // webServer: {
  //   port: 3000, // Adjust to match the test server port
  //   reuseExistingServer: true, // This will force the use of the test server started per test file
  // },
})
