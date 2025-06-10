import { Trace } from './types'
import { FileStreamAdapter } from '../streams/adapters/file-stream-adapter'

export class ObservabilityStream extends FileStreamAdapter<Trace> {
  constructor() {
    super(process.cwd(), 'observability-stream')
  }
}