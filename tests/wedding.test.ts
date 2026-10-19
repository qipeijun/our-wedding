import { test } from 'node:test'
import assert from 'node:assert/strict'
import { wedding } from '../src/config/wedding'
import { createCalendar, foldLine, googleCalendarUrl } from '../src/lib/calendar'
import { calendarIssues, dateLabel, eventText, isDate, isTime } from '../src/lib/wedding'
import { amapUrl, locationIssues } from '../src/lib/maps'
import type { WeddingConfig } from '../src/types'

// 测试覆盖正式配置的姓名、日期、场地和坐标，不将测试内容当作婚礼事实。
const fixture = (): WeddingConfig => ({ ...wedding,
  groomName: '测试甲', brideName: '测试乙', weddingDate: '2030-01-02',
  ceremonyTime: '00:30', banquetTime: '', endTime: '02:00', venueName: '测试地点', venueAddress: '测试地址，不代表婚礼场地',
  ceremonyVenue: '测试附楼', banquetVenue: '测试主楼',
  mapShareUrl: '', mapShareUrlVerifiedOn: '',
  location: { latitude: 30, longitude: 110, coordinateSystem: 'gcj02', confirmed: true },
})

test('拒绝无效日期、宽松时间和自动归一化日期', () => {
  for (const value of ['', '2030-02-30', '2030-2-01', '2030-13-01']) assert.equal(isDate(value), false)
  assert.equal(isDate('2028-02-29'), true)
  assert.equal(isDate('2029-02-29'), false)
  for (const value of ['24:00', '12:60', '8:30', '']) assert.equal(isTime(value), false)
  assert.equal(isTime('08:30'), true)
})
test('缺少时间不能生成正式日历，缺少地址不能生成地图', () => {
  const config = { ...fixture(), ceremonyTime: '', endTime: '', venueAddress: '',
    location: { ...fixture().location, latitude: null, longitude: null, confirmed: false } }
  assert.ok(calendarIssues(config).length > 0)
  assert.throws(() => createCalendar(config), /信息不完整/)
  assert.equal(googleCalendarUrl(config), '')
  assert.equal(amapUrl(config), '')
})
test('中国凌晨转换到前一天 UTC，含两次真实提醒', () => {
  const ics = createCalendar(fixture(), new Date('2029-12-01T00:00:00Z'))
  assert.match(ics, /DTSTART:20300101T163000Z\r\n/)
  assert.match(ics, /DTEND:20300101T180000Z\r\n/)
  assert.match(ics, /DTSTAMP:20291201T000000Z/)
  assert.match(ics, /X-WR-TIMEZONE:Asia\/Shanghai/)
  assert.match(ics, /TRIGGER:-P1D/)
  assert.match(ics, /TRIGGER:-PT2H/)
  assert.equal(ics.split('BEGIN:VALARM').length - 1, 2)
})
test('结束时间不得早于开始，跨日必须明确日期', () => {
  const config = { ...fixture(), ceremonyTime: '23:30', endTime: '01:00' }
  assert.ok(calendarIssues(config).includes('晚于开始的结束时间'))
  config.endDate = '2030-01-03'
  assert.deepEqual(calendarIssues(config), [])
  assert.match(createCalendar(config), /DTEND:20300102T170000Z/)
})
test('结束时间未定仍可生成赴约提醒，不猜测时长或生成无效在线日历', () => {
  const config = { ...fixture(), ceremonyTime: '11:00', endTime: '' }
  assert.deepEqual(calendarIssues(config), [])
  const ics = createCalendar(config).replaceAll('\r\n ', '')
  assert.match(ics, /DTSTART:20300102T030000Z/)
  assert.match(ics, /婚礼赴约提醒/)
  assert.doesNotMatch(ics, /DTEND:|DURATION:/)
  assert.match(ics, /TRIGGER:-P1D/)
  assert.match(ics, /TRIGGER:-PT2H/)
  assert.equal(googleCalendarUrl(config), '')
  assert.ok(calendarIssues({ ...config, endDate: '2030-01-03' }).includes('结束日期对应的结束时间'))
  assert.ok(calendarIssues({ ...config, endTime: '25:00' }).includes('结束时间'))
})
test('可选宴席时间也必须有效', () => {
  assert.ok(calendarIssues({ ...fixture(), banquetTime: '25:00' }).includes('宴席时间'))
})
test('复制信息和两种日历均保留仪式、宴席各自的时间与楼栋', () => {
  const config = { ...fixture(), ceremonyTime: '11:00', banquetTime: '12:00', endTime: '14:00' }
  for (const text of [eventText(config), createCalendar(config).replaceAll('\r\n ', ''), new URL(googleCalendarUrl(config)).searchParams.get('details')!]) {
    assert.match(text, /仪式 11:00（中国标准时间） · 测试附楼/)
    assert.match(text, /午宴 12:00 · 测试主楼/)
  }
})
test('中文和 emoji 折行每物理行最多 75 UTF-8 字节且不损坏字符', () => {
  const input = 'DESCRIPTION:' + '愿你幸福🙂'.repeat(30)
  const output = foldLine(input)
  assert.equal(output.replaceAll('\r\n ', ''), input)
  for (const line of output.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75)
})
test('日历文本转义特殊字符，换行不能注入属性', () => {
  const config = { ...fixture(), invitationText: '你好,朋友;\\\nATTENDEE:example' }
  const ics = createCalendar(config).replaceAll('\r\n ', '')
  assert.ok(ics.includes('DESCRIPTION:你好\\,朋友\\;\\\\\\nATTENDEE:example'))
  assert.ok(!ics.includes('\r\nATTENDEE:'))
})
test('修改活动时间保留事件 UID，在线日历也使用正确 UTC', () => {
  const config = fixture()
  const first = createCalendar(config)
  config.weddingDate = '2030-01-03'
  const second = createCalendar(config)
  assert.equal(first.match(/UID:(.*)/)?.[1], second.match(/UID:(.*)/)?.[1])
  const url = new URL(googleCalendarUrl(config))
  assert.equal(url.searchParams.get('dates'), '20300102T163000Z/20300102T180000Z')
  assert.equal(url.searchParams.get('ctz'), 'Asia/Shanghai')
})
test('普通浏览器使用高德，遵循经度在前及 GCJ-02 契约', () => {
  const url = new URL(amapUrl(fixture()))
  assert.equal(url.origin, 'https://uri.amap.com')
  assert.equal(url.searchParams.get('position'), '110,30')
  assert.equal(url.searchParams.get('coordinate'), 'gaode')
  assert.equal(url.searchParams.get('callnative'), '0')
})
test('已确认分享链接优先于地址搜索，不依赖另填坐标', () => {
  const config = { ...fixture(), mapShareUrl: 'https://surl.amap.com/2siOh8Ng46li',
    location: { ...fixture().location, latitude: null, longitude: null, confirmed: false } }
  assert.equal(amapUrl(config), config.mapShareUrl)
  assert.equal(new URL(amapUrl({ ...config, mapShareUrl: 'javascript:alert(1)' })).pathname, '/search')
})
test('缺失或无效坐标只允许完整地址搜索，不生成精确标注', () => {
  for (const location of [
    { ...fixture().location, latitude: null }, { ...fixture().location, longitude: NaN },
    { ...fixture().location, latitude: 91 }, { ...fixture().location, confirmed: false },
  ]) {
    assert.ok(locationIssues({ ...fixture(), location }).length)
    const url = new URL(amapUrl({ ...fixture(), location }))
    assert.equal(url.origin, 'https://uri.amap.com')
    assert.equal(url.pathname, '/search')
    assert.equal(url.searchParams.get('keyword'), fixture().venueAddress)
    assert.equal(url.searchParams.has('position'), false)
    assert.equal(url.searchParams.get('callnative'), '0')
  }
})
test('日期显示在中国时区，未配置时保持待确认', () => {
  assert.equal(dateLabel(''), '婚期敬待公布')
  assert.match(dateLabel('2030-01-02'), /2030年1月2日/)
})
