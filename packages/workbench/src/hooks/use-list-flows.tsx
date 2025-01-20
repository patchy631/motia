import { useEffect, useState } from 'react'

type Flow = {
  id: string
  name: string
}

export const useListFlows = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [flows, setFlows] = useState<Flow[]>([])

  useEffect(() => {
    fetch('/flows')
      .then((res) => res.json())
      .then(setFlows)
      .finally(() => setIsLoading(false))
  }, [])

  return { flows, isLoading }
}
