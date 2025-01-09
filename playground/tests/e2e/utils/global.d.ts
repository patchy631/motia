import type { Server } from 'http'

declare global {
  // Extend the globalThis interface for custom fields
  var __TEST_SERVER__: Server | undefined
  var __ALL_EVENTS__: any[] | undefined
}

// This file needs to be a module
export {}
