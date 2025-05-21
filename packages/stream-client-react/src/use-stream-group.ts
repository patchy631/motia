import { useEffect, useState } from 'react'
import { useMotiaStream } from './use-motia-stream'
import { StreamSubscription } from '@motiadev/stream-client-browser'

type Args = {
  streamName: string
  groupId: string
}

export const useStreamGroup = <TData>(args: Args) => {
  const { stream } = useMotiaStream()
  const [data, setData] = useState<TData[]>([])
  const [event, setEvent] = useState<StreamSubscription | null>(null)

  useEffect(() => {
    const subscription = stream.subscribeGroup(args.streamName, args.groupId)

    subscription.addChangeListener((data) => setData(data as TData[]))
    setEvent(subscription)
    return () => subscription.close()
  }, [stream, args.streamName, args.groupId])

  return { data, event }
}
