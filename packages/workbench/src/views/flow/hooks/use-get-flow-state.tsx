import { Edge, Node, useEdgesState, useNodesState } from '@xyflow/react'
import { useEffect, useState } from 'react'
import type { EdgeData, NodeData } from '../nodes/nodes.types'
import { ApiFlowNode } from '../nodes/api-flow-node'
import { NoopFlowNode } from '../nodes/noop-flow-node'
import { EventFlowNode } from '../nodes/event-flow-node'

type Emit = string | { type: string; label?: string }

type FlowStep = {
  id: string
  name: string
  type: 'event' | 'api' | 'noop'
  description?: string
  subscribes?: string[]
  emits: Emit[]
  virtualEmits?: Emit[]
  action?: 'webhook'
  webhookUrl?: string
  language?: string
  nodeComponentPath?: string
}

export type FlowResponse = {
  id: string
  name: string
  steps: FlowStep[]
  edges: FlowEdge[]
}

type FlowEdge = {
  id: string
  source: string
  target: string
  data: EdgeData
}

type FlowState = {
  nodes: Node<NodeData>[]
  edges: Edge<EdgeData>[]
  nodeTypes: Record<string, React.ComponentType<any>>
}

async function importFlow(flow: FlowResponse): Promise<FlowState> {
  const nodeTypes: Record<string, React.ComponentType<any>> = {
    event: EventFlowNode,
    api: ApiFlowNode,
    noop: NoopFlowNode,
  }

  // Load custom node components if they exist
  for (const step of flow.steps) {
    if (step.nodeComponentPath) {
      const module = await import(/* @vite-ignore */ step.nodeComponentPath)
      nodeTypes[step.nodeComponentPath] = module.default
    }
  }

  // Create nodes from steps
  const nodes: Node<NodeData>[] = flow.steps.map((step) => ({
    id: step.id,
    type: step.nodeComponentPath ? step.nodeComponentPath : step.type,
    position: { x: 0, y: 0 },
    data: step,
    language: step.language,
  }))

  // Use the edges provided by the API, adding required ReactFlow properties
  const edges: Edge<EdgeData>[] = flow.edges.map((edge) => ({
    ...edge,
    type: 'base',
  }))

  return { nodes, edges, nodeTypes }
}

export const useGetFlowState = (flow: FlowResponse) => {
  const [nodeTypes, setNodeTypes] = useState<Record<string, React.ComponentType<any>>>()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<EdgeData>>([])

  useEffect(() => {
    if (!flow) return

    importFlow(flow).then(({ nodes, edges, nodeTypes }) => {
      setNodes(nodes)
      setEdges(edges)
      setNodeTypes(nodeTypes)
    })
  }, [flow])

  return { nodes, edges, onNodesChange, onEdgesChange, nodeTypes }
}
