import fs from 'fs'

export function parseEnvFile(filePath: string): Record<string, string> {
  const envContent = fs.readFileSync(filePath, 'utf-8')
  const envLines = envContent.split('\n')
  const envData: Record<string, string> = {}

  for (const line of envLines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const [key, ...valueParts] = trimmedLine.split('=')
    const value = valueParts.join('=')

    if (key && value) {
      envData[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1')
    }
  }

  return envData
}
