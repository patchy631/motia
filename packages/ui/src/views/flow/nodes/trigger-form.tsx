import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { JsonSchemaForm } from './json-schema-form'
import { TriggerNodeData } from './nodes.types'

export const TriggerForm = ({ data }: { data: TriggerNodeData }) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})

  const handleRun = () => {
    setOpen(false)

    if (!data.webhookUrl) return

    console.log('data.webhookUrl', data.webhookUrl)
    const [method, url] = data.webhookUrl.split(' ')

    fetch(url, {
      method,
      body: JSON.stringify(formData),
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
        className="rounded-full bg-sky-600 hover:bg-sky-700 text-black"
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
          {data.bodySchema && <JsonSchemaForm schema={data.bodySchema} formData={formData} onChange={setFormData} />}
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
