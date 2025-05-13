from pydantic import BaseModel
 
# Define a Pydantic model for request body validation
class RequestBody(BaseModel):
    message: str

config = {
  "type": "api",
  "name": "Get Message by Trace ID",
  "description": "Retrieves a generated message from OpenAI based on the Trace ID returned by the POST /openai endpoint",
  "path": "/openai/:traceId/python",
  "method": "GET",
  "emits": ["call-openai"],
  "flows": ["openai"],
  "responseBody": RequestBody.model_json_schema(),
  "queryParams": [
    {
      "name": "includeProps",
      "description": "Whether to include the properties of the message",
    },
  ],
}

async def handler(req, context):
  context.logger.info("[Call OpenAI] Received callOpenAi event", {"body": req.get("body")})

  return {
    "status": 200,
    "body": { "message": "OpenAI response sent" },
  }