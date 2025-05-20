import { useEffect, useState } from 'react'
import { useMotiaStream } from './use-motia-stream'

type Args = {
  streamName: string
  groupId: string
}

export const useStreamGroup = <TData>(args: Args) => {
  const { stream } = useMotiaStream()
  const [data, setData] = useState<TData[]>([])

  useEffect(() => {
    const subscription = stream.subscribeGroup(args.streamName, args.groupId)

    subscription.addChangeListener((data) => setData(data as TData[]))

    return () => subscription.close()
  }, [stream, args.streamName, args.groupId])

  return { data }
}
