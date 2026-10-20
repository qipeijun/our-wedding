import { chromium, type Page } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { wedding, copy } from './lib/content'
import { renderedFonts } from './lib/browser'

const url = process.env.PREVIEW_URL || `http://127.0.0.1:4173${wedding.deployment.currentPublicPath}`
const masterOnly = process.argv.includes('--master')
const directory = `artifacts/v3/${masterOnly ? 'master-check' : 'polish-screenshots'}`
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
  const bounds = await section.boundingBox()
  assert.ok(bounds)
  const scrollY = await page.evaluate(() => window.scrollY)
  // 长区块截图移除悬浮控件，避免把某一滚动位置的底栏印在区块中间；视口截图另验真实遮挡。
  // 使用文档坐标，避免 scroll-padding 使高区块居中后，截图漏掉视口上方的标题。
  await page.screenshot({ path, fullPage: true, clip: { ...bounds, y: bounds.y + scrollY }, animations: 'disabled', style: selector === '.cover' ? '' : '.sticky-navigation,.background-music { visibility: hidden !important; }' })
}
/** 检查文字的实际行框，避免 overflow: clip 掩盖内容超出屏幕的问题。 */
async function checkReadingLayout(page: Page) {
  const overflow = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.querySelector('main')!, NodeFilter.SHOW_TEXT)
    const failures: string[] = []
    while (walker.nextNode()) {
      const node = walker.currentNode
      if (!node.textContent?.trim() || node.parentElement?.closest('.sr-only,[aria-hidden="true"]')) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      if ([...range.getClientRects()].some(rect => rect.left < -1 || rect.right > innerWidth + 1)) failures.push(node.textContent.trim())
    }
    return failures
  })
  assert.deepEqual(overflow, [], '正文行框不能超出视口')
}
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  for (const [width, height] of [[320, 740], [360, 800], [375, 812], [390, 844], [430, 932], [1440, 1000]]) {
    await page.setViewportSize({ width: width!, height: height! })
    await page.goto(url)
    await ready(page)
    await checkReadingLayout(page)
    assert.doesNotMatch(await page.locator('meta[name="viewport"]').getAttribute('content') ?? '', /user-scalable\s*=\s*no|maximum-scale|minimum-scale/)
    assert.equal(await page.locator('html').evaluate(element => getComputedStyle(element).touchAction), 'auto')
    for (const size of await page.locator('.date-main,.date-secondary,.schedule-location,.venue-address p,.contact-number,.sticky-details span').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)))) assert.ok(size >= 15.9, '关键信息至少16px')
    const layout = await page.evaluate(() => {
      const main = document.querySelector('main')!.getBoundingClientRect()
      const heading = document.querySelector('.hero-heading')!.getBoundingClientRect()
      const photo = document.querySelector('.hero-photo')!.getBoundingClientRect()
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, mainWidth: main.width, mainLeft: main.left, headingBottom: heading.bottom - photo.top, photoHeight: photo.height, images: [...document.querySelectorAll<HTMLImageElement>('.wedding-photo img')].map(image => ({ src: image.currentSrc, width: image.width, height: image.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })) }
    })
    assert.ok(layout.scrollWidth <= layout.width, `横向溢出：${width}`)
    assert.ok(layout.mainWidth <= 560)
    if (width! <= 560) assert.ok(await page.locator('.cover').evaluate(element => element.getBoundingClientRect().height >= innerHeight), `首屏露出下一段背景：${width}`)
    if (width === 1440) assert.equal(layout.mainLeft, 440)
    // 实际原图中最高头发约从照片30%处开始；对照原图后的边界而非通用模板。
    assert.ok(layout.headingBottom < layout.photoHeight * .295, `封面文字越过已复核安全区：${width}`)
    for (const image of layout.images) assert.ok(Math.abs(image.width / image.height - image.naturalWidth / image.naturalHeight) < .01)
    assert.equal(await page.locator('.wedding-photo').count(), masterOnly ? 1 : 6)
    assert.equal(await page.getByText('设置提醒', { exact: true }).count(), 0)
    assert.equal(await page.locator('a[href*=".ics"],a[href^="webcal:"],a[href*="calendar.google"]').count(), 0)
    const schedule = await page.locator('#schedule').innerText()
    for (const item of wedding.schedule) { assert.ok(schedule.includes(item.time)); if (item.location) assert.ok(schedule.includes(item.location)) }
    assert.doesNotMatch(schedule, /请先到|午宴移步/)
    assert.equal(await page.getByText('如何到酒店', { exact: true }).count(), 0)
    assert.equal(await page.locator('.venue-diagram figcaption').count(), 0)
    // 等待实际入场动画完成再截图，不把过渡中的透明度当作最终画面。
    await page.evaluate(async () => { await Promise.all(document.getAnimations().map(animation => animation.finished)) })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.screenshot({ path: `${directory}/h5-${width}.png`, fullPage: true, animations: 'disabled' })
    await captureSection(page, '.cover', `${directory}/cover-${width}.png`)
    await captureSection(page, '#schedule', `${directory}/schedule-${width}.png`)
    if (!masterOnly) await captureSection(page, '#venue', `${directory}/venue-${width}.png`)
    if (!masterOnly) {
      await captureSection(page, '.response-section', `${directory}/photos-${width}.png`)
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await page.locator('.sticky-navigation').waitFor({ state: 'visible' })
      const footer = await page.locator('.closing-copy').boundingBox()
      const bar = await page.locator('.sticky-navigation').boundingBox()
      assert.ok(footer && bar && footer.y + footer.height <= bar.y, `底栏遮挡结尾：${width}`)
      await page.screenshot({ path: `${directory}/bottom-${width}.png` })
      await page.locator('.sticky-details').click()
      await page.waitForFunction(() => Math.abs(document.querySelector('#schedule')!.getBoundingClientRect().top - 72) <= 1)
      await page.screenshot({ path: `${directory}/schedule-viewport-${width}.png` })
    }
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
    const musicBox = await page.locator('.music-toggle').boundingBox()
    const scheduleBox = await page.locator('#schedule-title').boundingBox()
    assert.ok(musicBox && scheduleBox && scheduleBox.y >= musicBox.y + musicBox.height, '日程跳转后应避开音乐按钮')
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
    await page.getByText(copy.ui.copySuccess, { exact: true }).waitFor({ state: 'hidden', timeout: 4000 })
    await page.evaluate(`Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError') } } })`)
    await page.getByRole('button', { name: copy.ui.copyAddress, exact: true }).click()
    await page.getByText(copy.ui.copyFallback, { exact: true }).waitFor()
    assert.equal(await page.locator('.copy-manual p').innerText(), copy.copyAddressText)
    assert.equal(await page.locator('dialog').count(), 0)
    assert.equal(await page.getByText(copy.ui.copySuccess, { exact: true }).count(), 0)
    await page.screenshot({ path: `${directory}/copy-denied.png` })
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }))
    // HTTP 下走原生选区复制，成功后应直接反馈而非弹框。
    await page.getByRole('button', { name: copy.ui.copyAddress, exact: true }).click()
    await page.getByText(copy.ui.copySuccess, { exact: true }).waitFor()
    assert.equal(await page.locator('.copy-manual,dialog,textarea').count(), 0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto')
    await page.locator('.closing-copy').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelector('.sticky-navigation')?.getAttribute('aria-hidden') === 'false')
    const footer = await page.locator('.closing-copy').boundingBox()
    const bar = await page.locator('.sticky-navigation').boundingBox()
    assert.ok(footer && bar && footer.y + footer.height <= bar.y, '底栏遮挡结尾')
    await page.screenshot({ path: `${directory}/closing-and-navigation.png` })
    await page.getByRole('link', { name: copy.ui.backToTop }).click()
    await page.waitForFunction(() => scrollY === 0)
    await page.locator('.sticky-navigation').waitFor({ state: 'hidden' })
    assert.equal(await page.locator('.sticky-navigation').isVisible(), false)

    // 将根字号加倍，模拟仅放大文字；不以整页缩放代替文字重排验收。
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await page.evaluate(() => { document.documentElement.style.fontSize = '34px' })
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await page.waitForFunction(() => {
        const height = document.querySelector('.sticky-navigation')!.getBoundingClientRect().height
        return Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navigation-height')) - height) <= 1
      })
      // 尺寸观察器更新留白后再滚到新的页面末尾，不能沿用放大前的文档高度。
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await checkReadingLayout(page)
      const zoomFooter = await page.locator('.closing-copy').boundingBox()
      const zoomBar = await page.locator('.sticky-navigation').boundingBox()
      assert.ok(zoomFooter && zoomBar && zoomFooter.y + zoomFooter.height <= zoomBar.y, `文字200%底栏遮挡结尾：${width} ${JSON.stringify({ zoomFooter, zoomBar })}`)
      await page.screenshot({ path: `${directory}/text-200-bottom-${width}.png` })
      await captureSection(page, '#schedule', `${directory}/text-200-schedule-${width}.png`)
    }
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'))

    // 浏览器媒体事件与真实音频资源验证；不代表微信或手机系统的自动播放策略。
    const musicPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await musicPage.goto(url)
    await ready(musicPage)
    const music = musicPage.locator('.music-toggle')
    if (await music.getAttribute('data-state') === 'playing') await music.click()
    await music.click()
    await musicPage.waitForFunction(() => document.querySelector('.music-toggle')?.getAttribute('data-state') === 'playing')
    assert.equal(await musicPage.locator('audio').evaluate(audio => (audio as HTMLAudioElement).paused), false)
    await music.click()
    assert.equal(await musicPage.locator('audio').evaluate(audio => (audio as HTMLAudioElement).paused), true)
    await music.click()
    await musicPage.waitForFunction(() => document.querySelector('.music-toggle')?.getAttribute('data-state') === 'playing')
    // 阻止真正离站，仍让应用的捕获阶段处理导航暂停。
    await musicPage.locator('[data-main-navigation]').evaluate(link => link.addEventListener('click', event => event.preventDefault(), { once: true }))
    await musicPage.locator('[data-main-navigation]').click()
    assert.equal(await musicPage.locator('audio').evaluate(audio => (audio as HTMLAudioElement).paused), true)
    await musicPage.close()
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
