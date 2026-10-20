/** 必须在用户点击时调用；返回真实复制结果，拒绝或不支持时不虚报成功。 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  // HTTP 局域网预览没有异步剪贴板接口，在点击调用栈内通过选区复制。
  const field = document.createElement('textarea')
  field.value = text
  field.readOnly = true
  field.style.cssText = 'position:fixed;top:0;left:-9999px;font-size:16px;'
  const focused = document.activeElement
  const selection = document.getSelection()
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : []
  document.body.append(field)
  try {
    field.focus({ preventScroll: true })
    field.select()
    field.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true })
    if (selection) {
      selection.removeAllRanges()
      for (const range of ranges) selection.addRange(range)
    }
  }
}
