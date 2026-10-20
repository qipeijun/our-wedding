import test from 'node:test'
import assert from 'node:assert/strict'
import { copyText } from '../src/lib/clipboard'

test('异步复制完成前不报告成功，拒绝时返回失败', async context => {
  let finish!: () => void
  const calls: string[] = []
  // Node 无浏览器剪贴板，通过可恢复的全局属性提供确定的权限结果。
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: (text: string) => { calls.push(text); return new Promise<void>(resolve => { finish = resolve }) } } } })
  context.after(() => { if (previous) Object.defineProperty(globalThis, 'navigator', previous); else Reflect.deleteProperty(globalThis, 'navigator') })
  let settled = false
  const pending = copyText('完整地址\n仪式与婚宴').then(result => { settled = true; return result })
  await Promise.resolve()
  assert.equal(settled, false)
  finish()
  assert.equal(await pending, true)
  assert.deepEqual(calls, ['完整地址\n仪式与婚宴'])
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError') } } } })
  assert.equal(await copyText('地址'), false)
})

for (const outcome of [true, false, 'throw'] as const) {
  test(`HTTP 选区复制结果 ${outcome}，同步发起并清理临时选区`, async context => {
    const calls: string[] = []
    class Element { focus() { calls.push('restore-focus') } }
    const field = { value: '', readOnly: false, style: { cssText: '' }, focus() {}, select() { calls.push('select') }, setSelectionRange(start: number, end: number) { assert.equal(start, 0); assert.equal(end, field.value.length) }, remove() { calls.push('remove') } }
    const replacements = {
      navigator: {},
      HTMLElement: Element,
      document: {
        activeElement: new Element(), getSelection: () => null,
        createElement: () => field, body: { append() { calls.push('append') } },
        execCommand(command: string) { assert.equal(command, 'copy'); assert.equal(field.value, '完整地址\n11:00'); calls.push('copy'); if (outcome === 'throw') throw new Error('Not supported'); return outcome },
      },
    }
    for (const [key, value] of Object.entries(replacements)) {
      const previous = Object.getOwnPropertyDescriptor(globalThis, key)
      Object.defineProperty(globalThis, key, { configurable: true, value })
      context.after(() => { if (previous) Object.defineProperty(globalThis, key, previous); else Reflect.deleteProperty(globalThis, key) })
    }
    const result = copyText('完整地址\n11:00')
    assert.deepEqual(calls, ['append', 'select', 'copy', 'remove', 'restore-focus'])
    assert.equal(await result, outcome === true)
  })
}
