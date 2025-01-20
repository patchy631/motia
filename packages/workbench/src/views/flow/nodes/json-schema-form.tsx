import { useEffect, useState } from 'react'
import { JSONSchema7 } from 'json-schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface JsonSchemaFormProps {
  schema: JSONSchema7
  formData?: any
  onChange?: (data: any) => void
}

export const JsonSchemaForm: React.FC<JsonSchemaFormProps> = ({ schema, formData = {}, onChange }) => {
  const [values, setValues] = useState(formData)

  useEffect(() => {
    onChange?.(values)
  }, [values, onChange])

  const renderField = (propertyName: string, propertySchema: JSONSchema7) => {
    const value = values[propertyName]

    switch (propertySchema.type) {
      case 'string':
        if (propertySchema.enum) {
          return (
            <div className="space-y-2" key={propertyName}>
              <Label>{propertySchema.title || propertyName}</Label>
              <Select value={value} onValueChange={(newValue) => setValues({ ...values, [propertyName]: newValue })}>
                <SelectTrigger>
                  <SelectValue placeholder={propertySchema.description || `Select ${propertyName}`} />
                </SelectTrigger>
                <SelectContent>
                  {propertySchema.enum.map((option) => (
                    <SelectItem key={String(option)} value={String(option)}>
                      {String(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        if (propertySchema.format === 'textarea') {
          return (
            <div className="space-y-2" key={propertyName}>
              <Label>{propertySchema.title || propertyName}</Label>
              <Textarea
                placeholder={propertySchema.description}
                value={value || ''}
                onChange={(e) => setValues({ ...values, [propertyName]: e.target.value })}
              />
            </div>
          )
        }

        return (
          <div className="space-y-2" key={propertyName}>
            <Label>{propertySchema.title || propertyName}</Label>
            <Input
              type="text"
              placeholder={propertySchema.description}
              value={value || ''}
              onChange={(e) => setValues({ ...values, [propertyName]: e.target.value })}
            />
          </div>
        )

      case 'number':
      case 'integer':
        return (
          <div className="space-y-2" key={propertyName}>
            <Label>{propertySchema.title || propertyName}</Label>
            <Input
              type="number"
              placeholder={propertySchema.description}
              value={value || ''}
              onChange={(e) => setValues({ ...values, [propertyName]: Number(e.target.value) })}
            />
          </div>
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2" key={propertyName}>
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => setValues({ ...values, [propertyName]: checked })}
            />
            <Label>{propertySchema.title || propertyName}</Label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form className="space-y-4">
      {schema.properties &&
        Object.entries(schema.properties).map(([propertyName, propertySchema]) =>
          renderField(propertyName, propertySchema as JSONSchema7),
        )}
    </form>
  )
}
