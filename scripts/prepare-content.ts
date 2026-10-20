import { mkdir, writeFile } from 'node:fs/promises'
import { wedding, copy, dateMain } from './lib/content'
import tokens from '../config/design-tokens.json'

await mkdir('src/generated', { recursive: true })
// 父母版文案、内部结束时间与素材档案不进入宾客网页包。
const page = {
  wedding: { couple: wedding.couple, date: wedding.date, dateMain, schedule: wedding.schedule, venue: wedding.venue, contact: wedding.contact, backgroundMusic: wedding.features.backgroundMusic },
  copy: { h5: copy.h5, ui: copy.ui, copyAddressText: copy.copyAddressText },
}
await writeFile('src/generated/page.json', JSON.stringify(page, null, 2) + '\n')
const css = [
  ...Object.entries(tokens.colors).map(([key, value]) => `--${key.replace(/[A-Z]/g, char => '-' + char.toLowerCase())}:${value};`),
  `--content-max:${tokens.layout.mobileMaxWidth}px;`, `--gutter:${tokens.layout.h5GutterPx}px;`,
  `--body-size:${tokens.typography.h5BodyPx}px;`, `--body-line:${tokens.typography.bodyLineHeight};`,
  `--button-radius:${tokens.layout.buttonRadiusPx}px;`, `--touch-target:${tokens.layout.touchTargetPx}px;`,
  `--sticky-height:${tokens.layout.stickyBarPx}px;`,
]
await writeFile('src/generated/tokens.css', `/* 从 config/design-tokens.json 生成。 */\n:root{${css.join('')}}\n`)
console.log('已生成 H5 专用数据与视觉变量。')
