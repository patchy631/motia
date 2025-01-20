import { Edge, Node } from '@xyflow/react'
import dagre from 'dagre'
import { useEffect, useRef } from 'react'
import { EventNodeData, EdgeData, ApiNodeData } from '../nodes/nodes.types'

const organizeNodes = (
  nodes: Node<EventNodeData | ApiNodeData>[],
  edges: Edge<EdgeData>[],
): Node<EventNodeData | ApiNodeData>[] => {
  const dagreGraph = new dagre.graphlib.Graph({ compound: true })
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  // Top-to-bottom layout
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60, edgesep: 20, ranker: 'tight-tree' })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.measured?.width, height: node.measured?.height })
  })

  edges.forEach((edge) => {
    if (typeof edge.label === 'string') {
      dagreGraph.setEdge(edge.source, edge.target, {
        label: edge.label ?? '',
        width: edge.label.length * 40, // Add width for the label
        height: 30, // Add height for the label
        labelpos: 'c', // Position label in center
      })
    } else {
      dagreGraph.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(dagreGraph)

  return nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id)
    const position = {
      x: x - (node.measured?.width ?? 0) / 2,
      y: y - (node.measured?.height ?? 0) / 2,
    }

    return { ...node, position }
  })
}

export const useOrganizeNodes = (
  nodes: Node<EventNodeData | ApiNodeData>[],
  edges: Edge<EdgeData>[],
  setNodes: (nodes: Node<EventNodeData | ApiNodeData>[]) => void,
) => {
  const organizedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!nodes.length || !edges.length || !nodes[0].measured || organizedRef.current) return

    const layoutedNodes = organizeNodes(nodes, edges)
    setNodes(layoutedNodes)
    organizedRef.current = true
  }, [nodes, edges, setNodes])
}
