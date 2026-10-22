<template>
  <div class="photo-frame" :class="{ 'is-loaded': loaded, 'has-error': failed }" :style="{ aspectRatio: `${metadata.width} / ${metadata.height}` }">
    <img class="photo-preview" :src="preview" alt="" aria-hidden="true" :width="metadata.width" :height="metadata.height" :loading="priority ? 'eager' : 'lazy'" decoding="async" />
    <div class="photo-mist" aria-hidden="true"></div>
    <picture v-if="!failed" :key="attempt" class="wedding-photo">
      <source type="image/webp" :srcset="srcset" :sizes="sizes" />
      <img ref="image" :src="`${base}photos/${metadata.stem}-1200.jpg`" :alt="photo.alt"
        :width="metadata.width" :height="metadata.height" :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'" decoding="async" @load="markLoaded" @error="retryAutomatically" />
    </picture>
    <div v-else class="photo-error" role="status">
      <p>{{ copy.ui.photoError }}</p>
      <button type="button" @click="retry">{{ copy.ui.retry }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { PhotoChoice } from '../types'
import manifest from '../generated/photos.json'
import { copy } from '../config/wedding'
import coverPreview from '../assets/cover-preview.webp?inline'

const props = withDefaults(defineProps<{ photo: PhotoChoice; priority?: boolean; sizes?: string }>(), {
  priority: false, sizes: '(min-width: 560px) 560px, 100vw',
})
const base = import.meta.env.BASE_URL
const emit = defineEmits<{ ready: [src: string] }>()
const image = ref<HTMLImageElement>()
// 高清原图就绪后撤去纸雾，失败时保留预览和现有重试入口。
const loaded = ref(false)
const failed = ref(false)
// 短暂断网先静默重试，五次仍失败才显示手动入口；等待期间保留轻量预览。
const retryDelays = [400, 1000, 2000, 2000, 2000] as const
let automaticRetries = 0
let retryTimer: ReturnType<typeof setTimeout> | undefined
const attempt = ref(0)
function clearRetry() {
  clearTimeout(retryTimer)
  retryTimer = undefined
}
function retryAutomatically() {
  if (retryTimer !== undefined || failed.value) return
  loaded.value = false
  const delay = retryDelays[automaticRetries]
  if (delay === undefined) { failed.value = true; return }
  automaticRetries += 1
  retryTimer = setTimeout(() => {
    retryTimer = undefined
    attempt.value += 1
  }, delay)
}
function retry() {
  clearRetry()
  automaticRetries = 0
  attempt.value += 1
  failed.value = false
  loaded.value = false
}
function markLoaded() {
  if (!image.value?.naturalWidth || loaded.value) return
  clearRetry()
  automaticRetries = 0
  loaded.value = true
  emit('ready', image.value.currentSrc)
}
onMounted(() => { if (image.value?.complete) markLoaded() })
onBeforeUnmount(clearRetry)
const metadata = computed(() => {
  const item = (manifest as Record<string, { stem: string; width: number; height: number; widths: number[] }>)[props.photo.file]
  if (!item) throw new Error(`照片 ${props.photo.file} 未生成，请运行 npm run photos:prepare`)
  return item
})
const srcset = computed(() => metadata.value.widths.map(width => `${base}photos/${metadata.value.stem}-${width}.webp ${width}w`).join(', '))
const preview = computed(() => props.photo.id === 'cover' ? coverPreview : `${base}photos/${metadata.value.stem}-preview.webp`)
</script>

<style scoped>
.photo-preview,.photo-mist { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
.photo-preview { object-fit:contain; }
.photo-mist { background:linear-gradient(155deg,rgba(255,241,222,.24),rgba(255,246,232,.13) 44%,rgba(255,235,217,.2)); }
.wedding-photo { position:relative; opacity:0; transition:opacity .8s cubic-bezier(.23,1,.32,1); }
.is-loaded .wedding-photo { opacity:1; }
.is-loaded .photo-mist { opacity:0; transition:opacity .8s cubic-bezier(.23,1,.32,1); }
.photo-error { inset:auto 12px 12px; flex-direction:row; gap:8px; justify-content:center; padding:4px 10px; border-radius:4px; background:rgba(255,248,240,.94); color:var(--brand-deep); font-size:12px; line-height:1.5; }
.photo-error p { margin:0; }
.photo-error button { min-height:44px; margin:0; padding:6px 8px; border:0; font-size:inherit; white-space:nowrap; text-decoration:underline; text-underline-offset:3px; }
@media(prefers-reduced-motion:reduce) { .wedding-photo,.photo-mist { transition:none; } }
</style>
