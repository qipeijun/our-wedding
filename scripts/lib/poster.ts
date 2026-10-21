import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { wedding, copy, dateMain, escapeHtml as e, type Variant } from './content'
import tokens from '../../config/design-tokens.json'
import type { generateQrs } from './qr'

type Qrs = Awaited<ReturnType<typeof generateQrs>>

/** 独立海报排版，共用婚礼事实；按输出比例布置原生二维码，不加载H5或线上资源。 */
export async function posterHtml(variant: Variant, codes: Qrs, scale: number): Promise<string> {
  const item = copy.variants[variant]
  const photo = await sharp(`source/${item.mainPhoto}`).rotate()
    .resize({ width: tokens.layout.posterExportWidth, withoutEnlargement: true })
    .toColourspace('srgb').png().toBuffer()
  const font = await readFile('public/fonts/wedding-serif.woff2')
  const titlePath = variant === 'friends' ? 'wedding-title-vector.svg' : 'invitation-title-vector.svg'
  const title = `<h1><img class="title-art" alt="${e(item.title)}" src="data:image/svg+xml;base64,${(await readFile(`docs/v3/assets/${titlePath}`)).toString('base64')}"></h1>`
  const names = item.names.map(person => `<div class="person-group">${person.relation ? `<span class="relation">${e(person.relation)}</span>` : ''}<span class="person">${e(person.name)}</span></div>`).join('<span class="name-dot" aria-hidden="true">·</span>')
  const colors = tokens.colors
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${e(item.title)}</title><style>
@font-face {
  font-family: 'Wedding Serif';
  src: url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');
  font-weight: 600;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  color: ${colors.ink};
  background: ${colors.qrLight};
  font: 400 ${variant === 'friends' ? tokens.typography.posterFriendsBodyPx : tokens.typography.posterFormalBodyPx}px/1.65 'PingFang SC',sans-serif;
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
}
h1,h2,p,dl,dd { margin: 0; }
.poster { width: ${tokens.layout.posterLogicalWidth}px; background: ${colors.qrLight}; }
.photo { position: relative; }
.photo>img { display: block; width: 100%; height: auto; }
.photo-heading {
  position: absolute;
  top: ${variant === 'friends' ? '24px' : '44px'};
  left: ${variant === 'friends' ? '28px' : '40px'};
  right: ${variant === 'friends' ? '28px' : '40px'};
  text-align: center;
  color: ${colors.paper};
}
h1 { font: 600 42px/1.35 'Wedding Serif',serif; letter-spacing: .06em; }
.title-art { display: block; width: 100%; height: auto; }
.identity {
  padding: 16px 26px 18px;
  background: ${colors.brandDeep};
  color: ${colors.paper};
}
.names { display: flex; align-items: center; justify-content: center; gap: 20px; }
.person-group { text-align: center; }
.person { display: block; white-space: nowrap; font: 600 27px/1.4 'Wedding Serif',serif; }
.name-dot { font: 400 21px/1 'Wedding Serif',serif; opacity: .75; }
.relations .name-dot { align-self: flex-end; margin-bottom: 12px; }
.relation { display: block; font-size: 16px; line-height: 1.4; margin-bottom: 3px; }
.info { padding: 26px ${tokens.layout.posterContentGutterPx}px 28px; }
.body-copy { max-width: ${variant === 'friends' ? '260px' : '280px'}; margin-inline: auto; text-align: center; }
.body-copy .phrase { display: inline-block; }
/* 父母版先表达邀请，再将敬备喜筵与恭候光临连为一行。 */
.poster[data-variant$="-parents"] .body-copy p:last-child .phrase:first-child { display: block; }
.body-copy p+p { margin-top: 8px; }
.date { text-align: center; margin-top: 24px; }
.date-main { font: 600 25px/1.4 'Wedding Serif',serif; color: ${colors.brandDeep}; }
.date-secondary { margin-top: 6px; font-size: 16px; line-height: 1.6; white-space: nowrap; color: ${colors.muted}; }
.date-secondary .weekday { margin-right: 10px; }
.venue { margin-top: 22px; padding-top: 20px; border-top: 1px solid ${colors.rule}; }
.venue-label { margin-bottom: 6px; color: ${colors.muted}; font-size: 14px; line-height: 1.5; letter-spacing: .08em; }
.venue h2 { font: 600 23px/1.4 'Wedding Serif',serif; color: ${colors.brandDeep}; margin-bottom: 7px; }
.address { color: ${colors.muted}; font-size: 17px; line-height: 1.65; text-wrap: pretty; }
.schedule { margin-top: 22px; }
.schedule-row { position: relative; display: grid; grid-template-columns: 94px minmax(0,1fr); column-gap: 24px; padding-bottom: 14px; font-size: 18px; line-height: 1.55; }
.schedule-row:last-child { padding-bottom: 0; }
.schedule-row:not(:last-child)::before { content: ''; position: absolute; left: 106px; top: 14px; bottom: -14px; width: 1px; background: ${colors.rule}; }
.schedule-row::after { content: ''; position: absolute; left: 103px; top: 10px; width: 7px; height: 7px; border: 1px solid ${colors.brandDeep}; border-radius: 50%; background: ${colors.qrLight}; }
.schedule dt { color: ${colors.brandDeep}; font-variant-numeric: tabular-nums; white-space: nowrap; }
.schedule-row[data-event="arrival"], .schedule-row[data-event="arrival"] dt { color: ${colors.muted}; }
.schedule dd span { display: block; word-break: keep-all; overflow-wrap: break-word; }
.location { color: ${colors.muted}; font-size: 17px; }
.signature { text-align: center; margin-top: 24px; color: ${colors.brandDeep}; font: 600 21px/1.5 'Wedding Serif',serif; white-space: nowrap; }
.codes { display: flex; justify-content: center; gap: 36px; margin-top: 20px; }
.code { text-align: center; width: 100px; }
.qr-slot { position: relative; width: 100px; height: 100px; background: ${colors.qrLight}; }
.qr-slot img { position: absolute; inset: 0; margin: auto; image-rendering: pixelated; }
.code p { margin-top: 5px; font-size: 16px; color: ${colors.muted}; }
</style></head>
<body><article class="poster" data-variant="${variant}">
  <div class="photo"><img alt="新人挥手婚纱照" src="data:image/png;base64,${photo.toString('base64')}"><div class="photo-heading">${title}</div></div>
  <div class="identity"><div class="names ${item.nameMode}">${names}</div></div>
  <div class="info">
    <div class="body-copy">${item.bodyParagraphs.map(paragraph => `<p>${paragraph.split('，').map((phrase, index, phrases) => `<span class="phrase">${e(phrase)}${index < phrases.length - 1 ? '，' : ''}</span>`).join('')}</p>`).join('')}</div>
    <div class="date"><p class="date-main">${e(dateMain)}</p><p class="date-secondary"><span class="weekday">${e(wedding.date.weekday)}</span><span>${e(wedding.date.lunarFull)}</span></p></div>
    <div class="venue"><p class="venue-label">${e(copy.ui.venueHeading)}</p><h2>${e(item.venueName)}</h2><p class="address">${e(wedding.venue.address)}</p></div>
    <dl class="schedule">${wedding.schedule.map(event => `<div class="schedule-row" data-event="${e(event.id)}"><dt>${e(event.timeLabel)}</dt><dd><span>${e(event.title)}</span>${event.location ? `<span class="location">${e(event.location)}</span>` : ''}</dd></div>`).join('')}</dl>
    ${item.signature ? `<p class="signature">${e(item.signature)}</p>` : ''}
    <div class="codes">${codes.map(code => `<div class="code"><div class="qr-slot"><img src="data:image/png;base64,${code.buffer.toString('base64')}" width="${code.pixels / scale}" height="${code.pixels / scale}" alt="${e(code.label)}二维码"></div><p>${e(code.label)}</p></div>`).join('')}</div>
  </div>
</article></body></html>`
}
