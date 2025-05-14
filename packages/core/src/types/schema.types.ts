export type JsonSchemaType = 'string' | 'number' | 'boolean'

export type JsonArray = {
  type: 'array'
  description?: string
  items: JsonSchema
}

export type JsonObject = {
  type: 'object'
  description?: string
  properties: Record<string, JsonSchema>
  required?: string[]
}

export type JsonProperty = {
  type: JsonSchemaType
  description?: string
}

export type JsonSchema = JsonArray | JsonObject | JsonProperty

export class JsonSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JsonSchemaError'
  }
}
