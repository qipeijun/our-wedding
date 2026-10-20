import { chromium, type Page } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { wedding, copy } from './lib/content'
import { renderedFonts } from './lib/browser'

const url = process.env.PREVIEW_URL || `http://127.0.0.1:4173${wedding.deployment.currentPublicPath}`
const masterOnly = process.argv.includes('--master')
const directory = `artifacts/v3/${masterOnly ? 'master-check' : 'screenshots'}`
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors: string[] = []
const reports: unknown[] = []
async function ready(page: Page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    document.querySelectorAll<HTMLImageElement>('img').forEach(image => image.loading = 'eager')
    await document.fonts.ready
    await Promise.all([...document.images].map(image => image.decode()))
  })
}
async function captureSection(page: Page, selector: string, path: string) {
  const section = page.locator(selector)
  await section.scrollIntoViewIfNeeded()
  await page.evaluate(async () => { await Promise.all(document.getAnimations().map(animation => animation.finished)) })
  await section.screenshot({ path, animations: 'disabled' })
}
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  for (const [width, height] of [[320, 740], [360, 800], [390, 844], [430, 932], [1440, 1000]]) {
    await page.setViewportSize({ width: width!, height: height! })
    await page.goto(url)
    await ready(page)
    const layout = await page.evaluate(() => {
      const main = document.querySelector('main')!.getBoundingClientRect()
      const heading = document.querySelector('.hero-heading')!.getBoundingClientRect()
      const photo = document.querySelector('.hero-photo')!.getBoundingClientRect()
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, mainWidth: main.width, mainLeft: main.left, headingBottom: heading.bottom - photo.top, photoHeight: photo.height, images: [...document.querySelectorAll<HTMLImageElement>('.wedding-photo img')].map(image => ({ src: image.currentSrc, width: image.width, height: image.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })) }
    })
    assert.ok(layout.scrollWidth <= layout.width, `横向溢出：${width}`)
    assert.ok(layout.mainWidth <= 560)
    if (width === 1440) assert.equal(layout.mainLeft, 440)
    // 实际原图中最高头发约从照片30%处开始；对照原图后的边界而非通用模板。
    assert.ok(layout.headingBottom < layout.photoHeight * .295, `封面文字越过已复核安全区：${width}`)
    for (const image of layout.images) assert.ok(Math.abs(image.width / image.height - image.naturalWidth / image.naturalHeight) < .01)
    assert.equal(await page.locator('.wedding-photo').count(), masterOnly ? 1 : 6)
    assert.equal(await page.getByText('设置提醒', { exact: true }).count(), 0)
    assert.equal(await page.locator('a[href*=".ics"],a[href^="webcal:"],a[href*="calendar.google"]').count(), 0)
    const schedule = await page.locator('#schedule').innerText()
    for (const item of wedding.schedule) { assert.ok(schedule.includes(item.time)); if (item.location) assert.ok(schedule.includes(item.location)) }
    // 等待实际入场动画完成再截图，不把过渡中的透明度当作最终画面。
    await page.evaluate(async () => { await Promise.all(document.getAnimations().map(animation => animation.finished)) })
    await page.screenshot({ path: `${directory}/h5-${width}.png`, fullPage: true, animations: 'disabled' })
    await captureSection(page, '.cover', `${directory}/cover-${width}.png`)
    await captureSection(page, '#schedule', `${directory}/schedule-${width}.png`)
    if (!masterOnly) await captureSection(page, '#venue', `${directory}/venue-${width}.png`)
    reports.push(layout)
  }
  const actualFonts = { title: await renderedFonts(page, '.couple-names span'), body: await renderedFonts(page, '.invitation-copy p') }
  assert.ok(actualFonts.title.some(font => font.isCustomFont && /Wedding/.test(font.familyName)))
  if (!masterOnly) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(url)
    await ready(page)
    assert.equal(await page.locator('.sticky-navigation').isVisible(), false)
    await page.getByRole('link', { name: copy.ui.jumpToDetails }).click()
    await page.waitForFunction(() => document.querySelector('.sticky-navigation')?.getAttribute('aria-hidden') !== 'true')
    assert.equal(await page.locator('.sticky-navigation').isVisible(), true)
    await page.locator('[data-main-navigation]').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelector('.sticky-navigation')?.getAttribute('aria-hidden') === 'true')
    assert.equal(await page.locator('.sticky-navigation').isVisible(), false, '正文导航可见时收起重复固定栏')
    for (const href of await page.getByRole('link', { name: new RegExp(copy.ui.navigation) }).evaluateAll(links => links.map(link => link.getAttribute('href')))) assert.equal(href, wedding.venue.mapUrl)
    assert.equal(await page.getByRole('link', { name: copy.ui.contact, exact: true }).getAttribute('href'), wedding.contact.href)
    await page.locator('.venue-diagram').scrollIntoViewIfNeeded()
    assert.equal(await page.locator('.venue-diagram img').isVisible(), true, '地图在正文直接展开')
    assert.equal(await page.locator('.venue-diagram button').count(), 0, '查看地图不需要额外点击')
    await page.screenshot({ path: `${directory}/map-inline.png` })
    // 模拟异步剪贴板：验证 promise 完成前不能显示成功。
    await page.evaluate(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (text) => new Promise(resolve => { Object.assign(window, { copiedAddress: text, finishCopy: resolve }) }) } })`)
    await page.getByRole('button', { name: copy.ui.copyAddress, exact: true }).click()
    assert.equal(await page.getByText(copy.ui.copySuccess, { exact: true }).count(), 0)
    await page.evaluate(() => (window as unknown as { finishCopy: () => void }).finishCopy())
    await page.getByText(copy.ui.copySuccess, { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => (window as unknown as { copiedAddress: string }).copiedAddress), copy.copyAddressText)
    await page.evaluate(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError') } } })`)
    await page.getByRole('button', { name: copy.ui.copyAddress, exact: true }).click()
    await page.getByText(copy.ui.copyFallback, { exact: true }).waitFor()
    assert.equal(await page.locator('dialog[open] textarea').inputValue(), copy.copyAddressText)
    assert.equal(await page.getByText(copy.ui.copySuccess, { exact: true }).count(), 0)
    await page.screenshot({ path: `${directory}/copy-denied.png` })
    await page.locator('dialog[open]').getByRole('button', { name: /关闭/ }).click()
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === '复制地址')
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }))
    await page.getByRole('button', { name: copy.ui.copyAddress, exact: true }).click()
    await page.locator('dialog[open] textarea').waitFor()
    await page.keyboard.press('Escape')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto')
    await page.locator('.closing-copy').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelector('.sticky-navigation')?.getAttribute('aria-hidden') === 'false')
    const footer = await page.locator('.closing-copy').boundingBox()
    const bar = await page.locator('.sticky-navigation').boundingBox()
    assert.ok(footer && bar && footer.y + footer.height <= bar.y, '底栏遮挡结尾')
    await page.screenshot({ path: `${directory}/closing-and-navigation.png` })
    // 拦截外链只证明点击请求目标，不替代高德或真机路线验收。
    const routePage = await browser.newPage({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 iPhone MicroMessenger/8.0' })
    let clickedUrl = ''
    await routePage.route(wedding.venue.mapUrl, async route => { clickedUrl = route.request().url(); await route.fulfill({ contentType: 'text/html', body: '<p>导航目标测试</p>' }) })
    await routePage.goto(url)
    await routePage.locator('#schedule').getByRole('link', { name: copy.ui.navigation, exact: true }).click()
    await routePage.waitForURL(wedding.venue.mapUrl)
    assert.equal(clickedUrl, wedding.venue.mapUrl)
    await routePage.close()
    // 无 JS 或模块初始化失败时，构建写入的核心信息仍在原 HTML 中。
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
    const fallback = await nojs.newPage()
    await fallback.goto(url)
    assert.ok((await fallback.locator('body').innerText()).includes(wedding.contact.phone))
    await fallback.screenshot({ path: `${directory}/no-javascript.png`, fullPage: true })
    await nojs.close()
    // 仅阻断封面图片：日期和姓名仍可见，手动重试后恢复照片。
    const failure = await browser.newPage({ viewport: { width: 320, height: 740 } })
    await failure.route('**/photos/9.1032978-*', route => route.abort())
    await failure.goto(url)
    await failure.getByText(copy.ui.photoError).waitFor()
    assert.equal(await failure.locator('.couple-names').isVisible(), true)
    assert.equal(await failure.locator('.date-main').isVisible(), true)
    await failure.screenshot({ path: `${directory}/photo-failed.png`, fullPage: false })
    await failure.unroute('**/photos/9.1032978-*')
    await failure.getByRole('button', { name: copy.ui.retry }).click()
    await failure.locator('.hero-photo .wedding-photo img').waitFor()
    await failure.locator('.hero-photo .wedding-photo img').evaluate(image => (image as HTMLImageElement).decode())
    await failure.close()
    const titleFailure = await browser.newPage({ viewport: { width: 320, height: 740 } })
    await titleFailure.route('**/artwork/wedding-title.webp', route => route.abort())
    await titleFailure.goto(url)
    await titleFailure.locator('.hero-heading h1 span:not(.sr-only)').waitFor()
    assert.equal(await titleFailure.getByRole('heading', { level: 1 }).innerText(), copy.h5.title)
    await titleFailure.close()
    // 主动延迟标题响应：照片和姓名先可读，标题入场必须等素材就绪。
    const delayedTitle = await browser.newPage({ viewport: { width: 390, height: 844 } })
    let releaseTitle!: () => void
    const titleGate = new Promise<void>(resolve => { releaseTitle = resolve })
    await delayedTitle.route('**/artwork/wedding-title.webp', async route => { await titleGate; await route.continue() })
    await delayedTitle.goto(url, { waitUntil: 'domcontentloaded' })
    await delayedTitle.locator('.couple-names').waitFor()
    assert.equal(await delayedTitle.locator('.hero-heading').evaluate(element => getComputedStyle(element).animationName), 'none')
    releaseTitle()
    await delayedTitle.locator('.hero-heading.is-ready').waitFor()
    assert.equal(await delayedTitle.locator('.hero-heading').evaluate(element => getComputedStyle(element).animationName), 'title-arrive')
    await delayedTitle.close()
    // 高密度手机必须命中足够分辨率的照片，不能只在1倍截图中看起来清晰。
    const dense = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
    const densePage = await dense.newPage()
    await densePage.goto(url)
    await ready(densePage)
    const coverSource = await densePage.locator('.hero-photo .wedding-photo img').evaluate(image => (image as HTMLImageElement).currentSrc)
    assert.match(coverSource, /-1600\.webp$/, '430px三倍屏应读取1600px照片')
    await densePage.screenshot({ path: `${directory}/mobile-430-3x.png` })
    reports.push({ width: 430, deviceScaleFactor: 3, coverSource })
    await dense.close()
  }
  assert.deepEqual(errors, [])
  await writeFile(`${directory}/report.json`, JSON.stringify({ passed: true, renderer: browser.version(), actualFonts, masterOnly, reports, errors, wechat: '仅UA分支模拟，真机待测' }, null, 2) + '\n')
  console.log(`${masterOnly ? '视觉母版' : '完整H5'}多宽度与交互检查通过；真机微信待测。`)
} finally { await browser.close() }
