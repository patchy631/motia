import { FlowView } from '@/views/flow/flow-view'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/flow/$id')({
  component: Flow,
  loader: async ({ params }) => {
    return fetch(`/flows/${params.id}`)
      .then((res) => res.json())
      .then((flow) => ({ flow }))
  },
})

function Flow() {
  const { flow } = Route.useLoaderData()

  return (
    <div className="w-screen h-screen">
      <FlowView flow={flow} />
    </div>
  )
}
