<template>
  <div class="background-music">
    <audio ref="audio" :src="source" preload="none" loop aria-hidden="true" />
    <button class="music-toggle" type="button" :aria-label="label" :aria-pressed="state === 'playing'" :data-state="state" @click="toggle">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path v-if="state === 'playing'" d="M9 5v14M15 5v14" class="music-pause-mark" />
        <g v-else-if="state === 'loading'" class="music-loading-mark"><circle cx="12" cy="12" r="8" opacity=".25" /><path d="M12 4a8 8 0 0 1 8 8" /></g>
        <g v-else><path d="M14 17V5l5 2" /><ellipse cx="10.5" cy="17.5" rx="3.5" ry="2.5" /><path v-if="state === 'error'" d="m5 4 14 16" /></g>
      </svg>
    </button>
    <p class="sr-only" role="status">{{ status }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createBackgroundMusic, type MusicState } from '../lib/background-music'

const audio = ref<HTMLAudioElement>()
const state = ref<MusicState>('idle')
const source = `${import.meta.env.BASE_URL}audio/the-day-with-you-loop.mp3`
const labels: Record<MusicState, string> = {
  idle: '开启音乐',
  loading: '取消加载音乐',
  playing: '暂停音乐',
  paused: '开启音乐',
  error: '音乐暂时无法播放，点击重试',
}
const label = computed(() => labels[state.value])
const status = computed(() => state.value === 'playing' ? '音乐正在播放' : state.value === 'loading' ? '音乐加载中' : label.value)
let player: ReturnType<typeof createBackgroundMusic> | undefined
// 自动尝试只有一次；任何手动操作、离开页面或后台切换都会取消尚未执行的尝试。
let autoStartPending = true

function toggle() {
  autoStartPending = false
  if (state.value === 'playing' || state.value === 'loading') player?.pause()
  else void player?.play()
}
function pause() {
  autoStartPending = false
  player?.pause()
}
function startAutomatically() {
  if (!autoStartPending) return
  autoStartPending = false
  // 外部地图返回时可能重新创建页面，不能仅依赖内存中的暂停状态。
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (!document.hidden && navigation?.type !== 'back_forward') void player?.play()
}
function onVisibilityChange() {
  if (document.hidden) pause()
}
onMounted(() => {
  if (!audio.value) return
  player = createBackgroundMusic(audio.value, next => { state.value = next })
  // 封面资源优先；只在初始页面加载结束后发起音乐请求，不监听全页触摸或微信桥接。
  if (document.readyState === 'complete') startAutomatically()
  else window.addEventListener('load', startAutomatically, { once: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', pause)
})
onBeforeUnmount(() => {
  window.removeEventListener('load', startAutomatically)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('pagehide', pause)
  player?.dispose()
})
defineExpose({ pause })
</script>
