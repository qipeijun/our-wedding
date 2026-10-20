import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { variants, type Variant } from './lib/content'
import { posterHtml } from './lib/poster'
import { generateQrs, decodeQr } from './lib/qr'
import tokens from '../config/design-tokens.json'
import { renderedFonts } from './lib/browser'
import assert from 'node:assert/strict'
import { copy, wedding } from './lib/content'

const argIndex = process.argv.indexOf('--variant')
const requested = argIndex < 0 ? 'all' : process.argv[argIndex + 1]
if (requested !== 'all' && !variants.includes(requested as Variant)) throw new Error(`未知邀请主体：${requested}`)
const selected = requested === 'all' ? variants : [requested as Variant]
const directory = 'artifacts/v2/posters'
await mkdir(directory, { recursive: true })
await mkdir('artifacts/v2/previews', { recursive: true })
const codes = await generateQrs(directory)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const manifest = []
try {
  for (const variant of selected) {
    const html = await posterHtml(variant, codes)
    await writeFile(`${directory}/invitation-${variant}.html`, html)
    const page = await browser.newPage({ viewport: { width: 360, height: 900 }, deviceScaleFactor: tokens.layout.posterExportScale })
    await page.setContent(html, { waitUntil: 'load' })
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())) })
    if (!await page.evaluate(() => document.fonts.check('600 27px "Wedding Serif"', '戚培俊涂丽纯囍尹李英'))) throw new Error('导出字体未就绪')
    const actualFonts = { names: await renderedFonts(page, '.person'), body: await renderedFonts(page, '.body-copy .phrase') }
    assert.ok(actualFonts.names.some(font => font.isCustomFont && /Wedding/.test(font.familyName)), '姓名必须使用实际加载的定制字形子集')
    assert.ok(actualFonts.body.some(font => /PingFang/.test(font.familyName)), `导出正文实际字体不符：${JSON.stringify(actualFonts.body)}`)
    const root = page.locator('.poster')
    const screenshot = await root.screenshot({ animations: 'disabled' })
    const slots = await page.locator('.qr-slot').evaluateAll(elements => elements.map(element => {
      const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
    }))
    // 浏览器负责排版，二维码在最终 1080 成品中用原生整数尺寸合成，避免亚像素边缘。
    const bounds = slots.map((slot, index) => ({ left: Math.round(slot.x * 3 + (slot.width * 3 - codes[index]!.pixels) / 2), top: Math.round(slot.y * 3 + (slot.height * 3 - codes[index]!.pixels) / 2), width: codes[index]!.pixels, height: codes[index]!.pixels }))
    const clean = await sharp(screenshot).composite(slots.map(slot => ({ input: { create: { width: 300, height: 300, channels: 3 as const, background: tokens.colors.qrLight } }, left: Math.round(slot.x * 3), top: Math.round(slot.y * 3) }))).png().toBuffer()
    const master = `${directory}/invitation-${variant}-master.png`
    const share = `${directory}/invitation-${variant}-share.jpg`
    await sharp(clean).composite(codes.map((code, i) => ({ input: code.buffer, left: bounds[i]!.left, top: bounds[i]!.top }))).png().toFile(master)
    await sharp(master).jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(share)
    const checks = []
    for (const file of [master, share]) {
      for (const [i, code] of codes.entries()) {
        const payload = await decodeQr(file, bounds[i])
        if (payload !== code.url) throw new Error(`${file} 的 ${code.id} 载荷不一致`)
        checks.push({ file, id: code.id, payload, passed: true })
      }
    }
    // 360px 只作为阅读预览，分享成品保持1080宽。
    await sharp(master).resize({ width: 360 }).png().toFile(`artifacts/v2/previews/invitation-${variant}-360.png`)
    const dimensions = await sharp(master).metadata()
    const text = await root.innerText()
    const compact = text.replace(/\s/g, '')
    const variantCopy = copy.variants[variant]
    for (const field of [variantCopy.title, ...variantCopy.names.map(person => person.name), ...variantCopy.bodyParagraphs, wedding.date.lunarFull, wedding.venue.address, wedding.contact.phone, ...wedding.schedule.flatMap(item => [item.timeLabel, item.title, item.location ?? ''])]) {
      assert.ok(compact.includes(field.replace(/\s/g, '')), `${variant} 缺少 ${field}`)
    }
    if (variantCopy.signature) assert.ok(compact.includes(variantCopy.signature.replace(/\s/g, '')))
    assert.doesNotMatch(compact, /14:00|张先生|李女士|2025年|梅林大街|https?:/)
    const photoHeight = (await page.locator('.photo>img').boundingBox())!.height
    const heading = (await page.locator('.photo-heading').boundingBox())!
    assert.ok(heading.y + heading.height < photoHeight * (variant === 'friends' ? .295 : .225), '标题不能碰到原图人物头发')
    const detailTop = variant === 'friends' ? 0 : Math.round(photoHeight * 3)
    await sharp(master).extract({ left: 0, top: detailTop, width: 1080, height: 720 }).png().toFile(`artifacts/v2/previews/detail-${variant}.png`)
    manifest.push({ variant, mainPhoto: variantCopy.mainPhoto, crop: 'none', master, share, width: dimensions.width, height: dimensions.height, masterBytes: (await readFile(master)).length, shareBytes: (await readFile(share)).length, actualFonts, bounds, checks, text, wechat: '待真机验证' })
    await page.close()
  }
  await writeFile(`${directory}/manifest-${requested}.json`, JSON.stringify({ renderer: `Chrome ${browser.version()}`, platform: process.platform, displayFont: 'Wedding Serif 600 (Source Han Serif CN subset)', bodyFont: 'PingFang SC', scale: 3, qrColors: { dark: tokens.colors.qrDark, light: tokens.colors.qrLight }, codes: codes.map(({ buffer: _buffer, ...code }) => code), posters: manifest }, null, 2) + '\n')
  console.log(`已导出 ${manifest.length} 套清晰版与分享版，${manifest.length * 4} 个最终二维码位置回读通过。微信真机待测。`)
} finally { await browser.close() }
