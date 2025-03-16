---
title: Api Step
---

An API step is exposed as an HTTP endpoint that acts as an entry point into your sequence of steps, or **flow**. It allows external systems or clients to trigger and interact with your flows through a REST API interface. Like any Motia Step, an API Step can be configured to emit events or wait for events to occur.

## Config

The following properties are specific to the API Step, in addition to the [common step config](/docs/core/steps/defining-steps#config).

<DescriptionTable
  type={{
    path: {
      description: 'The development server api path to expose your api step handler',
      type: 'string',
    },
    method: {
      description: 'The HTTP method to use for the development server api endpoint',
      type: 'GET | POST',
    },
    bodySchema: {
      description:
        'In TS/JS we use zod to validate the request body, in Python/Ruby we use json schema to validate the request body.',
      type: 'JSON Schema',
    },
  }}
/>

The following examples showcase how to configure an **API Step**

<Tabs items={['TypeScript', 'JavaScript', 'Python', 'Ruby']}>
  <Tab value="TypeScript">
    ```typescript
      import { ApiRouteConfig, StepHandler } from 'motia'
      import { z } from 'zod'

      export const config: ApiRouteConfig = {
        type: 'api',
        name: 'Test state api trigger',
        description: 'test state',
        path: '/test-state',
        method: 'POST',
        emits: ['test-state'],
        bodySchema: z.object({}),
        flows: ['test-state'],
      }

      export const handler: StepHandler<typeof config> = async (req, { logger, emit }) => {
        logger.info('[Test State] Received request', req)

        await emit({
          topic: 'test-state',
          data: req.body
        })

        return {
          status: 200,
          body: { message: 'Success' },
        }
      }
    ```

  </Tab>
  <Tab value="JavaScript">
    ```javascript
    const { z } = require('zod')

    exports.config = {
      type: 'api',
      name: 'Test state api trigger',
      description: 'test state',
      path: '/test-state',
      method: 'POST',
      emits: ['test-state'],
      bodySchema: z.object({}),
      flows: ['test-state'],
    }

    exports.handler = async (req, { logger, emit }) => {
      logger.info('[Test State] Received request', req)

      await emit({
        topic: 'test-state',
        data: req.body
      })

      return {
        status: 200,
        body: { message: 'Success' },
      }
    }
    ```

  </Tab>

  <Tab value="Python">
    ```python
    config = {
        'type': 'api',
        'name': 'Test state api trigger',
        'description': 'test state',
        'path': '/test-state',
        'method': 'POST',
        'emits': ['test-state'],
        'flows': ['test-state']
    }

    async def handler(req, context):
        context.logger.info('[Test State] Received request', {'body': req.body})

        await context.emit({
            'topic': 'test-state',
            'data': req.body
        })

        return {
            'status': 200,
            'body': {'message': 'Success'}
        }
    ```

  </Tab>
  <Tab value="Ruby">
    ```ruby
    def config
      {
        type: 'api',
        name: 'Test state api trigger',
        description: 'test state',
        path: '/test-state',
        method: 'POST',
        emits: ['test-state'],
        flows: ['test-state']
      }
    end

    def handler(req, ctx)
      ctx.emit({
        "topic" => "test-state",
        "data" => req.body
      })

      {
        "status" => 200,
        "body" => { "message" => "Success" }
      }
    end
    ```

  </Tab>
</Tabs>
