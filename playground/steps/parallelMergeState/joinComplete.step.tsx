import { BaseNode, BaseNodeProps } from '@wistro/ui'
import React from 'react'

export default ({ data }: BaseNodeProps) => {
  return (
    <BaseNode
      data={data}
      variant="ghost"
      excludePubsub
      className="py-4 px-8 flex flex-col max-w-[300px] bg-black border-white rounded-full text-white border border-solid text-center text-sm"
    />
  )
}
