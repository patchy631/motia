import { Webhook } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { BaseNode } from './base-node'
import { Emits } from './emits'
import { ApiNodeProps } from './node-props'

type Props = PropsWithChildren<ApiNodeProps & { excludePubsub?: boolean }>

export const ApiNode = ({ data, children, excludePubsub }: Props) => {
  return (
    <BaseNode
      variant="api"
      title={data.name}
      disableSourceHandle={!data.emits?.length}
      disableTargetHandle={!data.subscribes?.length}
    >
      {data.description && <div className="text-sm max-w-[300px] text-white/60">{data.description}</div>}
      {children}
      {data.webhookUrl && (
        <div className="flex gap-1 items-center text-xs text-white/60">
          <Webhook className="w-3 h-3 text-white/40" />
          <div className="font-mono">{data.webhookUrl}</div>
        </div>
      )}
      {!excludePubsub && <Emits emits={data.emits} />}
    </BaseNode>
  )
}
