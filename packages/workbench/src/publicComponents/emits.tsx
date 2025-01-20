import { Send } from 'lucide-react'
import { EventNodeData } from '../views/flow/nodes/nodes.types'

const toType = (emit: string | { type: string; label?: string; conditional?: boolean }) =>
  typeof emit === 'string' ? emit : emit.type

export const Emits: React.FC<{ emits: EventNodeData['emits'] }> = ({ emits }) => {
  return (
    <>
      {emits.map((emit) => (
        <div
          key={toType(emit)}
          className="flex gap-2 items-center text-xs text-white/60"
          data-testid={`emits__${toType(emit)}`}
        >
          <Send className="w-3 h-3 text-white/40" />
          <div className="font-mono tracking-wider">{toType(emit)}</div>
        </div>
      ))}
    </>
  )
}
