<template>
  <div class="copy-control">
    <button ref="trigger" class="text-link" type="button" :disabled="busy" @click="copyAddress">{{ copy.ui.copyAddress }}</button>
    <p v-if="copied" class="copy-feedback" role="status">{{ copy.ui.copySuccess }}</p>
    <ActionDialog ref="manualDialog" :title="copy.ui.copyAddress" @open-change="emit('open-change', $event)">
      <div class="copy-manual"><p>{{ copy.ui.copyFallback }}</p><textarea :value="copy.copyAddressText" readonly rows="5" :aria-label="copy.ui.copyAddress" /></div>
    </ActionDialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { copy } from '../config/wedding'
import ActionDialog from './ActionDialog.vue'
const emit = defineEmits<{ 'open-change': [open: boolean] }>()
const manualDialog = ref<InstanceType<typeof ActionDialog>>()
const trigger = ref<HTMLButtonElement>()
const busy = ref(false)
const copied = ref(false)
async function copyAddress() {
  busy.value = true
  copied.value = false
  let needsManual = false
  try {
    if (!navigator.clipboard?.writeText) needsManual = true
    else {
      await navigator.clipboard.writeText(copy.copyAddressText)
      copied.value = true
    }
  } catch {
    // 已知权限边界：微信或用户拒绝自动复制时，提供可选择的原文。
    needsManual = true
  } finally { busy.value = false }
  if (needsManual) {
    // 等按钮解除 disabled 后再记录焦点，关闭弹层才能回到正确触发处。
    await nextTick()
    trigger.value?.focus()
    manualDialog.value?.show()
  }
}
</script>
