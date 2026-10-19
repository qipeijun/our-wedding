import type { WeddingConfig } from '../types'
import { calendarIssues, coupleLabel, eventTimes, scheduleText, timeZone } from './wedding'

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
}

/** RFC 5545 按 UTF-8 字节折行，避免切断中文或 emoji 的多字节字符。 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  let result = ''
  let bytes = 0
  for (const character of line) {
    const length = encoder.encode(character).length
    if (bytes + length > 75) { result += '\r\n '; bytes = 1 }
    result += character
    bytes += length
  }
  return result
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** 生成可导入事件；生成或下载并不代表已写入系统日历。 */
export function createCalendar(config: WeddingConfig, now = new Date()): string {
  const issues = calendarIssues(config)
  if (issues.length) throw new Error(`日历信息不完整：${issues.join('、')}`)
  const { start, end } = eventTimes(config)
  const title = `${coupleLabel(config)}的婚礼${end ? '' : '赴约提醒'}`
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Our Wedding//Invitation//ZH-CN',
    'CALSCALE:GREGORIAN', `X-WR-TIMEZONE:${timeZone}`, 'BEGIN:VEVENT',
    `UID:${escapeText(config.calendarUid)}`, `DTSTAMP:${utcStamp(now)}`,
    // 转成 UTC 的瞬间与 Asia/Shanghai 完全等价，避免不完整 VTIMEZONE 导致客户端偏移。
    // RFC 5545 允许只提供开始时刻；此时表达赴约提醒，不虚构整场婚礼时长。
    `DTSTART:${utcStamp(start)}`, ...(end ? [`DTEND:${utcStamp(end)}`] : []),
    `SUMMARY:${escapeText(title)}`, `LOCATION:${escapeText(`${config.venueName} ${config.venueAddress}`)}`,
    `DESCRIPTION:${escapeText(config.invitationText + '\n' + scheduleText(config))}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText('明天赴约：' + title)}`, 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText('两小时后：' + title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].map(foldLine).join('\r\n') + '\r\n'
}

export function googleCalendarUrl(config: WeddingConfig): string {
  if (calendarIssues(config).length) return ''
  const { start, end } = eventTimes(config)
  // 活动编辑链接需要时间区间；未确定结束时间时保留 ICS 与手动设置入口。
  if (!end) return ''
  return `https://calendar.google.com/calendar/r/eventedit?${new URLSearchParams({
    action: 'TEMPLATE', text: `${coupleLabel(config)}的婚礼`,
    dates: `${utcStamp(start)}/${utcStamp(end)}`, ctz: timeZone,
    location: `${config.venueName} ${config.venueAddress}`, details: config.invitationText + '\n' + scheduleText(config),
  })}`
}
