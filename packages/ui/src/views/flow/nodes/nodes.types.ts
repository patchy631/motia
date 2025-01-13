import { JSONSchema7 } from 'json-schema'

export type BaseNodeData = {
  id: string
  flowId: string
  name: string
  description?: string
  subscribes: string[]
  emits: Array<string | { type: string; label?: string; conditional?: boolean }>
  language?: string
}

export type NoopNodeData = {
  id: string
  flowId: string
  name: string
  description?: string
  emits: Array<string | { type: string; label?: string; conditional?: boolean }>
  subscribes?: string[]
  jsonSchema?: JSONSchema7
}

export type TriggerNodeData = {
  id: string
  flowId: string
  name: string
  description?: string
  emits: string[]
  subscribes?: string[]
  action: 'webhook' | 'cron'
  cron?: string
  webhookUrl?: string
}

export type NodeData = BaseNodeData | TriggerNodeData | NoopNodeData

export type EdgeData = {
  label?: string
  variant: 'default' | 'conditional'
}
