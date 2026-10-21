import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { wedding } from './lib/content'
import { decodeQr } from './lib/qr'
import tokens from '../config/design-tokens.json'

// 分享版在指定水面叠放小型导航入口，不进入H5底图。
const source = 'docs/v3/previews/venue-map-share-v5.png'
const directory = 'artifacts/v3/map-share'
await mkdir(directory, { recursive: true })
const original = await readFile(source)
const metadata = await sharp(original).metadata()
assert.equal(metadata.width, 1024)
assert.equal(metadata.height, 1536)
const width = metadata.width
const height = metadata.height
const matrix = QRCode.create(wedding.venue.mapUrl, { errorCorrectionLevel: 'M' })
const margin = tokens.qr.quietZoneModules
// 此处是小型辅助入口；以3px整数模块输出111px码，不套用海报的大码尺寸。
const moduleScale = 3
const pixels = (matrix.modules.size + margin * 2) * moduleScale
const foregroundOpacity = .85
const backgroundOpacity = .45
const foregroundAlpha = Math.round(foregroundOpacity * 255).toString(16).padStart(2, '0')
const backgroundAlpha = Math.round(backgroundOpacity * 255).toString(16).padStart(2, '0')
const qr = await QRCode.toBuffer(wedding.venue.mapUrl, {
  errorCorrectionLevel: 'M', margin, scale: moduleScale,
  color: { dark: tokens.colors.qrDark + foregroundAlpha, light: tokens.colors.paper + backgroundAlpha },
})
// 右、下边距使用同一数值，码图包含四边静区；避开「贡水」文字。
const edgeInset = 40
const bounds = { left: width - edgeInset - pixels, top: height - edgeInset - pixels, width: pixels, height: pixels }
const png = `${directory}/venue-map-share-qr.png`
const jpeg = `${directory}/venue-map-share-qr.jpg`
await sharp(original)
  .composite([{ input: qr, left: bounds.left, top: bounds.top }])
  .png().toFile(png)
await sharp(png).jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(jpeg)
await sharp(png).resize({ width: 390 }).png().toFile(`${directory}/preview-390.png`)

// 大尺寸保存版仅放大既有底图，二维码按原生整数模块重新生成，避免码点插值。
const masterScale = 4
const master = `${directory}/venue-map-share-qr-4096.png`
const masterQr = await QRCode.toBuffer(wedding.venue.mapUrl, {
  errorCorrectionLevel: 'M', margin, scale: moduleScale * masterScale,
  color: { dark: tokens.colors.qrDark + foregroundAlpha, light: tokens.colors.paper + backgroundAlpha },
})
const masterBounds = {
  left: bounds.left * masterScale, top: bounds.top * masterScale,
  width: pixels * masterScale, height: pixels * masterScale,
}
await sharp(original).resize({ width: width * masterScale, kernel: 'lanczos3' })
  .composite([{ input: masterQr, left: masterBounds.left, top: masterBounds.top }])
  .png().toFile(master)

// 验证二维码覆盖范围以外逐像素不变，确保建筑、斑马线和路线没有被重绘。
const before = await sharp(original).removeAlpha().raw().toBuffer()
const after = await sharp(png).extract({ left: 0, top: 0, width, height: metadata.height }).removeAlpha().raw().toBuffer()
for (let y = 0; y < height; y++) {
  const row = y * width * 3
  if (y >= bounds.top && y < bounds.top + pixels) {
    assert.ok(before.subarray(row, row + bounds.left * 3).equals(after.subarray(row, row + bounds.left * 3)))
    const right = row + (bounds.left + pixels) * 3
    assert.ok(before.subarray(right, row + width * 3).equals(after.subarray(right, row + width * 3)))
  } else {
    assert.ok(before.subarray(row, row + width * 3).equals(after.subarray(row, row + width * 3)))
  }
}
const checks = []
assert.equal(await decodeQr(master, masterBounds), wedding.venue.mapUrl)
checks.push({ file: master, cropDecodePassed: true, fullImageDecodePassed: null })
for (const file of [png, jpeg]) {
  assert.equal(await decodeQr(file, bounds), wedding.venue.mapUrl)
  assert.equal(await decodeQr(file), wedding.venue.mapUrl)
  checks.push({ file, cropDecodePassed: true, fullImageDecodePassed: true })
}
// 软件压缩回读仅覆盖这些具体样本，不代表微信真机转发验收。
for (const targetWidth of [768, 640]) {
  const file = `${directory}/check-${targetWidth}-q75.jpg`
  await sharp(png).resize({ width: targetWidth }).jpeg({ quality: 75 }).toFile(file)
  const ratio = targetWidth / width
  const crop = {
    left: Math.floor(bounds.left * ratio), top: Math.floor(bounds.top * ratio),
    width: Math.ceil(pixels * ratio), height: Math.ceil(pixels * ratio),
  }
  assert.equal(await decodeQr(file, crop), wedding.venue.mapUrl)
  assert.equal(await decodeQr(file), wedding.venue.mapUrl)
  checks.push({ file, cropDecodePassed: true, fullImageDecodePassed: true })
}
await writeFile(`${directory}/verification.json`, JSON.stringify({
  source, width, height, url: wedding.venue.mapUrl, label: null,
  master: { file: master, width: width * masterScale, height: height * masterScale, mapResampledFromWidth: width, qrGeneratedAtOutputResolution: true },
  qr: { ...bounds, modules: matrix.modules.size, moduleScale, margin, foregroundOpacity, backgroundOpacity, foreground: tokens.colors.qrDark, background: tokens.colors.paper },
  pixelsOutsideQrUnchanged: true, checks, wechat: '待真机检查',
}, null, 2) + '\n')
console.log(`分享地图 ${width}×${height}；码区以外原图像素保持一致；${checks.length}项二维码回读通过。`)
