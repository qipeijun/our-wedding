<template>
  <div class="photo-frame" :style="{ aspectRatio: `${metadata.width} / ${metadata.height}` }">
    <picture v-if="!failed" :key="attempt" class="wedding-photo">
      <source type="image/webp" :srcset="srcset" :sizes="sizes" />
      <img :src="`${base}photos/${metadata.stem}-1200.jpg`" :alt="photo.alt"
        :width="metadata.width" :height="metadata.height" :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'" decoding="async" @error="failed = true" />
    </picture>
    <div v-else class="photo-error" role="status">
      <p>{{ copy.ui.photoError }}</p>
      <button type="button" @click="retry">{{ copy.ui.retry }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PhotoChoice } from '../types'
import manifest from '../generated/photos.json'
import { copy } from '../config/wedding'

const props = withDefaults(defineProps<{ photo: PhotoChoice; priority?: boolean; sizes?: string }>(), {
  priority: false, sizes: '(min-width: 560px) 560px, 100vw',
})
const base = import.meta.env.BASE_URL
const failed = ref(false)
// 仅宾客主动点击时重建图片节点，不轮询网络。
const attempt = ref(0)
function retry() { attempt.value += 1; failed.value = false }
const metadata = computed(() => {
  const item = (manifest as Record<string, { stem: string; width: number; height: number; widths: number[] }>)[props.photo.file]
  if (!item) throw new Error(`照片 ${props.photo.file} 未生成，请运行 npm run photos:prepare`)
  return item
})
const srcset = computed(() => metadata.value.widths.map(width => `${base}photos/${metadata.value.stem}-${width}.webp ${width}w`).join(', '))
</script>
