import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createBackgroundMusic, type MusicState } from '../src/lib/background-music'

class ControlledAudio extends EventTarget {
  paused = true
  error = null
  loads = 0
  requests: { resolve: () => void; reject: (error: Error) => void }[] = []
  play() {
    this.paused = false
    return new Promise<void>((resolve, reject) => this.requests.push({ resolve, reject }))
  }
  pause() {
    const changed = !this.paused
    this.paused = true
    if (changed) this.dispatchEvent(new Event('pause'))
  }
  load() { this.loads += 1 }
  start(index: number) {
    this.paused = false
    this.dispatchEvent(new Event('playing'))
    this.requests[index]!.resolve()
  }
}
function setup() {
  const audio = new ControlledAudio()
  const states: MusicState[] = []
  const player = createBackgroundMusic(audio, state => states.push(state))
  return { audio, states, player }
}

test('自动播放被浏览器拒绝后保持可开启，不虚报播放且不自动重试', async () => {
  const { audio, states, player } = setup()
  const pending = player.activate()
  assert.equal(states.at(-1), 'loading')
  audio.requests[0]!.reject(new DOMException('User gesture required', 'NotAllowedError'))
  await pending
  assert.equal(states.at(-1), 'idle')
  assert.equal(audio.requests.length, 1)
  assert.ok(!states.includes('playing'))
  player.dispose()
})

test('首播受限后可由页面手势再次尝试，触摸与点击不创建并发播放', async () => {
  const { audio, states, player } = setup()
  const automatic = player.activate()
  audio.requests[0]!.reject(new DOMException('Gesture required', 'NotAllowedError'))
  await automatic
  const touch = player.activate()
  await player.activate()
  assert.equal(audio.requests.length, 2)
  audio.start(1)
  await touch
  assert.equal(states.at(-1), 'playing')
  player.pause()
  await player.activate()
  assert.equal(audio.requests.length, 2)
  assert.equal(audio.paused, true)
  const explicit = player.play()
  audio.start(2)
  await explicit
  assert.equal(states.at(-1), 'playing')
  player.dispose()
})

test('首播前离开或暂停会取消页面唤起，加载结束也不能重新发声', async () => {
  const { audio, states, player } = setup()
  player.pause()
  await player.activate()
  assert.equal(audio.requests.length, 0)
  assert.equal(states.at(-1), 'paused')
  player.dispose()
})

test('首播前隐藏或自动播放受限后隐藏，仍允许下一次页面手势开启', async () => {
  for (const blocked of [false, true]) {
    const { audio, states, player } = setup()
    if (blocked) {
      const automatic = player.activate()
      audio.requests[0]!.reject(new DOMException('Gesture required', 'NotAllowedError'))
      await automatic
    }
    const count = audio.requests.length
    player.suspend()
    assert.equal(audio.paused, true)
    assert.equal(states.at(-1), 'idle')
    assert.equal(audio.requests.length, count, '隐藏不创建新的播放请求')
    const gesture = player.activate()
    audio.start(count)
    await gesture
    assert.equal(states.at(-1), 'playing')
    player.dispose()
  }
})

test('首播加载中隐藏会取消旧请求，迟到事件不发声且不丢失手势唤起', async () => {
  const { audio, states, player } = setup()
  const first = player.activate()
  player.suspend()
  audio.start(0)
  await first
  assert.equal(audio.paused, true)
  assert.equal(states.at(-1), 'idle')
  assert.ok(!states.includes('paused'))
  const retry = player.activate()
  audio.start(1)
  await retry
  assert.equal(states.at(-1), 'playing')
  player.dispose()
})

test('首播加载中隐藏后，旧请求拒绝不能覆盖下一次手势播放', async () => {
  const { audio, states, player } = setup()
  const first = player.activate()
  player.suspend()
  const retry = player.activate()
  audio.start(1)
  await retry
  audio.requests[0]!.reject(new DOMException('Interrupted', 'AbortError'))
  await first
  assert.equal(states.at(-1), 'playing')
  assert.equal(audio.paused, false)
  player.dispose()
})

test('播放后隐藏或主动暂停后隐藏，不恢复普通手势唤起', async () => {
  for (const played of [false, true]) {
    const { audio, states, player } = setup()
    if (played) {
      const first = player.activate()
      audio.start(0)
      await first
    } else player.pause()
    const count = audio.requests.length
    player.suspend()
    await player.activate()
    assert.equal(audio.requests.length, count)
    assert.equal(audio.paused, true)
    assert.equal(states.at(-1), 'paused')
    player.dispose()
  }
})

