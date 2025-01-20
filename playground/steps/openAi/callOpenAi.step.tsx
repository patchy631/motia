import React from 'react'
import { BaseHandle, EventNodeProps, Position } from '@motiadev/workbench'

export default (_: EventNodeProps) => {
  return (
    <div className="p-3 px-6 flex flex-col max-w-[300px] bg-lime-500 border-white rounded-full text-white border border-solid text-center text-sm">
      <div>Calling OpenAI</div>
      <div>from NodeJS</div>
      <BaseHandle type="target" position={Position.Top} />
      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}
