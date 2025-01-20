import {
  BaseEdge as BaseReactFlowEdge,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react'
import React from 'react'

export const BaseEdge: React.FC<EdgeProps> = (props) => {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  } = props

  // getSmoothStepPath returns an array: [edgePath, labelX, labelY, etc.]
  // We just need edgePath here.
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 20, // <— Tweak this for roundness
    offset: 10,       // <— How far the line extends before curving
  })

  return (
    <BaseReactFlowEdge
      path={edgePath}
      style={{
        stroke: 'rgba(100, 100, 100)',
        strokeWidth: 0.5,
        shapeRendering: 'geometricPrecision',
        fill: 'none',
        mixBlendMode: 'screen',  // or 'screen'
      }}
      className="edge-animated"
    />
  )
}