<template>
  <div class="copy-control">
    <button type="button" class="text-button" :disabled="busy || !text" @click="copy">{{ label }} <span aria-hidden="true">↗</span></button>
    <p v-if="message" class="feedback" role="status">{{ message }}</p>
    <textarea v-if="manual" ref="field" :value="text" readonly :aria-label="`${label}，请长按选择文本`" rows="4" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
const props = defineProps<{ text: string; label: string }>()
const busy = ref(false)
const manual = ref(false)
const message = ref('')
const field = ref<HTMLTextAreaElement>()

async function showManual() {
  manual.value = true
  message.value = '当前浏览器无法自动复制，请长按下方文字复制。'
  await nextTick()
  field.value?.focus()
  field.value?.select()
}
async function copy() {
  busy.value = true
  if (!navigator.clipboard?.writeText) {
    await showManual()
    busy.value = false
    return
  }
  try {
    await navigator.clipboard.writeText(props.text)
    manual.value = false
    message.value = '已复制，可粘贴使用。'
  } catch {
    // 微信权限、非安全上下文或用户拒绝可能阻止复制，展示可选中的原文。
    await showManual()
  } finally { busy.value = false }
}
</script>
