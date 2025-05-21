import { Stream } from '@motiadev/stream-client-browser'
import React, { useEffect, useState } from 'react'
import { MotiaStreamContext } from './motia-stream-context'

type Props = React.PropsWithChildren<{
  address: string
}>

export const MotiaStreamProvider: React.FC<Props> = ({ children, address }) => {
  const [stream, setStream] = useState<Stream | null>(null)

  useEffect(() => {
    const stream = new Stream(address, () => setStream(stream))
    setTimeout(() => setStream(stream), 3000)
  }, [address])

  if (!stream) return null

  return <MotiaStreamContext.Provider value={{ stream }}>{children}</MotiaStreamContext.Provider>
}
