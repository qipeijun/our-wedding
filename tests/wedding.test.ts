import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { wedding, copy, essentialHtml } from '../scripts/lib/content'
import { selectedPhotos } from '../src/config/photos'

test('正式事实与交接规范一致，日期不受设备时区影响', () => {
  assert.deepEqual(wedding.couple, { groom: '戚培俊', bride: '涂丽纯', displayName: '戚培俊 · 涂丽纯' })
  assert.equal(wedding.date.iso, '2026-12-24')
  assert.equal(new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: wedding.date.timeZone }).format(new Date(`${wedding.date.iso}T12:00:00+08:00`)), wedding.date.weekday)
  assert.equal(wedding.date.lunarFull, '农历丙午年十一月十六')
  assert.deepEqual(wedding.schedule.map(item => [item.time, item.location]), [['10:30', null], ['11:00', '附楼四合院'], ['12:00', '主楼A栋三楼5号厅']])
  assert.equal(wedding.venue.name, '新饭店')
  assert.equal(wedding.venue.address, '江西省赣州市赣县区杨仙大道北侧')
  assert.equal(wedding.contact.phone, '18126072587')
  assert.equal(wedding.contact.href, `tel:${wedding.contact.phone}`)
})

test('四种邀请主体和父母落款各自正确，女方版女儿在先', () => {
  for (const id of ['friends', 'elders'] as const) {
    assert.equal(copy.variants[id].signature, null)
    assert.deepEqual(copy.variants[id].names.map(item => item.name), [wedding.couple.groom, wedding.couple.bride])
  }
  assert.deepEqual(copy.variants['groom-parents'].names, [{ name: '戚培俊', relation: '儿子' }, { name: '涂丽纯', relation: '儿媳' }])
  assert.deepEqual(copy.variants['bride-parents'].names, [{ name: '涂丽纯', relation: '女儿' }, { name: '戚培俊', relation: '女婿' }])
  assert.equal(copy.variants['groom-parents'].signature, '戚本亮 · 尹李英 敬邀')
  assert.equal(copy.variants['bride-parents'].signature, '涂如古 · 沈慧琪 敬邀')
  assert.equal(copy.variants['groom-parents'].signature, wedding.parents.groom.signature)
  assert.equal(copy.variants['bride-parents'].signature, wedding.parents.bride.signature)
})

test('导航与二维码逐字沿用正式网址', () => {
  assert.equal(wedding.publicUrl, 'https://qipeijun.github.io/our-wedding/')
  assert.equal(wedding.venue.mapUrl, 'https://surl.amap.com/2siOh8Ng46li')
  assert.deepEqual(wedding.qr.map(item => [item.id, item.url]), [['wedding', wedding.publicUrl], ['navigation', wedding.venue.mapUrl]])
  assert.equal(new URL(wedding.publicUrl).pathname, wedding.deployment.currentPublicPath)
  assert.equal(copy.copyAddressText, `${wedding.venue.name} ${wedding.venue.address}`)
})

test('H5使用新邀请短稿，请帖文案保持独立，无旧示例或虚构信息', () => {
  assert.deepEqual(copy.h5.invitationParagraphs, ['诚邀您参加我们的婚礼，见证我们成为一家人。'])
  assert.deepEqual(copy.variants.friends.bodyParagraphs, ['我们人生中很重要的一天，想邀请你一起度过。', '来喝杯喜酒，和我们拍张合照。'])
  assert.deepEqual(copy.variants.elders.bodyParagraphs, ['我们即将携手成家，诚挚邀请您到场见证。', '有您的祝福，这一天会更加温暖。'])
  for (const id of ['groom-parents', 'bride-parents'] as const) assert.deepEqual(copy.variants[id].bodyParagraphs, ['孩子们即将携手成家，我们满怀欢喜。', '诚邀您来喝杯喜酒，与我们一同分享这份喜悦。'])
  assert.equal(copy.h5.names, wedding.couple.displayName)
  assert.equal(copy.h5.closingNames, wedding.couple.displayName)
  assert.doesNotMatch(JSON.stringify(copy), /张先生|李女士|2025年|梅林大街|拨冗|恋爱[0-9]/)
})

test('不运行日历流程，静态基础信息不含结束时间', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'))
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /prepare-calendar|\.ics/)
  assert.equal(wedding.features.calendar, false)
  const html = essentialHtml()
  assert.ok(html.includes(wedding.contact.phone))
  assert.ok(html.includes('主楼A栋三楼5号厅'))
  assert.doesNotMatch(html, /14:00|\.ics|webcal:/)
  assert.equal((await readdir('public')).some(file => file.endsWith('.ics')), false)
})

test('首版六张网页照片与三张正式请帖主图保持规定角色', () => {
  assert.equal(selectedPhotos.filter(item => !item.id.startsWith('formal-')).length, 6)
  for (const id of ['elders', 'groom-parents', 'bride-parents'] as const) assert.equal(copy.variants[id].mainPhoto, '9.1032428.jpg')
})
