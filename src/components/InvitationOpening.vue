<template>
  <div ref="overlay" class="opening-overlay" :data-phase="phase" role="status" aria-live="polite" aria-label="正在打开婚礼请柬">
    <p class="edition loader-copy">致亲爱的家人和朋友</p>
    <div ref="art" class="envelope-art" v-html="envelopeArtwork"></div>
    <div class="loader-copy">
      <p class="opening-names"><span>{{ wedding.couple.groom }}</span><i aria-hidden="true">＆</i><span>{{ wedding.couple.bride }}</span></p>
      <p class="opening-date">{{ wedding.date.iso.replaceAll('-', ' . ') }}</p>
      <p class="waiting-label">请柬准备中</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { wedding } from '../config/wedding'
import envelopeArtwork from '../assets/invitation-envelope.svg?raw'
import { createOpeningFlow, UNFOLD_AT_MS, UNFOLD_MS, type OpeningPhase } from '../motion/opening-flow'
import { createRibbonMotion, finalPaths, pathData, type RibbonName } from '../motion/ribbon'
import { RIBBON_RELEASE_MS, ribbonProgress } from '../motion/ribbon-release'

const props = defineProps<{ ready: boolean; photoSrc: string; titleSrc: string; target?: HTMLElement; startedAt: number }>()
const emit = defineEmits<{ complete: [] }>()
const overlay = ref<HTMLElement>()
const art = ref<HTMLDivElement>()
const phase = ref<OpeningPhase>('waiting')
let flow: ReturnType<typeof createOpeningFlow> | undefined
let motion: ReturnType<typeof createRibbonMotion>
let media: MediaQueryList
let frame = 0
let openedAt: number | undefined
let coverAnimation: Animation | undefined
let fadeAnimation: Animation | undefined
let originalOverflow = ''
let originalOverflowAnchor = ''
let originalZIndex = ''
let animatedCover: HTMLElement | undefined
let ribbons: Record<RibbonName, SVGPathElement>
let underLeft: SVGPathElement
let underWrap: SVGPathElement
let knot: SVGGElement

