import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { wedding } from './lib/content'
import { decodeQr, type QrBounds } from './lib/qr'
import sharp from 'sharp'
import tokens from '../config/design-tokens.json'
const manifest = JSON.parse(await readFile('artifacts/v2/posters/manifest-all.json', 'utf8')) as { posters: { variant: string; master: string; share: string; bounds: QrBounds[] }[] }
assert.equal(manifest.posters.length, 4)
const checks = []
for (const code of wedding.qr) {
  const payload = await decodeQr(`artifacts/v2/posters/qr-${code.id}.png`)
  assert.equal(payload, code.url)
  checks.push({ file: `qr-${code.id}.png`, payload, passed: true })
  const sourceMeta = await sharp(`artifacts/v2/posters/qr-${code.id}.png`).metadata()
  const svg = await sharp(`artifacts/v2/posters/qr-${code.id}.svg`).resize({ width: sourceMeta.width, kernel: 'nearest' }).png().toBuffer()
  const svgPayload = await decodeQr(svg)
  assert.equal(svgPayload, code.url)
  checks.push({ file: `qr-${code.id}.svg`, payload: svgPayload, passed: true })
}
for (const poster of manifest.posters) {
  for (const file of [poster.master, poster.share]) {
    for (const [index, code] of wedding.qr.entries()) {
      const payload = await decodeQr(file, poster.bounds[index])
      assert.equal(payload, code.url)
      checks.push({ file, id: code.id, payload, passed: true })
      if (file === poster.master) {
        const { data, info } = await sharp(file).extract(poster.bounds[index]!).removeAlpha().raw().toBuffer({ resolveWithObject: true })
        const colors = new Set<string>()
        for (let pixel = 0; pixel < data.length; pixel += info.channels) colors.add('#' + data.subarray(pixel, pixel + 3).toString('hex').toUpperCase())
        assert.deepEqual([...colors].sort(), [tokens.colors.qrDark, tokens.colors.qrLight].sort(), '成品二维码必须保留原生双色，不产生亚像素灰边')
      }
    }
  }
}
await writeFile('artifacts/v2/qr-check.json', JSON.stringify({ passed: true, checks, wechat: '未测试，机器解码不等于微信转发扫码验收' }, null, 2) + '\n')
console.log('4个二维码PNG/SVG源文件及16个成品位置回读通过；清晰版码区无亚像素灰边。')
