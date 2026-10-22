import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { wedding, copy, escapeHtml, openingShellHtml } from './scripts/lib/content'

export default defineConfig({
  plugins: [vue(), {
    name: 'wedding-html',
    transformIndexHtml(html) {
      return html.replace('__WEDDING_TITLE__', escapeHtml(copy.metadata.title))
        .replace('__WEDDING_DESCRIPTION__', escapeHtml(copy.metadata.description))
        .replace('<!--opening-critical-css-->', `<style>${readFileSync(new URL('./src/generated/tokens.css', import.meta.url), 'utf8')}\n${readFileSync(new URL('./src/styles/opening-shell.css', import.meta.url), 'utf8')}</style>`)
        .replace('<!--opening-shell-->', openingShellHtml(readFileSync(new URL('./src/assets/invitation-envelope.svg', import.meta.url), 'utf8')))
    },
  }, {
    name: 'inline-production-style',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!context.bundle) return html
        // 全站样式压缩后不足 4KB；内联后首帧不再被外部 CSS 下载阻塞。
        return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, tag => {
          const href = tag.match(/href="([^"]+)"/)![1]
          const asset = context.bundle![href.slice(wedding.deployment.currentPublicPath.length)]
          if (!asset || asset.type !== 'asset') throw new Error(`未找到首屏样式产物：${href}`)
          return `<style>${asset.source}</style>`
        })
      },
    },
  }],
  base: wedding.deployment.currentPublicPath,
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2018' },
})
