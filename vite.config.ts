import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { wedding, copy, escapeHtml, essentialHtml } from './scripts/lib/content'

export default defineConfig({
  plugins: [vue(), {
    name: 'wedding-html',
    transformIndexHtml(html) {
      return html.replace('__WEDDING_TITLE__', escapeHtml(copy.metadata.title))
        .replace('__WEDDING_DESCRIPTION__', escapeHtml(copy.metadata.description))
        .replace('<!--essential-info-->', essentialHtml())
    },
  }],
  base: wedding.deployment.currentPublicPath,
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2018' },
})
