import React, { HTMLAttributes } from 'react'
import { HandleProps, Position, Handle as RFHandle } from '@xyflow/react'
import clsx from 'clsx'

type Props = HandleProps &
  Omit<HTMLAttributes<HTMLDivElement>, 'id'> & {
    isHidden?: boolean
  }

export const BaseHandle: React.FC<Props> = (props) => {
  const { isHidden, position, ...rest } = props

  return (
    <div
      className={clsx(
        'absolute w-1 h-1',
        position === Position.Top && '-top-[10px]',
        position === Position.Bottom && '-bottom-[10px]',
        'left-1/2 -ml-[2px]',
        isHidden && 'hidden',
      )}
    >
      <RFHandle
        {...rest}
        position={position}
        className="
        !static
        !w-1
        !h-1
        !min-w-[6px]
        !min-h-[6px]
        !p-0
        !border-none
        !bg-[#666666]
        !transform-none
        !rounded-full
        !outline-none
        !shadow-none
      "
      />
    </div>
  )
}
