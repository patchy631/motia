import { StateAdapter } from '../StateAdapter'
import { promises as fs } from 'fs'
import * as path from 'path'
import { globalLogger as logger } from '../../logger'

export type FileAdapterConfig = {
  filePath: string
}

export class FileStateAdapter extends StateAdapter {
  private filePath: string
  private stateCache: Record<string, any> = {}

  constructor(config: FileAdapterConfig) {
    super()
    this.filePath = path.join(config.filePath, 'motia-state.json')
    logger.info('[FileStateAdapter] Initialized with path:', { filePath: this.filePath })
  }

  async init() {
    const dir = path.dirname(this.filePath)
    try {
      await fs.realpath(dir)
    } catch (err) {
      logger.info('[FileStateAdapter] Creating directory:', { dir })
      await fs.mkdir(dir, { recursive: true })
    }

    try {
      await fs.readFile(this.filePath, 'utf-8')
    } catch (err) {
      logger.info('[FileStateAdapter] Initializing empty state file')
      await fs.writeFile(this.filePath, JSON.stringify({}), 'utf-8')
    }
  }

  async get(traceId: string, key: string) {
    const data = await this._readFile()
    const fullKey = this._makeKey(traceId, key)
    const value = data[fullKey] ? JSON.parse(data[fullKey]) : null
    logger.debug('[FileStateAdapter] Getting state:', { traceId, key, value })
    return value
  }

  async set(traceId: string, key: string, value: any) {
    const data = await this._readFile()
    const fullKey = this._makeKey(traceId, key)
    logger.debug('[FileStateAdapter] Setting state:', { traceId, key, value })
    data[fullKey] = JSON.stringify(value)
    await this._writeFile(data)
  }

  async delete(traceId: string, key: string) {
    const data = await this._readFile()
    const fullKey = this._makeKey(traceId, key)
    logger.debug('[FileStateAdapter] Deleting state:', { traceId, key })
    delete data[fullKey]
    await this._writeFile(data)
  }

  async clear(traceId: string) {
    const data = await this._readFile()
    const pattern = this._makeKey(traceId, '*')
    logger.debug('[FileStateAdapter] Clearing state for trace:', { traceId })
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

  _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }

  private async _readFile() {
    try {
      logger.debug('[FileStateAdapter] Reading state file:', { path: this.filePath })
      const content = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      logger.error('[FileStateAdapter] Error reading state file:', error)
      return {}
    }
  }

  private async _writeFile(data: any) {
    try {
      const content = JSON.stringify(data, null, 2)
      logger.debug('[FileStateAdapter] Writing state file:', { path: this.filePath, dataSize: content.length })
      await fs.writeFile(this.filePath, content, 'utf-8')
    } catch (error) {
      logger.error('[FileStateAdapter] Error writing state file:', error)
      throw error
    }
  }
}
