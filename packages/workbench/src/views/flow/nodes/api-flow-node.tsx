import { ApiNode } from '../../../publicComponents/api-node'
import { ApiNodeData } from './nodes.types'

export const ApiFlowNode = ({ data }: { data: ApiNodeData }) => {
  return <ApiNode data={data} />
}
