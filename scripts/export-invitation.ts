import { chromium } from 'playwright'
import sharp from 'sharp'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { wedding } from '../src/config/wedding'
import { coverPhoto } from '../src/config/photos'
import { calendarIssues, coupleLabel, dateLabel, isDate, isHttpsUrl } from '../src/lib/wedding'

const draft = process.argv.includes('--draft')
if (!draft) {
  // 定位二维码使用已确认的分享链接，无需另外填写同一地点的坐标。
  const issues = [...calendarIssues(wedding)]
  if (!isHttpsUrl(wedding.publicUrl) || !isDate(wedding.publicUrlVerifiedOn)) issues.push('已验证的公开 HTTPS 网页网址')
  if (!isHttpsUrl(wedding.mapShareUrl) || !isDate(wedding.mapShareUrlVerifiedOn)) issues.push('已验证的 HTTPS 地图分享地址')
  if (issues.length) {
    console.error(`不能导出正式请柬，尚缺：${[...new Set(issues)].join('、')}。可添加 --draft 查看无二维码的设计稿。`)
    process.exit(1)
  }
}

const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
const photo = await sharp(`source/${coverPhoto.file}`).rotate().resize({ width: 1080 }).jpeg({ quality: 94 }).toBuffer()
const venueMap = await readFile('src/assets/venue-map.svg', 'utf8')
const doubleHappiness = (await readFile('src/assets/double-happiness-brush.webp')).toString('base64')
const qrItems = [{ label: '查看婚礼请柬', url: wedding.publicUrl }, { label: '导航至婚礼现场', url: wedding.mapShareUrl }]
const qrHtml = []
await mkdir('artifacts', { recursive: true })
for (const [index, item] of qrItems.entries()) {
  if (draft) {
    qrHtml.push(`<div><div class="qr-placeholder">${index === 0 ? '网页网址确认后' : '正式请柬导出时'}<br>生成二维码</div><p>${item.label}</p></div>`)
    continue
  }
  const png = await QRCode.toBuffer(item.url, { width: 360, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#392D2B', light: '#FFFFFF' } })
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  if (decoded?.data !== item.url) throw new Error(`${item.label}二维码回读失败，停止导出`)
  await writeFile(`artifacts/qr-${index === 0 ? 'wedding' : 'location'}.png`, png)
  qrHtml.push(`<div><img class="qr" src="data:image/png;base64,${png.toString('base64')}" alt="${item.label}"><p>${item.label}</p></div>`)
}
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 2400 }, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;color:#392d2b;background:#f4ebdd;font-family:"PingFang SC","Microsoft YaHei",sans-serif}
    p,h1,h2{margin:0} .poster{width:1080px}.cover{position:relative;background:#92352e}.cover>img{display:block;width:100%;height:auto}
    .title{position:absolute;top:4.5%;width:100%;text-align:center;color:#f9edda;font-family:"Songti SC",serif}
    .title h1{font-size:${wedding.titleStyle === 'xi' ? '265' : '100'}px;font-weight:500;line-height:1.1}.title p{font-size:34px;letter-spacing:.3em;margin-top:6px}
    .title .xi{width:300px;height:300px;margin:auto;background-size:contain;background-repeat:no-repeat;background-position:center}
    .body{text-align:center;padding:70px 85px 65px}.draft{font-size:25px;color:#92352e;margin-bottom:25px}.names{font-family:"Songti SC",serif;font-size:60px;color:#92352e;letter-spacing:.08em}
    .date{font-size:35px;margin-top:25px}.time{font-size:30px;margin-top:16px}h2{font-family:"Songti SC",serif;font-weight:500;font-size:46px;margin:40px 0 15px}
    .address{font-size:28px;line-height:1.8;overflow-wrap:anywhere}.copy{font-size:29px;line-height:1.9;white-space:pre-line;margin-top:34px}
    .map{margin:38px auto 0;width:100%;border:1px solid #d9c4b4}.map svg{display:block;width:100%;height:auto}
    .codes{display:flex;justify-content:center;gap:100px;margin-top:45px}.codes p{font-size:26px;margin-top:16px}.qr{display:block;width:280px;height:280px}
    .qr-placeholder{width:280px;height:280px;border:2px dashed #b49a78;color:#79675c;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1.9}
  </style></head><body><article class="poster"><div class="cover"><img src="data:image/jpeg;base64,${photo.toString('base64')}" alt="婚纱照"><div class="title">${wedding.titleStyle === 'xi' ? `<h1 class="xi" aria-label="囍" style="background-image:url(data:image/webp;base64,${doubleHappiness})"></h1><p>${escape(wedding.copy.coverSubtitle)}</p>` : `<h1>${escape(wedding.copy.coverSubtitle)}</h1>`}</div></div><div class="body">
    ${draft ? '<p class="draft">设计预览 · 二维码待生成</p>' : ''}
    <p class="names">${escape(coupleLabel(wedding))}</p><p class="date">${escape(dateLabel(wedding.weddingDate))}</p>
    <p class="time">${wedding.ceremonyTime ? `仪式 ${escape(wedding.ceremonyTime)}` : '仪式时间待确认'} · ${escape(wedding.ceremonyVenue)}</p>
    ${wedding.banquetTime ? `<p class="time">${escape(wedding.copy.banquetLabel)} ${escape(wedding.banquetTime)} · ${escape(wedding.banquetVenue)}</p>` : ''}
    <h2>${escape(wedding.venueName)}</h2><p class="address">${escape(wedding.venueRegion)}<br>${escape(wedding.venueAddress || '详细地址待确认')}</p>
    <div class="map">${venueMap}</div>
    <p class="copy">${escape(wedding.invitationText)}</p><div class="codes">${qrHtml.join('')}</div>
  </div></article></body></html>`, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  const path = `artifacts/invitation${draft ? '-draft' : ''}.png`
  await page.locator('.poster').screenshot({ path })
  await page.locator('.map svg').screenshot({ path: 'artifacts/venue-map.png' })
  if (!draft) {
    // 在最终成品中按实际二维码位置回读，避免只验证原始二维码而漏掉排版缩放问题。
    const bounds = await page.locator('.qr').evaluateAll((images) => images.map((image) => {
      const rect = image.getBoundingClientRect()
      return { left: Math.round(rect.x), top: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
    }))
    for (const [i, boundsItem] of bounds.entries()) {
      const { data, info } = await sharp(path).extract(boundsItem).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      if (jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data !== qrItems[i]?.url) throw new Error('成品二维码回读失败，请检查缩放')
    }
  }
  console.log(`已导出 ${path}${draft ? '（设计稿，无可扫描二维码）' : '，两个成品二维码回读通过；仍需微信实机扫码验收'}`)
} finally { await browser.close() }
