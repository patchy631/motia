import { useEffect, useState } from 'react'
import { useMotiaStream } from './use-motia-stream'

type Args = {
  streamName: string
  id: string
}

export const useStreamItem = <TData>(args: Args) => {
  const { stream } = useMotiaStream()
  const [data, setData] = useState<TData | null>(null)

  useEffect(() => {
    const subscription = stream.subscribeItem(args.streamName, args.id)

    subscription.addChangeListener((data) => setData(data as TData))

    return () => subscription.close()
  }, [stream, args.streamName, args.id])

  return { data }
}
