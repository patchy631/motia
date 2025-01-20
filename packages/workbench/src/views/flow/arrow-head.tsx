import React from 'react'

type Props = {
  color: string
  id: string
}

export const ArrowHead: React.FC<Props> = (props) => (
  <marker id={props.id} viewBox="-5 -5 10 10" markerUnits="strokeWidth" markerWidth="10" markerHeight="10">
    <line x1={0} y1={0} x2={2} y2={-2} stroke={props.color} strokeWidth="1" strokeOpacity="1" strokeLinecap="round" />
    <line x1={-2} y1={-2} x2={0} y2={0} stroke={props.color} strokeWidth="1" strokeOpacity="1" strokeLinecap="round" />
  </marker>
)
