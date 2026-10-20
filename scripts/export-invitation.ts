import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { variants, copy, wedding, dateMain, type Variant } from './lib/content'
import { posterHtml } from './lib/poster'
import { generateQrs, decodeQr } from './lib/qr'
import tokens from '../config/design-tokens.json'
import photoReview from '../config/photo-review.json'
import { renderedFonts } from './lib/browser'

const argIndex = process.argv.indexOf('--variant')
const requested = argIndex < 0 ? 'all' : process.argv[argIndex + 1]
if (requested !== 'all' && !variants.includes(requested as Variant)) throw new Error(`未知邀请主体：${requested}`)
const selected = requested === 'all' ? variants : [requested as Variant]
const directory = 'artifacts/v3/posters'
const previews = 'artifacts/v3/poster-previews'
await mkdir(`${directory}/share-qr`, { recursive: true })
await mkdir(previews, { recursive: true })
const masterCodes = await generateQrs(directory)
const shareCodes = await generateQrs(`${directory}/share-qr`, tokens.layout.posterShareWidth)
const outputs = [
  // 母版：真实3840px宽，用于保存与细看。
  { kind: 'master', width: tokens.layout.posterExportWidth, extension: 'png', codes: masterCodes },
  // 分享版：独立1080px渲染并重出二维码，微信转发效果另验。
  { kind: 'share', width: tokens.layout.posterShareWidth, extension: 'jpg', codes: shareCodes },
] as const
assert.equal(tokens.layout.posterExportWidth, tokens.layout.posterLogicalWidth * tokens.layout.posterExportScale)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const manifest = []
try {
  for (const variant of selected) {
    const variantCopy = copy.variants[variant]
    const sourcePath = `source/${variantCopy.mainPhoto}`
    const source = await readFile(sourcePath)
    const sourceMetadata = await sharp(source).metadata()
    const sourceHash = createHash('sha256').update(source).digest('hex')
    const review = photoReview[variantCopy.mainPhoto as keyof typeof photoReview]
    assert.ok(review?.actuallyViewed && review.sha256 === sourceHash, '主图必须已人工复核且哈希一致')
    assert.ok(sourceMetadata.width! >= tokens.layout.posterExportWidth, '原片宽度不足，禁止放大伪造4K细节')
    const files = []
    for (const output of outputs) {
      const scale = output.width / tokens.layout.posterLogicalWidth
      const html = await posterHtml(variant, output.codes, scale)
      if (output.kind === 'master') await writeFile(`${directory}/invitation-${variant}.html`, html)
      const page = await browser.newPage({ viewport: { width: tokens.layout.posterLogicalWidth, height: 900 }, deviceScaleFactor: scale })
      await page.setContent(html, { waitUntil: 'load' })
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].map(image => image.decode()))
      })
      const actualFonts = {
        names: await renderedFonts(page, '.person'),
        body: await renderedFonts(page, '.body-copy .phrase'),
        signature: variantCopy.signature ? await renderedFonts(page, '.signature') : [],
      }
      for (const fonts of [actualFonts.names, actualFonts.signature].filter(fonts => fonts.length)) {
        assert.ok(fonts.every(font => font.isCustomFont && /Wedding/.test(font.familyName)), '姓名与署名不允许缺字回退')
      }
      assert.ok(actualFonts.body.some(font => /PingFang/.test(font.familyName)), '正文必须使用实际加载的PingFang SC')
      const root = page.locator('.poster')
      const title = await page.locator('.title-art').getAttribute('alt')
      assert.equal(title, variantCopy.title)
      const text = `${title}\n${await root.innerText()}`
      const compact = text.replace(/\s/g, '')
      for (const field of [dateMain, wedding.date.weekday, ...variantCopy.names.flatMap(person => [person.name, person.relation ?? '']), ...variantCopy.bodyParagraphs, wedding.date.lunarFull, wedding.venue.name, wedding.venue.address, wedding.contact.phone, ...wedding.schedule.flatMap(item => [item.timeLabel, item.title, item.location ?? ''])]) {
        assert.ok(compact.includes(field.replace(/\s/g, '')), `${variant} 缺少 ${field}`)
      }
      if (variantCopy.signature) assert.ok(compact.includes(variantCopy.signature.replace(/\s/g, '')))
      else assert.equal(await page.locator('.signature').count(), 0)
      assert.doesNotMatch(compact, /14:00|张先生|李女士|2025年|梅林大街|https?:/)
      const photoBounds = (await page.locator('.photo>img').boundingBox())!
      assert.ok(Math.abs(photoBounds.height / photoBounds.width - sourceMetadata.height! / sourceMetadata.width!) < .001, '照片必须完整保持原比例')
      const heading = (await page.locator('.photo-heading').boundingBox())!
      assert.ok(heading.y + heading.height < photoBounds.height * .29, '标题不能碰到招手原图人物头发')
      const overflow = await page.locator('.poster').evaluate(element => {
        const root = element.getBoundingClientRect()
        return [...element.querySelectorAll('*')].filter(child => {
          const r = child.getBoundingClientRect()
          return r.left < root.left - 1 || r.right > root.right + 1 || r.bottom > root.bottom + 1
        }).map(child => child.className)
      })
      assert.deepEqual(overflow, [], '所有文字、图片和码位必须完整位于画布内')
      const slots = await page.locator('.qr-slot').evaluateAll(elements => elements.map(element => {
        const r = element.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height }
      }))
      // 清除浏览器对码位的任何亚像素采样，再在最终分辨率直接贴入整数模块二维码。
      const bounds = slots.map((slot, index) => ({
        left: Math.round(slot.x * scale + (slot.width * scale - output.codes[index]!.pixels) / 2),
        top: Math.round(slot.y * scale + (slot.height * scale - output.codes[index]!.pixels) / 2),
        width: output.codes[index]!.pixels,
        height: output.codes[index]!.pixels,
      }))
      const screenshot = await root.screenshot({ animations: 'disabled' })
      const clean = await sharp(screenshot).composite(slots.map(slot => ({
        input: { create: { width: Math.ceil(slot.width * scale) + 2, height: Math.ceil(slot.height * scale) + 2, channels: 3 as const, background: tokens.colors.qrLight } },
        left: Math.floor(slot.x * scale) - 1,
        top: Math.floor(slot.y * scale) - 1,
      }))).png().toBuffer()
      const file = `${directory}/invitation-${variant}-${output.kind}.${output.extension}`
      const rendered = sharp(clean).composite(output.codes.map((code, index) => ({ input: code.buffer, left: bounds[index]!.left, top: bounds[index]!.top })))
      if (output.kind === 'master') await rendered.png().toFile(file)
      else await rendered.jpeg({ quality: 96, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(file)
      const dimensions = await sharp(file).metadata()
      assert.equal(dimensions.width, output.width)
      const checks = []
      for (const [index, code] of output.codes.entries()) {
        const payload = await decodeQr(file, bounds[index])
        assert.equal(payload, code.url, `${variant} ${output.kind} 的 ${code.id} 载荷错误`)
        checks.push({ id: code.id, payload, passed: true })
      }
      if (output.kind === 'share') {
        await sharp(file).resize({ width: 360 }).png().toFile(`${previews}/invitation-${variant}-360.png`)
      } else {
        // 保留母版原像素细节，供检查人物、字形与码点；不是缩图清晰度证据。
        await sharp(file).extract({ left: 1250, top: 1700, width: 1400, height: 1100 }).png().toFile(`${previews}/faces-${variant}-1x.png`)
        const identity = (await page.locator('.identity').boundingBox())!
        await sharp(file).extract({ left: 180, top: Math.round(identity.y * scale), width: output.width - 360, height: Math.ceil(identity.height * scale) }).png().toFile(`${previews}/names-${variant}-1x.png`)
        if (variantCopy.signature) {
          const signature = (await page.locator('.signature').boundingBox())!
          await sharp(file).extract({ left: 180, top: Math.floor(signature.y * scale) - 24, width: output.width - 360, height: Math.ceil(signature.height * scale) + 48 }).png().toFile(`${previews}/signature-${variant}-1x.png`)
        }
      }
      files.push({ kind: output.kind, file, width: dimensions.width, height: dimensions.height, bytes: (await readFile(file)).length, scale, actualFonts, bounds, checks, text, overflow, headingBottom: heading.y + heading.height, photoHeight: photoBounds.height })
      console.log(`${variant} ${output.kind}: ${dimensions.width}×${dimensions.height}，双码回读通过`)
      await page.close()
    }
    manifest.push({ variant, mainPhoto: variantCopy.mainPhoto, source: { width: sourceMetadata.width, height: sourceMetadata.height, sha256: sourceHash }, crop: 'none', files, wechat: '待真机验证' })
  }
  await writeFile(`${directory}/manifest-${requested}.json`, JSON.stringify({
    renderer: `Chrome ${browser.version()}`, platform: process.platform,
    displayFont: 'Wedding Serif 600 (Source Han Serif CN subset)', bodyFont: 'PingFang SC',
    titleArtwork: { friends: 'docs/v3/assets/wedding-title-vector.svg', formal: 'docs/v3/assets/invitation-title-vector.svg' },
    qrColors: { dark: tokens.colors.qrDark, light: tokens.colors.qrLight },
    codes: [...masterCodes, ...shareCodes].map(({ buffer: _buffer, ...code }) => code), posters: manifest,
  }, null, 2) + '\n')
  console.log(`已导出 ${manifest.length} 套4K母版与独立分享版；微信真机待测。`)
} finally { await browser.close() }