test('首播资源错误与系统暂停后，普通交互不重载或恢复', async () => {
  const { audio, player } = setup()
  const first = player.activate()
  audio.dispatchEvent(new Event('error'))
  audio.requests[0]!.reject(new DOMException('Invalid audio', 'NotSupportedError'))
  await first
  await player.activate()
  assert.equal(audio.requests.length, 1)
  assert.equal(audio.loads, 0)
  const explicit = player.play()
  audio.start(1)
  await explicit
  audio.pause()
  await player.activate()
  assert.equal(audio.requests.length, 2)
  assert.equal(audio.paused, true)
  player.dispose()
})

test('音符手动开启被拒绝后，不被后续页面交互代替重试', async () => {
  const { audio, player } = setup()
  const explicit = player.play()
  audio.requests[0]!.reject(new DOMException('Denied', 'NotAllowedError'))
  await explicit
  await player.activate()
  assert.equal(audio.requests.length, 1)
  player.dispose()
})

test('真实播放后才显示播放状态，缓冲与主动暂停同步', async () => {
  const { audio, states, player } = setup()
  const pending = player.play()
  audio.start(0)
  await pending
  assert.equal(states.at(-1), 'playing')
  audio.dispatchEvent(new Event('waiting'))
  assert.equal(states.at(-1), 'loading')
  player.pause()
  assert.equal(audio.paused, true)
  assert.equal(states.at(-1), 'paused')
  audio.dispatchEvent(new Event('waiting'))
  assert.equal(states.at(-1), 'paused')
  player.dispose()
})

test('加载中暂停后，迟到的播放事件与完成回调都不能重新发声', async () => {
  const { audio, states, player } = setup()
  const pending = player.play()
  player.pause()
  audio.start(0)
  await pending
  assert.equal(audio.paused, true)
  assert.equal(states.at(-1), 'paused')
  assert.ok(!states.includes('playing'))
  player.dispose()
})

test('快速暂停后重新开启，上一轮拒绝不能覆盖新的播放', async () => {
  const { audio, states, player } = setup()
  const first = player.play()
  player.pause()
  const second = player.play()
  audio.start(1)
  await second
  audio.requests[0]!.reject(new DOMException('Interrupted', 'AbortError'))
  await first
  assert.equal(states.at(-1), 'playing')
  assert.equal(audio.paused, false)
  player.dispose()
})

test('播放期间重复请求不建立并发播放，系统中断后不自行恢复', async () => {
  const { audio, states, player } = setup()
  const first = player.play()
  await player.play()
  assert.equal(audio.requests.length, 1)
  audio.start(0)
  await first
  audio.pause()
  assert.equal(states.at(-1), 'paused')
  assert.equal(audio.requests.length, 1)
  player.dispose()
})

test('音频错误可显式重载重试，不污染页面或陷入自动重试', async () => {
  const { audio, states, player } = setup()
  const first = player.play()
  audio.dispatchEvent(new Event('error'))
  audio.requests[0]!.reject(new DOMException('Invalid audio', 'NotSupportedError'))
  await first
  assert.equal(states.at(-1), 'error')
  assert.equal(audio.paused, true)
  assert.equal(audio.loads, 0)
  const retry = player.play()
  assert.equal(audio.loads, 1)
  audio.start(1)
  await retry
  assert.equal(states.at(-1), 'playing')
  player.dispose()
})

test('销毁播放器会暂停并移除事件监听，不响应迟到回调', async () => {
  const { audio, states, player } = setup()
  const pending = player.play()
  player.dispose()
  const count = states.length
  audio.requests[0]!.resolve()
  await pending
  audio.dispatchEvent(new Event('waiting'))
  audio.dispatchEvent(new Event('error'))
  await player.play()
  assert.equal(audio.paused, true)
  assert.equal(states.length, count)
  assert.equal(audio.requests.length, 1)
})

test('网页音乐逐字节保留用户提供的循环版，不用试听版代替', async () => {
  const bytes = await readFile('public/audio/the-day-with-you-loop.mp3')
  assert.equal(bytes.length, 1201317)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '431f9dd34b9f1752ea7ea83e5fa8302d9e805c378ef148b64a14dbedaa7c2783')
})
