import { createRibbonRelease } from './ribbon-release'

/** 等待时结心与带耳固定；启封时两股红绳依次抽出。 */
export type RibbonName = 'left' | 'right' | 'left-tail' | 'right-tail' | 'wrap-left' | 'wrap-right'
type Node = {
  x: number
  y: number
  px: number
  py: number
  anchorX: number
  anchorY: number
  weight: number
}
type Rope = {
  name: 'left-tail' | 'right-tail'
  nodes: Node[]
  lengths: number[]
  angles: number[]
  tangents: number[][]
}
function loop(side: number, reach: number, lift: number, x = 180, y = 220) {
  const tipX = x + side * reach, tipY = y - lift
  const tangentX = side * reach * .17, tangentY = lift * .65
  return [x, y, x + side * reach * .24, y - lift * 1.05, tipX - tangentX, tipY - tangentY, tipX, tipY,
    tipX + tangentX, tipY + tangentY, x + side * reach * .55, y + lift * .60, x, y]
}
export const finalPaths: Record<RibbonName, number[]> = {
  left: loop(-1, 84, 35), right: loop(1, 88, 34),
  'left-tail': [180, 220, 160, 250, 140, 285, 111, 303],
  'right-tail': [180, 220, 195, 251, 205, 291, 242, 306],
  'wrap-left': [40, 218, 88, 219, 136, 220, 180, 220],
  'wrap-right': [320, 218, 272, 219, 224, 220, 180, 220]
}
export function pathData(points: number[]) {
  let value = `M${points[0].toFixed(3)} ${points[1].toFixed(3)}`
  for (let i = 2; i < points.length; i += 6)
    value += ` C${points.slice(i, i + 6).map(n => n.toFixed(3)).join(' ')}`
  return value
}
/** 每个开场实例独立持有物理状态；返回路径，不读写页面或注册帧回调。 */
export function createRibbonMotion(now: number) {
  let release: ReturnType<typeof createRibbonRelease> | undefined
  let previousPaths: Record<RibbonName, number[]> | undefined
  let previousAt = now
  const ROPE_SEGMENTS = 9
  const PHYSICS_STEP = 1 / 120
  const GRAVITY = 100
  const AIR_DAMPING = 2.4
  const BEND_COMPLIANCE = 0.000004
  let ropes: Rope[] = []
  let physicsTime = 0
  let physicsRemainder = 0
  let physicsLastAt = 0
  function cubicPoint(points: number[], t: number) {
    const u = 1 - t
    return [0, 1].map(axis => u * u * u * points[axis] + 3 * u * u * t * points[axis + 2] + 3 * u * t * t * points[axis + 4] + t * t * t * points[axis + 6])
  }
  function cubicTangent(points: number[], t: number) {
    const u = 1 - t
    return [0, 1].map(axis => (3 * u * u * (points[axis + 2] - points[axis]) + 6 * u * t * (points[axis + 4] - points[axis + 2]) + 3 * t * t * (points[axis + 6] - points[axis + 4])) / ROPE_SEGMENTS)
  }
  const signedAngle = (a: Node, b: Node, c: Node) => Math.atan2((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x), (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y))
  function resetPhysics(now: number) {
    physicsTime = 0
    physicsRemainder = 0
    physicsLastAt = now
    ropes = (['left-tail', 'right-tail'] as const).map(name => {
      const nodes = Array.from({ length: ROPE_SEGMENTS + 1 }, (_, i) => {
        const [x, y] = cubicPoint(finalPaths[name], i / ROPE_SEGMENTS)
        return { x, y, px: x, py: y, anchorX: x, anchorY: y, weight: i < 2 ? 0 : 1 }
      })
      return { name, nodes,
        lengths: nodes.slice(1).map((p, i) => Math.hypot(p.x - nodes[i].x, p.y - nodes[i].y)),
        angles: nodes.slice(2).map((p, i) => signedAngle(nodes[i], nodes[i + 1], p)),
        tangents: nodes.map((_, i) => cubicTangent(finalPaths[name], i / ROPE_SEGMENTS))
      }
    })
  }
  function solveRope(rope: Rope, wind: number) {
    const nodes = rope.nodes, dt = PHYSICS_STEP
    const damping = Math.exp(-AIR_DAMPING * dt)
    for (const p of nodes) {
      if (!p.weight)
        continue
      const vx = (p.x - p.px) * damping, vy = (p.y - p.py) * damping
      p.px = p.x
      p.py = p.y
      p.x += vx + wind * dt * dt
      p.y += vy + GRAVITY * dt * dt
    }
    // XPBD 的柔度按固定时间步换算；每步重置约束乘子，不依赖屏幕刷新率。
    const lambdas = rope.angles.map(() => 0)
    const alpha = BEND_COMPLIANCE / (dt * dt)
    for (let pass = 0; pass < 32; pass++) {
      for (let i = 0; i < nodes.length - 2; i++) {
        const a = nodes[i], b = nodes[i + 1], c = nodes[i + 2]
        const ux = b.x - a.x, uy = b.y - a.y, vx = c.x - b.x, vy = c.y - b.y
        const u2 = ux * ux + uy * uy, v2 = vx * vx + vy * vy
        const ga = [-uy / u2, ux / u2], gc = [-vy / v2, vx / v2]
        const gb = [-ga[0] - gc[0], -ga[1] - gc[1]]
        const error = signedAngle(a, b, c) - rope.angles[i]
        const constraint = Math.atan2(Math.sin(error), Math.cos(error))
        const sum = a.weight * (ga[0] * ga[0] + ga[1] * ga[1]) + b.weight * (gb[0] * gb[0] + gb[1] * gb[1]) + c.weight * (gc[0] * gc[0] + gc[1] * gc[1])
        const delta = (-constraint - alpha * lambdas[i]) / (sum + alpha)
        lambdas[i] += delta
        for (const [p, g] of ([[a, ga], [b, gb], [c, gc]] as const)) {
          p.x += p.weight * delta * g[0]
          p.y += p.weight * delta * g[1]
        }
      }
      // 固定段不参与求解；其余段消除伸长，使运动来自弯曲而不是缩放。
      for (let i = 1; i < nodes.length - 1; i++) {
        const a = nodes[i], b = nodes[i + 1], dx = b.x - a.x, dy = b.y - a.y
        const length = Math.hypot(dx, dy), weight = a.weight + b.weight
        const correction = (length - rope.lengths[i]) / (length * weight)
        a.x += a.weight * dx * correction
        a.y += a.weight * dy * correction
        b.x -= b.weight * dx * correction
        b.y -= b.weight * dy * correction
      }
    }
  }
  function ropePath(rope: Rope) {
    const nodes = rope.nodes
    const tangents = nodes.map((_, i) => {
      if (i === 0)
        return rope.tangents[i]
      const a = nodes[Math.max(0, i - 1)], b = nodes[Math.min(nodes.length - 1, i + 1)]
      const rotation = Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(b.anchorY - a.anchorY, b.anchorX - a.anchorX)
      const [x, y] = rope.tangents[i]
      return [x * Math.cos(rotation) - y * Math.sin(rotation), x * Math.sin(rotation) + y * Math.cos(rotation)]
    })
    const path = [nodes[0].x, nodes[0].y]
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1], da = tangents[i], db = tangents[i + 1]
      path.push(a.x + da[0] / 3, a.y + da[1] / 3, b.x - db[0] / 3, b.y - db[1] / 3, b.x, b.y)
    }
    return path
  }
  function drawWaiting(now: number, openingAt?: number) {
    if (openingAt !== undefined && release) return release(now - openingAt)
    const sampleAt = openingAt ?? now
    // 后台恢复不补算积压时间；卡顿帧最多推进 50ms，避免突然甩动。
    physicsRemainder += Math.min((sampleAt - physicsLastAt) / 1000, .05)
    physicsLastAt = sampleAt
    while (physicsRemainder >= PHYSICS_STEP) {
      physicsTime += PHYSICS_STEP
      const ramp = Math.min(physicsTime / .8, 1)
      const wind = ramp * (14 * Math.sin(physicsTime * 1.35) + 9 * Math.sin(physicsTime * 2.1 + .5))
      ropes.forEach(rope => solveRope(rope, wind))
      physicsRemainder -= PHYSICS_STEP
    }
    const paths = { ...finalPaths }
    for (const rope of ropes)
      paths[rope.name] = ropePath(rope)
    if (openingAt !== undefined) {
      // 从等待的实时曲线和速度起步，解结不恢复初始造型，也不骤变绳的硬度。
      const dt = (sampleAt - previousAt) / 1000
      const velocity = Object.fromEntries(Object.entries(paths).map(([name, points]) => [name,
        points.map((point, i) => dt > 0 && previousPaths ? (point - previousPaths[name as RibbonName][i]) / dt : 0)
      ])) as Record<RibbonName, number[]>
      release = createRibbonRelease(paths, velocity)
      return release(now - openingAt)
    }
    previousPaths = paths; previousAt = sampleAt
    return paths
  }
  resetPhysics(now)
  return {
    sample: drawWaiting,
    // 页面恢复时丢弃后台时间，避免一次性补算和突然甩动。
    resume(now: number) { physicsLastAt = now; physicsRemainder = 0; },
  }
}
