import { JsonSchema } from './schema.types'

export const generateTypeFromSchema = (schema: JsonSchema): string => {
  if (schema.type === 'array') {
    const itemType = schema.items ? generateTypeFromSchema(schema.items) : 'unknown'
    return `${itemType}[]`
  }

  if (schema.type === 'object' && schema.properties) {
    const props = Object.entries(schema.properties).map(([key, prop]) => {
      const isRequired = schema.required?.includes(key)
      const propType = generateTypeFromSchema(prop)
      return `${key}${isRequired ? '' : '?'}: ${propType}`
    })
    return props.length > 0 ? `{ ${props.join('; ')} }` : '{}'
  }

  switch (schema.type) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'unknown'
  }
}
