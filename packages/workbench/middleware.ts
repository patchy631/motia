import autoprefixer from 'autoprefixer'
import type { Express, NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import tailwindcss from 'tailwindcss'
import { createServer as createViteServer } from 'vite'
import tailwindcssConfig from './tailwind.config'

export const applyMiddleware = async (app: Express) => {
  const vite = await createViteServer({
    appType: 'spa',
    root: __dirname,

    server: {
      middlewareMode: true,
      fs: {
        allow: [__dirname, path.join(process.cwd(), './steps')],
      },
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    css: {
      postcss: {
        plugins: [autoprefixer(), tailwindcss(tailwindcssConfig)],
      },
    },
  })

  app.use(vite.middlewares)

  app.use('*', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl

    console.log('[UI] Request', { url })

    try {
      const index = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
      const html = await vite.transformIndexHtml(url, index)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      next(e)
    }
  })
}
