import { chromium } from 'playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/'
await mkdir('artifacts/screenshots', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const reports = []
const errors: string[] = []
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932], [768, 1024], [1440, 1000], [844, 390]]) {
    await page.setViewportSize({ width: width!, height: height! })
    await page.goto(url)
    await page.evaluate(() => document.fonts.ready)
    // 逐段滚动触发浏览器的原生图片懒加载，再回到首屏截图。
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto'
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y)
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }
      await Promise.all(Array.from(document.images, (image) => image.decode()))
      window.scrollTo(0, 0)
    })
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
      images: Array.from(document.images, (image) => ({
        alt: image.alt, src: image.currentSrc,
        loaded: image.complete && image.naturalWidth > 0,
        ratioDifference: Math.abs(image.getBoundingClientRect().width / image.getBoundingClientRect().height - image.naturalWidth / image.naturalHeight),
        fit: getComputedStyle(image).objectFit,
      })),
    }))
    assert.ok(layout.scrollWidth <= layout.viewport, `${width}px 横向溢出`)
    assert.equal(layout.images.length, 8)
    assert.ok(layout.images.every((image) => image.loaded && image.ratioDifference < 0.01 && image.fit === 'contain'))
    const cover = await page.evaluate(() => {
      const photo = document.querySelector('.cover-image')!.getBoundingClientRect()
      const title = document.querySelector('.cover-title')!.getBoundingClientRect()
      return { titleBottom: title.bottom, safeBottom: photo.top + photo.height * 0.29, viewportHeight: innerHeight }
    })
    assert.ok(cover.titleBottom < cover.safeBottom, `${width}px 封面文字超出原片上方留白`)
    assert.ok(cover.titleBottom < cover.viewportHeight, `${width}px 首屏姓名与婚期不可见`)
    await page.screenshot({ path: `artifacts/screenshots/${width}x${height}-full.png`, fullPage: true })
    if (width === 390 || width === 320) await page.screenshot({ path: `artifacts/screenshots/${width}-cover.png` })
    if (width === 390 || width === 320) await page.locator('.venue-map').screenshot({ path: `artifacts/screenshots/${width}-venue-map.png` })
    reports.push({ width, height, ...layout })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(url)
  assert.equal(await page.locator('.cover-groom').innerText(), '戚培俊')
  assert.equal(await page.locator('.cover-bride').innerText(), '涂丽纯')
  assert.equal(await page.locator('.cover-text-title').innerText(), '我们结婚啦')
  assert.equal(await page.locator('.cover-date time').innerText(), '2026年12月24日星期四')
  assert.match(await page.locator('.cover-footer').innerText(), /赣州新饭店\s+11:00 仪式\s+新饭店附楼\s+12:00 午宴\s+新饭店主楼/)
  assert.equal(await page.locator('.cover-footer').getByRole('button', { name: '设置提醒' }).count(), 0)
  const dialogTitles = await page.locator('dialog').evaluateAll((dialogs) => dialogs.map((dialog) => dialog.getAttribute('aria-labelledby')))
  assert.equal(new Set(dialogTitles).size, dialogTitles.length, '多处导航弹层须使用独立标题 ID')
  assert.match(await page.locator('.event-times').innerText(), /婚礼仪式\s+11:00\s+新饭店附楼\s+午宴开席\s+12:00\s+新饭店主楼/)
  await page.locator('#details').screenshot({ path: 'artifacts/screenshots/wedding-details.png' })
  assert.equal(await page.locator('.venue-address').innerText(), '江西省赣州市赣县区梅林镇杨仙大道21号')
  const calendarButton = page.getByRole('button', { name: '设置提醒' })
  await calendarButton.click()
  await page.getByRole('dialog').waitFor({ state: 'visible' })
  assert.doesNotMatch(await page.getByRole('dialog').innerText(), /尚待确认|暂时无法生成/)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('link', { name: '下载日历', exact: true }).click()
  const download = await downloaded
  const calendarContent = await readFile((await download.path())!, 'utf8')
  assert.match(calendarContent, /DTSTART:20261224T030000Z/)
  assert.doesNotMatch(calendarContent, /DTEND:/)
  assert.match(calendarContent, /TRIGGER:-P1D/)
  assert.match(calendarContent, /TRIGGER:-PT2H/)
  assert.match(await page.getByRole('status').innerText(), /不会自动设置提醒/)
  await page.screenshot({ path: 'artifacts/screenshots/calendar-reminder.png' })
  await page.keyboard.press('Escape')
  assert.equal(await calendarButton.evaluate((button) => document.activeElement === button), true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto')
  // 截获出站请求验证按钮直达新人提供的短链；不作为高德实机或现场路线验收。
  await page.route('https://surl.amap.com/2siOh8Ng46li', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>测试已截获高德分享链接请求</p>' }))
  const mapUrl = new URL('https://surl.amap.com/2siOh8Ng46li')
  for (const section of ['.cover-footer', '#details']) {
    await page.goto(url)
    const mapRequest = page.waitForRequest((request) => request.url() === mapUrl.href)
    await page.locator(section).getByRole('button', { name: '导航前往' }).click()
    assert.equal((await mapRequest).url(), mapUrl.href)
  }

  // 微信 UA 只验证提示分支，不冒充真机微信兼容性验证。
  const wechat = await browser.newContext({ viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 MicroMessenger/8.0.50' })
  // 使用原始脚本，避免 tsx 给函数附加的 __name 辅助方法进入浏览器隔离上下文。
  await wechat.addInitScript("Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText() { return Promise.reject(new Error('模拟权限拒绝')) } } })")
  const wxPage = await wechat.newPage()
  wxPage.on('pageerror', (error) => errors.push(error.message))
  await wxPage.goto(url)
  await wxPage.getByRole('button', { name: '设置提醒' }).click()
  assert.match(await wxPage.getByRole('dialog').innerText(), /Safari/)
  assert.equal(await wxPage.getByRole('link', { name: '下载日历', exact: true }).count(), 0)
  await wxPage.getByRole('button', { name: '复制婚礼信息' }).click()
  await wxPage.getByRole('textbox').waitFor({ state: 'visible' })
  assert.match(await wxPage.getByRole('status').innerText(), /请长按下方文字复制/)
  assert.match(await wxPage.getByRole('textbox').inputValue(), /赣州新饭店/)
  assert.match(await wxPage.getByRole('textbox').inputValue(), /仪式 11:00（中国标准时间） · 新饭店附楼\n午宴 12:00 · 新饭店主楼/)
  await wxPage.screenshot({ path: 'artifacts/screenshots/wechat-copy-fallback.png' })
  await wxPage.getByRole('button', { name: '关闭', exact: true }).click()
  const coverNavigation = wxPage.locator('.cover-footer').getByRole('button', { name: '导航前往' })
  await coverNavigation.click()
  assert.match(await wxPage.getByRole('dialog').innerText(), /微信内置定位尚未开通/)
  await wxPage.getByRole('button', { name: '关闭', exact: true }).click()
  assert.equal(await coverNavigation.evaluate((button) => document.activeElement === button), true)
  await wxPage.locator('#details').getByRole('button', { name: '导航前往' }).click()
  assert.match(await wxPage.getByRole('dialog').innerText(), /微信内置定位尚未开通/)
  assert.equal(await wxPage.getByRole('dialog').getByRole('link').count(), 0)
  await wxPage.getByRole('button', { name: '复制婚礼地址' }).click()
  assert.equal(await wxPage.getByRole('textbox').inputValue(), '赣州新饭店\n江西省赣州市赣县区梅林镇杨仙大道21号')
  await wxPage.screenshot({ path: 'artifacts/screenshots/wechat-navigation-pending.png' })
  await wechat.close()
  // 用本地构建响应模拟 HTTPS 子目录，只验证平台分支和 URL，不冒充真机导入/订阅成功。
  const platformReports = []
  for (const [name, userAgent] of [
    ['ios', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'],
    ['android', 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'],
    ['wechat-android', 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 MicroMessenger/8.0.50'],
  ]) {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 }, userAgent })
    await context.route('https://wedding.test/invitation/**', async (route) => {
      const localPath = new URL(route.request().url()).pathname.replace('/invitation/', '')
      await route.fulfill({ response: await context.request.get(new URL(localPath, url).href) })
    })
    const mobile = await context.newPage()
    mobile.on('pageerror', (error) => errors.push(error.message))
    await mobile.goto('https://wedding.test/invitation/')
    await mobile.getByRole('button', { name: '设置提醒' }).click()
    if (name === 'ios') {
      assert.equal(await mobile.getByRole('link', { name: '订阅日历' }).getAttribute('href'), 'webcal://wedding.test/invitation/wedding.ics')
      assert.equal(await mobile.locator('details').first().getAttribute('open'), '')
    } else if (name === 'android') {
      assert.equal(await mobile.getByRole('link', { name: '订阅日历' }).count(), 0)
      assert.equal(await mobile.locator('details').last().getAttribute('open'), '')
    } else {
      assert.match(await mobile.getByRole('dialog').innerText(), /浏览器中打开/)
    }
    if (name !== 'wechat-android') {
      assert.equal(await mobile.getByRole('link', { name: '下载日历', exact: true }).getAttribute('href'), 'https://wedding.test/invitation/wedding.ics')
    }
    await mobile.screenshot({ path: `artifacts/screenshots/${name}-reminder.png` })
    platformReports.push({ name, scope: '模拟 UA 与 HTTPS 子目录，仅验证网页流程' })
    await context.close()
  }
  assert.deepEqual(errors, [])
  await writeFile('artifacts/browser-report.json', JSON.stringify({ checkedAt: new Date().toISOString(), url, reports,
    errors, platformReports, mapRequest: mapUrl.href, interactions: ['实际下载日历文件与提醒内容', '高德确认地点分享链接（截获验证）', 'Escape 关闭及焦点返回', '减少动态效果', '微信浏览器引导（模拟 UA）', '复制被拒绝后的完整日程手动复制', '微信原生定位未就绪提示及完整地址复制'] }, null, 2))
  console.log(`浏览器检查通过：${reports.length} 个尺寸、8 张照片原比例加载、7 项交互检查、婚礼信息展示正确、无控制台或网络错误。`)
} finally { await browser.close() }
