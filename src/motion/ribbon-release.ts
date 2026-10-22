import type { RibbonName } from './ribbon'

type Paths = Record<RibbonName, number[]>
export const RIBBON_RELEASE_MS = 1040
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const blend = (a: number[], b: number[], t: number) => a.map((n, i) => mix(n, b[i], t))

/** 与封套翻盖使用相同的 ease-in-out 曲线，时间与曲线参数分开求解。 */
export function ribbonProgress(time: number, start: number, end: number) {
  const x = Math.max(0, Math.min(1, (time - start) / (end - start)))
  if (x === 0 || x === 1) return x
  let low = 0, high = 1
  for (let i = 0; i < 18; i++) {
    const t = (low + high) / 2, u = 1 - t
    if (3 * u * u * t * .37 + 3 * u * t * t * .63 + t ** 3 < x) low = t
    else high = t
  }
  const t = (low + high) / 2
  return 3 * (1 - t) * t * t + t ** 3
}

function point(p: number[], t: number) {
  const u = 1 - t
  return [0, 1].map(i => u ** 3 * p[i] + 3 * u * u * t * p[i + 2] + 3 * u * t * t * p[i + 4] + t ** 3 * p[i + 6])
}
function length(path: number[]) {
  let total = 0, start = path.slice(0, 2)
  for (let i = 2; i < path.length; i += 6) {
    const curve = [...start, ...path.slice(i, i + 6)]
    let previous = start
    for (let j = 1; j <= 24; j++) {
      const next = point(curve, j / 24)
      total += Math.hypot(next[0] - previous[0], next[1] - previous[1]); previous = next
    }
    start = curve.slice(-2)
  }
  return total
}
function subdivide(curve: number[], count: number) {
  const result = curve.slice(0, 2)
  const tangent = (t: number) => [0, 1].map(i => {
    const u = 1 - t
    return (3 * u * u * (curve[i + 2] - curve[i]) + 6 * u * t * (curve[i + 4] - curve[i + 2]) + 3 * t * t * (curve[i + 6] - curve[i + 4])) / count
  })
  for (let i = 0; i < count; i++) {
    const a = point(curve, i / count), b = point(curve, (i + 1) / count)
    const da = tangent(i / count), db = tangent((i + 1) / count)
    result.push(a[0] + da[0] / 3, a[1] + da[1] / 3, b[0] - db[0] / 3, b[1] - db[1] / 3, ...b)
  }
  return result
}
const turn = (from: number, to: number, t: number) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * t

/** 右尾先抽、左尾跟随；带耳释放的长度送入同股线尾，之后整股红绳滑出。 */
export function createRibbonRelease(source: Paths, velocity: Paths) {
  const totals = {
    left: length(source.left) + length(source['left-tail']) + length(source['wrap-right']),
    right: length(source.right) + length(source['right-tail']) + length(source['wrap-left']),
  }
  return (elapsed: number): Paths => {
    const paths = {} as Paths
    for (const [name, side] of [['left', -1], ['right', 1]] as const) {
      const local = elapsed - (side === 1 ? 0 : 70)
      const pull = ribbonProgress(local, 0, 700), align = ribbonProgress(local, 0, 420)
      const earSource = source[name], root = earSource.slice(0, 2)
      const tailName = `${name}-tail` as const, wrapName = side === 1 ? 'wrap-left' : 'wrap-right'
      const dx = side * 42, dy = 5
      // 带耳收回结心，保持原有曲率方向；不能把闭环直接插值成直线，否则中途会翻成八字。
      const ear = earSource.map((n, i) => root[i % 2] + (n - root[i % 2]) * (1 - pull))
      const joint = root
      const targetAngle = Math.atan2(dy, dx)

      // 保留等待末帧的速度，约 120ms 内自然耗散；位移从零开始，不跳回默认尾绳。
      const carry = elapsed / 1000 * Math.exp(-elapsed / 120) * (1 - pull) ** 2
      const tailSource = source[tailName].map((n, i) => n + velocity[tailName][i] * carry)
      const shifted = tailSource.map((n, i) => n + joint[i % 2] - root[i % 2])
      const reach = length(source[tailName]), count = (tailSource.length - 2) / 6
      const first = [tailSource[2] - root[0], tailSource[3] - root[1]]
      const last = [tailSource.at(-2)! - tailSource.at(-4)!, tailSource.at(-1)! - tailSource.at(-3)!]
      const startAngle = turn(Math.atan2(first[1], first[0]), targetAngle, align)
      const endAngle = turn(Math.atan2(last[1], last[0]), targetAngle, pull)
      const firstHandle = mix(Math.hypot(...first) * count, reach / 3, pull)
      const lastHandle = mix(Math.hypot(...last) * count, reach / 3, pull)
      const end = blend(shifted.slice(-2), [joint[0] + side * reach, joint[1] + dy * reach / Math.abs(dx)], pull)
      const guide = [...joint, joint[0] + Math.cos(startAngle) * firstHandle, joint[1] + Math.sin(startAngle) * firstHandle,
        end[0] - Math.cos(endAngle) * lastHandle, end[1] - Math.sin(endAngle) * lastHandle, ...end]
      const tail = blend(shifted, subdivide(guide, count), align)
      const wrap = source[wrapName].slice()
      const wrapHandle = Math.hypot(wrap[6] - wrap[4], wrap[7] - wrap[5])
      wrap[4] = mix(wrap[4], root[0] - Math.cos(startAngle) * wrapHandle, align)
      wrap[5] = mix(wrap[5], root[1] - Math.sin(startAngle) * wrapHandle, align)
      const scale = (totals[name] - length(ear) - length(wrap)) / length(tail)
      const extended = tail.map((n, i) => joint[i % 2] + (n - joint[i % 2]) * scale)
      const offset = side * 360 * ribbonProgress(elapsed, 560, RIBBON_RELEASE_MS)
      const translate = (p: number[]) => p.map((n, i) => i % 2 === 0 ? n + offset : n)
      paths[name] = translate(ear); paths[tailName] = translate(extended); paths[wrapName] = translate(wrap)
    }
    return paths
  }
}
