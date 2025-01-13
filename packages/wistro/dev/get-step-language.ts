const extensionMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  go: 'go',
  rb: 'ruby',
  php: 'php',
}

export const getStepLanguage = (filePath: string): string | undefined => {
  if (!filePath) return

  const extension = filePath.split('.').pop()

  return extension && extensionMap[extension]
}
