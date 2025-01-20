import { NoopNode } from '../../../publicComponents/noop-node'
import { NoopNodeData } from './nodes.types'

export const NoopFlowNode = ({ data }: { data: NoopNodeData }) => {
  return <NoopNode data={data} />
}
