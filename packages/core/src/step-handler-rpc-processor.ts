import { ChildProcess } from 'child_process'

type RpcHandler<TInput, TOutput> = (input: TInput) => Promise<TOutput>

export class RpcProcessor {
  private handlers: Record<string, RpcHandler<any, any>> = {}

  constructor(private child: ChildProcess) {}

  handler<TInput, TOutput = unknown>(method: string, handler: RpcHandler<TInput, TOutput>) {
    this.handlers[method] = handler
  }

  async handle(method: string, input: any) {
    const handler = this.handlers[method]
    if (!handler) {
      throw new Error(`Handler for method ${method} not found`)
    }
    return handler(input)
  }

  private response(id: string | undefined, result: any, error: any) {
    if (id) {
      this.child.send?.({ type: 'rpc_response', id, result, error })
    }
  }

  async init() {
    this.child.on('message', (msg: any) => {
      if (msg.type === 'rpc_request') {
        const { id, method, args } = msg
        this.handle(method, args)
          .then((result) => this.response(id, result, null))
          .catch((error) => this.response(id, null, error))
      }
    })
  }
}
