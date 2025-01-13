import { Position } from '@xyflow/react'
import { Clock, Speech, Webhook } from 'lucide-react'
import { BaseHandle } from '../../../publicComponents/base-handle'
import { TriggerNodeData } from './nodes.types'

export const TriggerNode = ({ data }: { data: TriggerNodeData }) => {
  return (
    <div className="border-[2px] border-dashed border-sky-900 rounded-[14px] p-[1px]">
      <div className="bg-sky-500 text-black rounded-md p-2 px-3 rounded-[10px]">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-semibold">{data.name}</div>
              {data.description && <div className="text-xs">{data.description}</div>}
            </div>
          </div>
          <div className="flex flex-col">
            {data.webhookUrl && (
              <div className="flex gap-1 items-center">
                <Webhook className="w-3 h-3 text-sky-950" />
                <div className="text-xs font-mono">{data.webhookUrl}</div>
              </div>
            )}
            {data.cron && (
              <div className="flex gap-1 items-center">
                <Clock className="w-3 h-3 text-sky-950" />
                <div className="text-xs font-mono">{data.cron}</div>
              </div>
            )}
            {data.emits.length > 0 && (
              <div className="flex gap-1 items-center">
                <Speech className="w-3 h-3 text-sky-950" />
                <div
                  className="text-xs  font-mono"
                  data-testid={data.emits.map((topic) => `emits__${topic}`).join(' ')}
                >
                  {data.emits.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
        {data.subscribes && data.subscribes.length > 0 && <BaseHandle type="target" position={Position.Top} />}
        <BaseHandle type="source" position={Position.Bottom} />
      </div>
    </div>
  )
}
