import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { JsonSchemaForm } from './json-schema-form'
import { NoopNodeData } from './nodes.types'

export const TriggerForm = ({ data }: { data: NoopNodeData }) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})

  const handleRun = () => {
    setOpen(false)

    fetch(`/emit/${data.flowId}`, {
      method: 'POST',
      body: JSON.stringify({
        stepId: data.id,
        data: formData,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    console.log('run', formData)
  }

  const onOpen = () => {
    setOpen(true)
    setFormData({})
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        onClick={onOpen}
        variant="none"
        className="rounded-full bg-gray-500/10 hover:bg-gray-500/20 text-black"
        size="icon"
      >
        <Play className="w-3 h-3" />
      </Button>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data.name}</SheetTitle>
          <SheetDescription>{data.description}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 mt-4">
          {data.jsonSchema && <JsonSchemaForm schema={data.jsonSchema} formData={formData} onChange={setFormData} />}
          <div className="flex justify-end ">
            <Button onClick={handleRun}>
              <Play className="w-3 h-3" />
              Run
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
