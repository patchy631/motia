import { Eye } from 'lucide-react'
import { EventNodeData } from '../views/flow/nodes/nodes.types'

export const Subscribe: React.FC<{ data: EventNodeData }> = ({ data }) => {
  return (
    <>
      {data.subscribes.map((subscribe) => (
        <div
          key={subscribe}
          className="flex gap-2 items-center text-xs text-white/60"
          data-testid={`subscribes__${subscribe}`}
        >
          <Eye className="w-3 h-3 text-white/40" />
          <div className="font-mono tracking-wider">{subscribe}</div>
        </div>
      ))}
    </>
  )
}
