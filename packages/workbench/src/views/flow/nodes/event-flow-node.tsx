import { EventNode } from '../../../publicComponents/event-node'
import { EventNodeProps } from '../../../publicComponents/node-props'

export const EventFlowNode = ({ data }: EventNodeProps) => {
  return <EventNode className="relative" data={data}></EventNode>
}
