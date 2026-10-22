/** 等待图片与原手写标题就绪。 */
export type OpeningPhase = 'waiting'
  /** 红绳离开、信封开启、照片展开。 */
  | 'opening'
  /** 时间不足或减弱动态时，短淡出开场。 */
  | 'fading'
  /** 开场结束，正文可交互；后到图片不重播开场。 */
  | 'done'

export const OPENING_MS = 2400
export const UNFOLD_AT_MS = 1770
export const UNFOLD_MS = 630
export const LOADING_LIMIT_MS = 5000
const FADE_MS = 200

type Clock = {
  now(): number
  schedule(callback: () => void, delay: number): ReturnType<typeof setTimeout>
  cancel(id: ReturnType<typeof setTimeout>): void
}
const browserClock: Clock = {
  now: () => performance.now(),
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: id => clearTimeout(id),
}

/** 五秒是开场占用页面的总上限，包含启封或淡出；后台恢复不重新开始计时。 */
export function createOpeningFlow(
  change: (phase: OpeningPhase, duration: number) => void,
  reduced: boolean,
  clock: Clock = browserClock,
  startedAt = clock.now(),
) {
  let phase: OpeningPhase = 'waiting'
  let disposed = false
  const timers = new Set<ReturnType<typeof setTimeout>>()
  function clear() { timers.forEach(id => clock.cancel(id)); timers.clear() }
  function later(callback: () => void, delay: number) {
    const id = clock.schedule(() => { timers.delete(id); if (!disposed) callback() }, delay)
    timers.add(id)
  }
  function finish() { clear(); phase = 'done'; change(phase, 0) }
  function fade() {
    clear()
    const duration = reduced ? 0 : Math.min(FADE_MS, Math.max(0, LOADING_LIMIT_MS - (clock.now() - startedAt)))
    if (!duration) { finish(); return }
    phase = 'fading'; change(phase, duration); later(finish, duration)
  }
  const remaining = Math.max(0, LOADING_LIMIT_MS - (clock.now() - startedAt))
  later(fade, Math.max(0, remaining - FADE_MS))
  later(finish, remaining)
  return {
    ready() {
      if (disposed || phase !== 'waiting') return
      const remaining = LOADING_LIMIT_MS - (clock.now() - startedAt)
      if (reduced || remaining < OPENING_MS) { fade(); return }
      clear(); phase = 'opening'; change(phase, OPENING_MS)
      later(finish, Math.min(OPENING_MS, remaining))
    },
    reduce(value: boolean) {
      reduced = value
      if (value && (phase === 'opening' || phase === 'fading')) finish()
    },
    resume() {
      if (!disposed && phase !== 'done' && clock.now() - startedAt >= LOADING_LIMIT_MS) finish()
    },
    dispose() { disposed = true; clear() },
  }
}
