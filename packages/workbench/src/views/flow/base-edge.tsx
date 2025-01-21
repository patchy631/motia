import { BaseEdge as BaseReactFlowEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react'
import React from 'react'

export const BaseEdge: React.FC<EdgeProps> = (props) => {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 20,
    offset: 10,
  })

  return (
    <BaseReactFlowEdge
      path={edgePath}
      style={{
        stroke: data?.variant === 'virtual' ? 'rgb(147, 169, 197)' : 'rgb(133, 176, 132)',
        strokeWidth: 0.5,
        shapeRendering: 'geometricPrecision',
        fill: 'none',
        mixBlendMode: 'screen',
      }}
      className="edge-animated"
    />
  )
}
