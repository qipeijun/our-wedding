import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { wedding, copy, dateMain, escapeHtml as e, type Variant } from './content'
import tokens from '../../config/design-tokens.json'
import type { generateQrs } from './qr'

type Qrs = Awaited<ReturnType<typeof generateQrs>>

/** 独立海报 DOM：共用正式配置，不加载 H5 代码和交互，也不依赖线上服务。 */
export async function posterHtml(variant: Variant, codes: Qrs): Promise<string> {
  const item = copy.variants[variant]
  const photo = await sharp(`source/${item.mainPhoto}`).rotate().resize({ width: 1080 }).toColourspace('srgb').jpeg({ quality: 96 }).toBuffer()
  const font = await readFile('public/fonts/wedding-serif.woff2')
  const names = `<div class="names ${item.nameMode}">${item.names.map(person => `<div>${person.relation ? `<span class="relation">${e(person.relation)}</span>` : ''}<span class="person">${e(person.name)}</span></div>`).join(item.nameMode === 'couple' ? '<span class="dot" aria-hidden="true">·</span>' : '')}</div>`
  const colors = tokens.colors
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${e(item.title)}</title><style>
@font-face {
  font-family: 'Wedding Serif';
  src: url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');
  font-weight: 600;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: ${colors.paper};
  color: ${colors.ink};
  font-family: 'PingFang SC',sans-serif;
  font-size: ${variant === 'friends' ? tokens.typography.posterFriendsBodyPx : tokens.typography.posterFormalBodyPx}px;
  line-height: 1.65;
  font-synthesis: none;
}
h1,h2,p,dl,dd {
  margin: 0;
}
.poster {
  width: ${tokens.layout.posterLogicalWidth}px;
  background: ${colors.paper};
}
.photo {
  position: relative;
}
.photo>img {
  display: block;
  width: 100%;
  height: auto;
}
.photo-heading {
  position: absolute;
  top: 5%;
  left: 12px;
  right: 12px;
  text-align: center;
  color: ${colors.paper};
}
h1 {
  font: 600 ${variant === 'friends' ? '33' : '31'}px/1.25 'Wedding Serif',serif;
  letter-spacing: .035em;
}
.names {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  font: 600 27px/1.3 'Wedding Serif',serif;
}
.photo-heading .names {
  margin-top: 14px;
}
.person {
  white-space: nowrap;
}
.dot {
  font-size: 20px;
}
.relations {
  gap: 36px;
}
.relation {
  display: block;
  font: 400 16px/1.5 'PingFang SC',sans-serif;
  color: ${colors.muted};
  margin-bottom: 4px;
}
.identity {
  margin-bottom: 26px;
  color: ${colors.brandDeep};
}
.info {
  padding: 30px ${tokens.layout.posterContentGutterPx}px 28px;
}
.body-copy {
  text-align: center;
}
.body-copy .phrase {
  display: block;
}
.body-copy p+p {
  margin-top: 12px;
}
.date {
  text-align: center;
  margin-top: 28px;
}
.date-main {
  font: 600 23px/1.4 'Wedding Serif',serif;
  color: ${colors.brandDeep};
}
.weekday {
  font-size: 17px;
  margin-top: 6px;
}
.lunar {
  font-size: 16px;
  color: ${colors.muted};
  margin-top: 2px;
}
.venue {
  margin-top: 24px;
  text-align: left;
}
.venue h2 {
  font: 600 22px/1.3 'Wedding Serif',serif;
  color: ${colors.brandDeep};
  margin-bottom: 8px;
}
.address {
  font-size: 17px;
  line-height: 1.65;
  text-wrap: pretty;
}
.schedule {
  margin-top: 24px;
}
.schedule-row {
  display: grid;
  grid-template-columns: 94px minmax(0,1fr);
  column-gap: 12px;
  font-size: 18px;
  line-height: 1.6;
}
.schedule-row+.schedule-row {
  margin-top: 14px;
}
.schedule dt {
  color: ${colors.brandDeep};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.schedule dd span {
  display: block;
  word-break: keep-all;
  overflow-wrap: break-word;
}
.location {
  color: ${colors.muted};
}
.signature {
  text-align: center;
  margin-top: 28px;
  color: ${colors.brandDeep};
  font: 600 21px/1.5 'Wedding Serif',serif;
  white-space: nowrap;
}
.codes {
  display: flex;
  justify-content: center;
  gap: 36px;
  margin-top: 30px;
}
.code {
  text-align: center;
  width: 100px;
}
.qr-slot {
  position: relative;
  width: 100px;
  height: 100px;
  background: ${colors.qrLight};
}
.qr-slot img {
  position: absolute;
  inset: 0;
  margin: auto;
  image-rendering: pixelated;
}
.code p {
  margin-top: 8px;
  font-size: 17px;
  color: ${colors.brandDeep};
}
.contact {
  text-align: center;
  margin-top: 26px;
  font-size: 16px;
  line-height: 1.6;
}
.contact .phone {
  display: block;
  font-size: 18px;
  letter-spacing: .025em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style></head>
<body><article class="poster" data-variant="${variant}"><div class="photo"><img alt="新人婚纱照" src="data:image/jpeg;base64,${photo.toString('base64')}"><div class="photo-heading"><h1>${e(item.title)}</h1>${variant === 'friends' ? names : ''}</div></div><div class="info">${variant !== 'friends' ? `<div class="identity">${names}</div>` : ''}<div class="body-copy">${item.bodyParagraphs.map(paragraph => `<p>${paragraph.split('，').map((phrase, index, phrases) => `<span class="phrase">${e(phrase)}${index < phrases.length - 1 ? '，' : ''}</span>`).join('')}</p>`).join('')}</div><div class="date"><p class="date-main">${e(dateMain)}</p><p class="weekday">${e(wedding.date.weekday)}</p><p class="lunar">${e(wedding.date.lunarFull)}</p></div><div class="venue"><h2>${e(wedding.venue.name)}</h2><p class="address">${e(wedding.venue.address)}</p></div><dl class="schedule">${wedding.schedule.map(event => `<div class="schedule-row"><dt>${e(event.timeLabel)}</dt><dd><span>${e(event.title)}</span>${event.location ? `<span class="location">${e(event.location)}</span>` : ''}</dd></div>`).join('')}</dl>${item.signature ? `<p class="signature">${e(item.signature)}</p>` : ''}<div class="codes">${codes.map(code => `<div class="code"><div class="qr-slot"><img src="data:image/png;base64,${code.buffer.toString('base64')}" width="${code.pixels / 3}" height="${code.pixels / 3}" alt="${e(code.label)}二维码"></div><p>${e(code.label)}</p></div>`).join('')}</div><p class="contact">联系人：${e(wedding.contact.name)}<span class="phone">${e(wedding.contact.phone)}</span></p></div></article></body></html>`
}
