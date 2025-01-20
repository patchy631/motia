import React from 'react'
import { EventNode, EventNodeProps, Button } from '@motiadev/workbench'

export default (data: EventNodeProps) => {
  const [count, setCount] = React.useState(0)

  return (
    <EventNode {...data}>
      <div className="flex flex-row items-center gap-2">
        <Button onClick={() => setCount(count + 1)}>Increment count</Button>
        <div className="text-white/60 text-sm">Count: {count}</div>
      </div>
    </EventNode>
  )
}
