import { EventNodeData, ApiNodeData, NoopNodeData } from '../views/flow/nodes/nodes.types'

export type BaseNodeProps = EventNodeProps | NoopNodeProps | ApiNodeProps

export type EventNodeProps = {
  data: EventNodeData
}

export type NoopNodeProps = {
  data: NoopNodeData
}

export type ApiNodeProps = {
  data: ApiNodeData
}
