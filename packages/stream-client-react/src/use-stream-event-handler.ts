import { StreamSubscription } from '@motiadev/stream-client-browser'
import { DependencyList, useEffect } from 'react'

type UseStreamEventHandler = {
  event: StreamSubscription | null
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (event: any) => void
}

export const useStreamEventHandler = (
  { event, type, listener }: UseStreamEventHandler,
  dependencies: DependencyList,
) => {
  useEffect(() => {
    if (event) {
      event.onEvent(type, listener)
      return () => event.offEvent(type, listener)
    }
  }, [event, type, ...dependencies])
}
