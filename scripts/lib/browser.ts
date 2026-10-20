import type { Page } from 'playwright'

/** 读取含直接文本节点的元素所使用的字体；调用方应传入叶子选择器，不能只读外层容器或 CSS font-family。 */
export async function renderedFonts(page: Page, selector: string) {
  const session = await page.context().newCDPSession(page)
  await session.send('DOM.enable')
  await session.send('CSS.enable')
  const { root } = await session.send('DOM.getDocument')
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector })
  const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId })
  await session.detach()
  return fonts
}
