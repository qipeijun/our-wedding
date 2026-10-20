import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { wedding } from './lib/content'
import { decodeQr, type QrBounds } from './lib/qr'
import sharp from 'sharp'
import tokens from '../config/design-tokens.json'

const directory = 'artifacts/v3/posters'
const manifest = JSON.parse(await readFile(`${directory}/manifest-all.json`, 'utf8')) as {
  codes: { id: string; png: string; svg: string; pixels: number; modules: number; scale: number; margin: number }[]
  posters: { variant: string; files: { kind: 'master' | 'share'; file: string; width: number; bounds: QrBounds[] }[] }[]
}
assert.equal(manifest.posters.length, 4)
const checks = []
for (const code of manifest.codes) {
  const expected = wedding.qr.find(item => item.id === code.id)!.url
  assert.ok(Number.isInteger(code.scale) && code.margin >= 4)
  assert.equal(code.pixels, (code.modules + code.margin * 2) * code.scale)
  const payload = await decodeQr(code.png)
  assert.equal(payload, expected)
  checks.push({ file: code.png, payload, passed: true })
  const svg = await sharp(code.svg).resize({ width: code.pixels, kernel: 'nearest' }).png().toBuffer()
  const svgPayload = await decodeQr(svg)
  assert.equal(svgPayload, expected)
  checks.push({ file: code.svg, payload: svgPayload, passed: true })
  // 纯底色静区保持四模块；圆角抗锯齿只能出现在码区内部。
  const { data, info } = await sharp(code.png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const light = Buffer.from(tokens.colors.qrLight.slice(1), 'hex')
  const quiet = code.margin * code.scale
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x >= quiet && x < info.width - quiet && y >= quiet && y < info.height - quiet) continue
      const offset = (y * info.width + x) * info.channels
      assert.ok(data.subarray(offset, offset + 3).equals(light), '二维码静区不得被圆角或装饰侵入')
    }
  }
}
for (const poster of manifest.posters) {
  assert.equal(poster.files.length, 2)
  for (const output of poster.files) {
    const metadata = await sharp(output.file).metadata()
    assert.equal(metadata.width, output.kind === 'master' ? 3840 : 1080)
    assert.equal(metadata.exif, undefined, '成品不携带原片EXIF/GPS')
    for (const [index, code] of wedding.qr.entries()) {
      const payload = await decodeQr(output.file, output.bounds[index])
      assert.equal(payload, code.url)
      checks.push({ file: output.file, id: code.id, payload, passed: true })
      if (output.kind === 'master') {
        const source = manifest.codes.find(item => item.id === code.id && !item.png.includes('/share-qr/'))!
        const actual = await sharp(output.file).extract(output.bounds[index]!).removeAlpha().raw().toBuffer()
        const expected = await sharp(source.png).removeAlpha().raw().toBuffer()
        assert.ok(actual.equals(expected), '母版码图必须原生合成，不引入额外缩放或颜色变化')
      } else {
        // 模拟缩小和JPEG再压缩，检查圆润码点仍可识别；不代替微信真机验收。
        const compressed = await sharp(output.file).extract(output.bounds[index]!).resize({ width: Math.round(output.bounds[index]!.width * .75) }).jpeg({ quality: 80 }).toBuffer()
        assert.equal(await decodeQr(compressed), code.url)
        checks.push({ file: output.file, id: code.id, scenario: '75%尺寸、JPEG质量80', passed: true })
      }
    }
  }
}
await writeFile('artifacts/v3/poster-qr-check.json', JSON.stringify({ passed: true, checks, wechat: '未测试，机器解码不等于微信转发扫码验收' }, null, 2) + '\n')
console.log(`${manifest.codes.length * 2}个二维码PNG/SVG源文件、16个成品码位及8个缩小压缩场景通过；静区与母版原生合成通过。`)
