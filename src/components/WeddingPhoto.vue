<template>
  <picture class="wedding-photo">
    <source type="image/webp" :srcset="srcset" :sizes="sizes" />
    <img :src="`${base}photos/${metadata.stem}-1200.jpg`" :alt="photo.alt"
      :width="metadata.width" :height="metadata.height"
      :loading="priority ? 'eager' : 'lazy'" :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async" :style="{ objectPosition: photo.position }" />
  </picture>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PhotoChoice } from '../types'
import manifest from '../generated/photos.json'

const props = withDefaults(defineProps<{ photo: PhotoChoice; priority?: boolean; sizes?: string }>(), {
  priority: false, sizes: '(min-width: 600px) 560px, 100vw',
})
const base = import.meta.env.BASE_URL
const metadata = computed(() => {
  const item = (manifest as Record<string, { stem: string; width: number; height: number; widths: number[] }>)[props.photo.file]
  if (!item) throw new Error(`照片 ${props.photo.file} 未生成，请运行 npm run photos:prepare`)
  return item
})
const srcset = computed(() => metadata.value.widths.map((width) => `${base}photos/${metadata.value.stem}-${width}.webp ${width}w`).join(', '))
</script>
