import { StateAdapter } from '../state-adapter'
import fs from 'fs'
import * as path from 'path'
import { globalLogger as logger } from '../../logger'

export type FileAdapterConfig = {
  filePath: string
}

export class FileStateAdapter implements StateAdapter {
  private filePath: string
  private stateCache: Record<string, any> = {}

  constructor(config: FileAdapterConfig) {
    this.filePath = path.join(config.filePath, 'motia-state.json')
    logger.info('[FileStateAdapter] Initialized with path:', { filePath: this.filePath })
  }

  async init() {
    const dir = path.dirname(this.filePath)
    try {
      fs.realpathSync(dir)
    } catch (err) {
      fs.mkdirSync(dir, { recursive: true })
    }

    try {
      fs.readFileSync(this.filePath, 'utf-8')
    } catch (err) {
      fs.writeFileSync(this.filePath, JSON.stringify({}), 'utf-8')
    }
  }

  async get(traceId: string, key: string) {
    const data = await this._readFile()
    const fullKey = this._makeKey(traceId, key)

    return data[fullKey] ? JSON.parse(data[fullKey]) : null
  }

  async set(traceId: string, key: string, value: any) {
    const data = await this._readFile()
    const fullKey = this._makeKey(traceId, key)
    data[fullKey] = JSON.stringify(value)

    await this._writeFile(data)
  }

  async delete(traceId: string, key: string) {
    const data = await this._readFile()
    const fullKey = this._makeKey(traceId, key)
    delete data[fullKey]

    await this._writeFile(data)
  }

  async clear(traceId: string) {
    const data = await this._readFile()
    const pattern = this._makeKey(traceId, '')

    for (const key in data) {
      if (key.startsWith(pattern)) {
        delete data[key]
      }
    }

    await this._writeFile(data)
  }

  async cleanup() {
    // No cleanup needed for file system
  }

  private _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }

  private async _readFile() {
    const content = fs.readFileSync(this.filePath, 'utf-8')
    return JSON.parse(content)
  }

  private async _writeFile(data: any) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
  }
}
