import type { WeddingConfig } from '../types'

export const timeZone = 'Asia/Shanghai'

/** 严格验证日历日期，拒绝 2 月 30 日等被 Date 自动归一化的输入。 */
export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00+08:00`)
  return !Number.isNaN(date.getTime()) && new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date) === value
}

export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function dateLabel(value: string): string {
  if (!isDate(value)) return '婚期敬待公布'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone, year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  }).format(new Date(`${value}T12:00:00+08:00`))
}

export function coupleLabel(config: WeddingConfig): string {
  return `${config.groomName || '新郎姓名'} & ${config.brideName || '新娘姓名'}`
}

export function calendarIssues(config: WeddingConfig): string[] {
  const issues: string[] = []
  if (!config.groomName.trim() || !config.brideName.trim()) issues.push('新人姓名')
  if (!isDate(config.weddingDate)) issues.push('婚礼日期')
  if (!isTime(config.ceremonyTime)) issues.push('仪式时间')
  if (config.endTime && !isTime(config.endTime)) issues.push('结束时间')
  if (config.banquetTime && !isTime(config.banquetTime)) issues.push('宴席时间')
  if (config.endDate && !isDate(config.endDate)) issues.push('结束日期')
  if (config.endDate && !config.endTime) issues.push('结束日期对应的结束时间')
  if (!config.venueName.trim() || !config.venueAddress.trim()) issues.push('酒店详细地址')
  if (!config.calendarUid.trim()) issues.push('日历事件标识')
  if (issues.length === 0) {
    const { start, end } = eventTimes(config)
    if (end && end <= start) issues.push('晚于开始的结束时间')
  }
  return issues
}

/** 按中国标准时间解释配置，不依赖宾客设备所在时区。调用前须验证配置。 */
export function eventTimes(config: WeddingConfig): { start: Date; end: Date | null } {
  return {
    start: new Date(`${config.weddingDate}T${config.ceremonyTime}:00+08:00`),
    end: config.endTime ? new Date(`${config.endDate || config.weddingDate}T${config.endTime}:00+08:00`) : null,
  }
}

export function eventText(config: WeddingConfig): string {
  return [
    `${coupleLabel(config)}的婚礼`, dateLabel(config.weddingDate),
    scheduleText(config),
    config.venueName, config.venueAddress, config.invitationText,
  ].filter(Boolean).join('\n')
}

/** 同步复制信息与各日历入口的时间、楼栋，避免宾客把午宴地点当作仪式地点。 */
export function scheduleText(config: WeddingConfig): string {
  return [
    [isTime(config.ceremonyTime) ? `仪式 ${config.ceremonyTime}（中国标准时间）` : '仪式时间待确认', config.ceremonyVenue].filter(Boolean).join(' · '),
    isTime(config.banquetTime) ? [config.copy.banquetLabel + ' ' + config.banquetTime, config.banquetVenue].filter(Boolean).join(' · ') : '',
  ].filter(Boolean).join('\n')
}

export function isHttpsUrl(value: string): boolean {
  // URL 构造对用户配置可能抛错；只在这个输入边界捕获格式错误。
  try { return new URL(value).protocol === 'https:' } catch { return false }
}
