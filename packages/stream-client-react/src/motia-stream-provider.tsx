import { Stream } from '@motiadev/stream-client-browser'
import React, { useMemo } from 'react'
import { MotiaStreamContext } from './motia-stream-context'

type Props = React.PropsWithChildren<{
  address: string
}>

export const MotiaStreamProvider: React.FC<Props> = ({ children, address }) => {
  const stream = useMemo(() => new Stream(address), [address])

  return <MotiaStreamContext.Provider value={{ stream }}>{children}</MotiaStreamContext.Provider>
}
