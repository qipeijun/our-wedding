import test from 'node:test'
import assert from 'node:assert/strict'
import { createOpeningFlow, LOADING_LIMIT_MS, OPENING_MS, type OpeningPhase } from '../src/motion/opening-flow'
import { createRibbonMotion, finalPaths } from '../src/motion/ribbon'
import { RIBBON_RELEASE_MS } from '../src/motion/ribbon-release'

function fixture(reduced = false, bootElapsed = 0) {
  let now = bootElapsed, id = 0
  const timers = new Map<number, { at: number; callback: () => void }>()
  const changes: { phase: OpeningPhase; duration: number; at: number }[] = []
  const flow = createOpeningFlow((phase, duration) => changes.push({ phase, duration, at: now }), reduced, {
    now: () => now,
    schedule: (callback, delay) => { timers.set(++id, { at: now + delay, callback }); return id as unknown as ReturnType<typeof setTimeout> },
    cancel: id => { timers.delete(id as unknown as number) },
  }, 0)
  return { flow, changes, timers,
    advance(target: number) {
      while (true) {
        const next = [...timers].filter(([, item]) => item.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
        if (!next) break
        now = next[1].at; timers.delete(next[0]); next[1].callback()
      }
      now = target
    },
    jump(target: number) { now = target },
  }
}

test('加载超时：五秒内淡出，迟到的图片不重新启封', () => {
  const f = fixture()
  f.advance(4800)
  assert.deepEqual(f.changes, [{ phase: 'fading', duration: 200, at: 4800 }])
  f.flow.ready()
  f.advance(LOADING_LIMIT_MS)
  assert.equal(f.changes.at(-1)?.phase, 'done')
  assert.equal(f.timers.size, 0)
  f.flow.ready()
  assert.equal(f.changes.length, 2)
})

test('早就绪完整启封；临近截止时间缩短到淡出，不超出五秒', () => {
  for (const time of [0, 1200, 2600, 2601, 4799, 4900]) {
    const f = fixture()
    f.jump(time); f.flow.ready()
    assert.equal(f.changes[0]?.phase, time <= 2600 ? 'opening' : 'fading')
    f.advance(6000)
    assert.equal(f.changes.at(-1)?.phase, 'done')
    assert.ok(f.changes.at(-1)!.at <= LOADING_LIMIT_MS)
    if (time <= 2600) assert.equal(f.changes.at(-1)!.at, time + OPENING_MS)
  }
})

test('减弱动态、后台恢复和卸载均释放开场，不残留计时器', () => {
  const reduced = fixture(true)
  reduced.flow.ready()
  assert.deepEqual(reduced.changes.map(item => item.phase), ['done'])
  const changing = fixture()
  changing.flow.ready(); changing.advance(600); changing.flow.reduce(true)
  assert.equal(changing.changes.at(-1)?.phase, 'done')
  const background = fixture()
  background.jump(7000); background.flow.resume()
  assert.equal(background.changes.at(-1)?.phase, 'done')
  const unmounted = fixture()
  unmounted.flow.ready(); unmounted.flow.dispose(); unmounted.advance(8000)
  assert.equal(unmounted.changes.length, 1)
  for (const f of [reduced, changing, background, unmounted]) assert.equal(f.timers.size, 0)
})

function length(points: number[]) {
  let result = 0, x = points[0]!, y = points[1]!
  for (let i = 2; i < points.length; i += 6) {
    const ax = x, ay = y
    for (let j = 1; j <= 40; j++) {
      const t = j / 40, u = 1 - t
      const nx = u ** 3 * ax + 3 * u * u * t * points[i]! + 3 * u * t * t * points[i + 2]! + t ** 3 * points[i + 4]!
      const ny = u ** 3 * ay + 3 * u * u * t * points[i + 1]! + 3 * u * t * t * points[i + 3]! + t ** 3 * points[i + 5]!
      result += Math.hypot(nx - x, ny - y); x = nx; y = ny
    }
  }
  return result
}

test('等待仅尾绳移动，定长轻摆无折角或越界', () => {
  const motion = createRibbonMotion(0)
  const lengths = [length(finalPaths['left-tail']), length(finalPaths['right-tail'])]
  for (let time = 0; time <= 2000; time += 8) {
    const paths = motion.sample(time)
    for (const name of ['left', 'right', 'wrap-left', 'wrap-right'] as const) assert.deepEqual(paths[name], finalPaths[name])
    for (const [i, name] of (['left-tail', 'right-tail'] as const).entries()) {
      const points = paths[name]
      assert.ok(Math.abs(length(points) / lengths[i]! - 1) < .01, '尾绳弧长偏差小于1%')
      for (let p = 0; p < points.length; p += 2) {
        assert.ok(points[p]! > 80 && points[p]! < 280)
        assert.ok(points[p + 1]! >= 219 && points[p + 1]! < 340)
      }
      for (let p = 6; p < points.length - 2; p += 6) {
        const ax = points[p]! - points[p - 2]!, ay = points[p + 1]! - points[p - 1]!
        const bx = points[p + 2]! - points[p]!, by = points[p + 3]! - points[p + 1]!
        assert.ok((ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by)) > .999, '接缝切线连续')
      }
    }
  }
})