function paint(paths: Record<RibbonName, number[]>) {
  for (const name of Object.keys(paths) as RibbonName[]) ribbons[name].setAttribute('d', pathData(paths[name]))
  underLeft.setAttribute('d', pathData(paths.right) + ' ' + pathData(paths['right-tail']))
  underWrap.setAttribute('d', pathData(paths.left) + ' ' + pathData(paths.right))
}
function tick(now: number) {
  paint(motion.sample(now, openedAt))
  if (openedAt !== undefined) {
    const opacity = String(1 - ribbonProgress(now - openedAt, 420, 770))
    knot.style.opacity = opacity
    // 结心松开后不再遮挡穿插，否则收为一点的带耳会在横绳上裁出断口。
    underLeft.style.opacity = opacity
    underWrap.style.opacity = opacity
  }
  // 红绳离开后，翻盖与照片交给 CSS/WAAPI；不再计算屏幕外的曲线。
  if (openedAt === undefined || now - openedAt < RIBBON_RELEASE_MS) frame = requestAnimationFrame(tick)
}
function startFrames() {
  cancelAnimationFrame(frame)
  if (!document.hidden && !media.matches && (phase.value === 'waiting' || phase.value === 'opening')) frame = requestAnimationFrame(tick)
}
function restoreCover() {
  coverAnimation?.cancel()
  if (animatedCover) animatedCover.style.zIndex = originalZIndex
}
function change(next: OpeningPhase, duration: number) {
  phase.value = next
  if (next === 'opening') {
    art.value!.querySelector('.letter-photo')!.setAttribute('href', props.photoSrc)
    art.value!.querySelector('.letter-title')!.setAttribute('href', props.titleSrc)
    openedAt = performance.now()
    const target = props.target!
    const bounds = target.getBoundingClientRect(), artwork = art.value!.getBoundingClientRect()
    const scale = artwork.width / 360
    // 抽出后的照片原点为 (91, 32)，宽 178；真实封面从同一图像边界继续展开。
    const x = artwork.left + 91 * scale - bounds.left
    const y = artwork.top + 32 * scale - bounds.top
    animatedCover = target; originalZIndex = target.style.zIndex; target.style.zIndex = '31'
    // 同一照片边界直接接管，避免半透明放大与信封内照片叠成双影。
    coverAnimation = target.animate([
      { transform: `translate(${x}px,${y}px) scale(${178 * scale / bounds.width})`, opacity: 0 },
      { transform: `translate(${x}px,${y}px) scale(${178 * scale / bounds.width})`, opacity: 1, offset: .001 },
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
    ], { delay: UNFOLD_AT_MS, duration: UNFOLD_MS, easing: 'cubic-bezier(.37,0,.63,1)', fill: 'both' })
  } else if (next === 'fading') {
    fadeAnimation = overlay.value!.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' })
  } else if (next === 'done') {
    restoreCover(); emit('complete')
  }
  startFrames()
}
function visibilityChanged() {
  motion.resume(performance.now())
  if (!document.hidden) flow?.resume()
  startFrames()
}
function motionPreferenceChanged() { flow?.reduce(media.matches); motion.resume(performance.now()); startFrames() }
watch(() => props.ready && !!props.target, ready => { if (ready) flow?.ready() }, { flush: 'post' })
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  motion = createRibbonMotion(performance.now())
  ribbons = Object.fromEntries((Object.keys(finalPaths) as RibbonName[]).map(name => [name, art.value!.querySelector(`[data-ribbon="${name}"]`)!])) as Record<RibbonName, SVGPathElement>
  underLeft = art.value!.querySelector('[data-mask="under-left"]')!
  underWrap = art.value!.querySelector('[data-mask="under-wrap"]')!
  knot = art.value!.querySelector('.knot')!
  paint(finalPaths)
  originalOverflow = document.documentElement.style.overflow
  originalOverflowAnchor = document.documentElement.style.overflowAnchor
  document.documentElement.style.overflow = 'hidden'
  // 封面缩放只改变视觉位置，禁止滚动锚定追随其中的文字而把首屏拉到照片中段。
  document.documentElement.style.overflowAnchor = 'none'
  document.addEventListener('visibilitychange', visibilityChanged)
  media.addEventListener('change', motionPreferenceChanged)
  flow = createOpeningFlow(change, media.matches, undefined, props.startedAt)
  startFrames()
  if (props.ready && props.target) flow.ready()
})
onBeforeUnmount(() => {
  flow?.dispose(); cancelAnimationFrame(frame)
  fadeAnimation?.cancel(); restoreCover()
  document.documentElement.style.overflow = originalOverflow
  document.documentElement.style.overflowAnchor = originalOverflowAnchor
  document.removeEventListener('visibilitychange', visibilityChanged)
  media?.removeEventListener('change', motionPreferenceChanged)
})
</script>

<style scoped>
[data-phase="opening"] :deep(.flap-front) { animation:flap-front .36s .94s var(--move) both; }
[data-phase="opening"] :deep(.flap-back) { animation:flap-back .36s .94s var(--move) both; }
[data-phase="opening"] :deep(.letter) { animation:letter-lift .62s 1.15s var(--out) both; }
[data-phase="opening"] :deep(.envelope-body) { animation:paper-away .35s 1.77s var(--out) both; }
[data-phase="opening"] .loader-copy { animation:copy-away .35s .08s both; }
[data-phase="opening"] { animation:loader-away .3s 2.1s both; }
@keyframes flap-front { 0% {transform:scaleY(1);opacity:1} 49% {transform:scaleY(0);opacity:1} 50%,100% {transform:scaleY(0);opacity:0} }
@keyframes flap-back { 0%,49% {transform:scaleY(0);opacity:0} 50% {transform:scaleY(0);opacity:1} 100% {transform:scaleY(-1);opacity:1} }
@keyframes letter-lift { from {transform:translateY(0)} to {transform:translateY(-130px)} }
@keyframes paper-away { to {transform:translateY(22px);opacity:0} }
@keyframes copy-away { to {opacity:0;transform:translateY(5px)} }
@keyframes loader-away { to {opacity:0} }
@media (prefers-reduced-motion:reduce) { *,*::before,*::after {animation:none!important} }
</style>
