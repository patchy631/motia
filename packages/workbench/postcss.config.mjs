import path from 'path'

export default {
  plugins: {
    "@tailwindcss/postcss": {
      base: path.join(import.meta.dirname, './src'),
    },
  }
}