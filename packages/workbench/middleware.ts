

export const applyMiddleware = async (app: any) => {
  // NOTE: this is needed since vite is an ESM https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated
  const tailwindcssConfig = await import('./tailwind.config')
  const fs = await import('fs')
  const path = await import('path')
  const { default: Express } = await import('express')
  const { createServer } = await import('vite')
  const { default: autoprefixer } = await import('autoprefixer')
  const { default: tailwindcss } = await import('tailwindcss')

  const vite = await createServer({
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

  app.use('*', async (req: typeof Express.request, res: typeof Express.response, next: any) => {
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
