import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { templates } from './templates'
import figlet from 'figlet'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

const checkIfFileExists = (dir: string, fileName: string): boolean => {
  return fs.existsSync(path.join(dir, fileName))
}

const checkIfDirectoryExists = (dir: string): boolean => {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}

const getPackageManager = (dir: string): string => {
  if (checkIfFileExists(dir, 'yarn.lock')) {
    return 'yarn'
  } else if (checkIfFileExists(dir, 'pnpm-lock.yaml')) {
    return 'pnpm'
  } else if (checkIfFileExists(dir, 'package-lock.json')) {
    return 'npm'
  } else {
    return 'unknown'
  }
}

const executeCommand = async (command: string, rootDir: string) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: rootDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        reject(error)
        return
      }
      if (stdout) console.log(stdout.toString())
      if (stderr) console.error(stderr.toString())
      resolve(stdout)
    })
  })
}

const installRequiredDependencies = async (packageManager: string, rootDir: string) => {
  console.log('📦 Installing dependencies...')

  const installCommand = {
    npm: 'npm install',
    yarn: 'yarn add',
    pnpm: 'pnpm add',
  }[packageManager]

  const dependencies = ['@motiadev/core', 'motia', '@motiadev/workbench', 'zod', 'react@^19.0.0'].join(' ')

  const devDependencies = ['ts-node@^10.9.2', 'typescript@^5.7.3', '@types/react@^18.3.18'].join(' ')

  try {
    await executeCommand(`${installCommand} ${dependencies}`, rootDir)
    await executeCommand(`${installCommand} -D ${devDependencies}`, rootDir)
    console.log('✅ Dependencies installed')
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error)
  }
}

const preparePackageManager = async (rootDir: string) => {
  let packageManager = 'pnpm'
  const detectedPackageManager = getPackageManager(rootDir)

  if (detectedPackageManager !== 'unknown') {
    console.log(`📦 Detected package manager: ${packageManager}`)
    packageManager = detectedPackageManager
  } else {
    console.log(`📦 Using default package manager: ${packageManager}`)
    const pnpmCheck = await executeCommand('pnpm --version', rootDir).catch(() => null)
    if (!pnpmCheck) {
      console.log('📦 pnpm is not installed. Installing pnpm...')
      await executeCommand('npm install -g pnpm', rootDir)
      console.log('✅ pnpm installed globally')
    }
  }

  return packageManager
}

const wrapUpSetup = async (rootDir: string) => {
  const packageManager = await preparePackageManager(rootDir)

  await installRequiredDependencies(packageManager, rootDir).catch((error: unknown) => {
    console.log('❌ Failed to install dependencies')
    console.error(error)
  })

  console.log(`\n\nTo start the development server, run:\n\n${packageManager} run dev\n\n`)

  console.log('🚀 Project setup completed, happy coding!')
}

type Args = {
  projectName: string
  template?: string
  cursorEnabled?: boolean
}

export const create = async ({ projectName, template, cursorEnabled }: Args): Promise<void> => {
  console.log(
    '\n\n' +
      figlet.textSync('MOTIA', {
        font: 'Larry 3D',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true,
      }) +
      '\n\n',
  )

  const isCurrentDir = !!projectName.match(/\.\/?/)
  const rootDir = isCurrentDir ? process.cwd() : path.join(process.cwd(), projectName)
  console.log(`🛠️ Welcome to motia! Let's get you setup.`)

  if (!isCurrentDir && !checkIfDirectoryExists(rootDir)) {
    fs.mkdirSync(path.join(rootDir))
    console.log(`✅ ${projectName} directory created`)
  } else {
    console.log(`📁 Using current directory`)
  }

  if (!checkIfFileExists(rootDir, 'package.json')) {
    const packageJsonContent = {
      name: 'my-motia-project',
      description: '',
      scripts: {
        dev: 'motia dev',
        'dev:debug': 'motia dev --debug',
        'generate:config': 'motia get-config --output ./',
      },
      keywords: ['motia'],
    }

    fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2))
    console.log('✅ package.json created')
  } else {
    const packageJsonPath = path.join(rootDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    if (!packageJson.scripts) {
      packageJson.scripts = {}
    }

    if (!packageJson.scripts.dev) {
      packageJson.scripts.dev = 'motia dev'
    } else {
      packageJson.scripts.olddev = packageJson.scripts.dev
      packageJson.scripts.dev = 'motia dev'
      console.log('📁 dev command already exists in package.json')
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log('✅ Updated dev command to package.json')
  }

  if (!checkIfFileExists(rootDir, 'tsconfig.json')) {
    const tsconfigContent = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'Node',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        allowJs: true,
        outDir: 'dist',
        rootDir: '.',
        baseUrl: '.',
        jsx: 'react-jsx',
      },
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      exclude: ['node_modules', 'dist', 'tests'],
    }

    fs.writeFileSync(path.join(rootDir, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2))
    console.log('✅ tsconfig.json created')
  }

  // Update the path to look in the package root
  const cursorTemplateDir = path.join(__dirname, '../dot-files/.cursor')
  const cursorTargetDir = path.join(rootDir, '.cursor')

  if (cursorEnabled && !checkIfDirectoryExists(cursorTargetDir)) {
    fs.cpSync(cursorTemplateDir, cursorTargetDir, { recursive: true })
    console.log('✅ .cursor folder copied')
  }
  const stepsDir = path.join(rootDir, 'steps')
  if (!checkIfDirectoryExists(stepsDir)) {
    fs.mkdirSync(stepsDir)
    console.log('✅ steps directory created')
  }

  if (!template) {
    await wrapUpSetup(rootDir)
    return
  }

  if (template && !(template in templates)) {
    console.error(`❌ Template ${template} not found, please use one of the following:`)
    console.log(`📝 Available templates: \n\n ${Object.keys(templates).join('\n')}`)

    await wrapUpSetup(rootDir)
    return
  }

  await templates[template](stepsDir)

  await wrapUpSetup(rootDir)

  process.exit(0)
}