// 使用输出曲线验证可见行为：不同等待时长都必须从当前位置解结，不能弹回默认造型。
test('快慢网解结连续：保留起步姿态，整股绳长守恒，退开后不残留横绳', () => {
  for (const wait of [0, 400, 2000, 2800]) {
    const motion = createRibbonMotion(0)
    for (let t = 0; t < wait; t += 8) motion.sample(t)
    const before = motion.sample(wait)
    const start = motion.sample(wait, wait)
    const cords = [['left', 'left-tail', 'wrap-right'], ['right', 'right-tail', 'wrap-left']] as const
    for (const names of cords) {
      for (const name of names) start[name].forEach((n, i) => assert.ok(Math.abs(n - before[name][i]) < .01, '解结首帧与等待末帧一致'))
    }
    const baseline = cords.map(names => names.reduce((sum, name) => sum + length(start[name]), 0))
    let previous = start
    for (let elapsed = 8; elapsed <= RIBBON_RELEASE_MS + 8; elapsed += 8) {
      const paths = motion.sample(wait + elapsed, wait)
      for (const [index, names] of cords.entries()) {
        const total = names.reduce((sum, name) => sum + length(paths[name]), 0)
        assert.ok(Math.abs(total / baseline[index] - 1) < .005, '解结只是移送绳长，不能拉伸或凭空消失')
        for (const name of names) {
          assert.ok(paths[name].every(Number.isFinite))
          if (elapsed <= 24) paths[name].forEach((n, i) => assert.ok(Math.abs(n - previous[name][i]) < 1, '起步不得弹跳'))
        }
        const ear = paths[names[0]], tail = paths[names[1]]
        assert.ok(Math.hypot(ear.at(-2)! - tail[0], ear.at(-1)! - tail[1]) < .001, '带耳与尾端始终相连')
      }
      previous = paths
    }
    for (const name of cords[0]) assert.ok(previous[name].filter((_, i) => i % 2 === 0).every(x => x < 40), '左股完整退离信封')
    for (const name of cords[1]) assert.ok(previous[name].filter((_, i) => i % 2 === 0).every(x => x > 320), '右股完整退离信封')
  }
})

test('入口脚本下载时间计入五秒上限，不在挂载后重新计时', () => {
  const late = fixture(false, 3900)
  late.flow.ready()
  assert.deepEqual(late.changes, [{ phase: 'fading', duration: 200, at: 3900 }])
  late.advance(4100)
  assert.equal(late.changes.at(-1)?.phase, 'done')
  const waiting = fixture(false, 4300)
  waiting.advance(4800)
  assert.equal(waiting.changes.at(-1)?.phase, 'fading')
  waiting.advance(5000)
  assert.equal(waiting.changes.at(-1)?.phase, 'done')
})
