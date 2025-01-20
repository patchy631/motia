import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <p className="text-gray-500">Select a flow</p>
    </div>
  )
}
