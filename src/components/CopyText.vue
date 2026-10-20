<template>
  <div class="copy-control">
    <button class="text-link" type="button" :disabled="busy" @click="copyAddress">{{ copy.ui.copyAddress }}</button>
    <Transition name="copy-feedback"><p v-if="copied" class="copy-feedback" role="status">{{ copy.ui.copySuccess }}</p></Transition>
    <div v-if="failed" class="copy-manual"><span role="status">{{ copy.ui.copyFallback }}</span><p>{{ copy.copyAddressText }}</p></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { copy } from '../config/wedding'
import { copyText } from '../lib/clipboard'
// 复制请求期间禁用重复操作；只有复制接口确认成功后才显示成功提示。
const busy = ref(false)
const copied = ref(false)
// 浏览器拒绝复制时在原处展示可长按的完整地址，不打开弹框。
const failed = ref(false)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
async function copyAddress() {
  if (busy.value) return
  clearTimeout(feedbackTimer)
  busy.value = true
  copied.value = false
  failed.value = false
  copied.value = await copyText(copy.copyAddressText)
  failed.value = !copied.value
  busy.value = false
  if (copied.value) feedbackTimer = setTimeout(() => { copied.value = false }, 2200)
}
onBeforeUnmount(() => { clearTimeout(feedbackTimer) })
</script>
