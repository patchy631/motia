import { JSONSchema7 } from 'json-schema'

export type EventNodeData = {
  type: string
  name: string
  description?: string
  subscribes: string[]
  emits: Array<string | { type: string; label?: string }>
  language?: string
}

export type NoopNodeData = {
  type: string
  name: string
  description?: string
  emits: string[]
  subscribes: string[]
}

export type ApiNodeData = {
  type: string
  name: string
  description?: string
  emits: Array<string | { type: string; label?: string }>
  subscribes?: string[]
  webhookUrl?: string
  bodySchema?: JSONSchema7
}

export type NodeData = EventNodeData | ApiNodeData | NoopNodeData

// ducplicate of packages/core/src/flows-endpoint.ts
export type EdgeData = {
  label?: string
  variant: 'event' | 'virtual'
}
