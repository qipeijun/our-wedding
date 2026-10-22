import wedding from '../../config/wedding.json'
import copy from '../../config/copy.json'

export { wedding, copy }
/** 四个邀请主体：朋友、长辈、男方父母、女方父母。 */
export type Variant = keyof typeof copy.variants
export const variants = Object.keys(copy.variants) as Variant[]

/** HTML 导出及无脚本信息使用相同转义边界，配置文字不作为标记执行。 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}
export const dateMain = wedding.date.full.replace(`（${wedding.date.weekday}）`, '')
/** 首个 HTML 帧与运行时共用信封素材；基础信息在脚本未就绪时仍可阅读。 */
export function openingShellHtml(envelope: string): string {
  return `<div class="opening-overlay boot-stage" role="status" aria-label="正在准备婚礼请柬"><p class="edition">致亲爱的家人和朋友</p><div class="envelope-art">${envelope}</div><div><p class="opening-names"><span>${escapeHtml(wedding.couple.groom)}</span><i aria-hidden="true">＆</i><span>${escapeHtml(wedding.couple.bride)}</span></p><p class="opening-date">${escapeHtml(wedding.date.iso.replaceAll('-', ' . '))}</p><p class="waiting-label">请柬准备中</p></div></div>${essentialHtml()}`
}
export function essentialHtml(): string {
  return `<section class="essential-info" aria-label="婚礼信息"><h1>${escapeHtml(wedding.couple.displayName)}</h1><p>${escapeHtml(wedding.date.full)}</p><p>${escapeHtml(wedding.date.lunarFull)}</p>${wedding.schedule.map(item => `<p>${escapeHtml(item.timeLabel)} ${escapeHtml(item.title)} ${escapeHtml(item.location ?? '')}</p>`).join('')}<h2>${escapeHtml(wedding.venue.name)}</h2><p>${escapeHtml(wedding.venue.address)}</p><p><a href="${escapeHtml(wedding.venue.mapUrl)}">${escapeHtml(copy.ui.navigation)}</a></p><p><a href="${escapeHtml(wedding.contact.href)}">${escapeHtml(copy.ui.contact)}</a></p></section>`
}
