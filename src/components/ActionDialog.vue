<template>
  <Teleport to="body">
    <dialog ref="element" class="action-dialog" :aria-labelledby="titleId" @close="onClose" @click="onBackdrop">
      <header class="dialog-header"><h2 :id="titleId">{{ title }}</h2><button type="button" autofocus @click="close">{{ copy.ui.close }} <span aria-hidden="true">×</span></button></header>
      <slot />
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useId } from 'vue'
import { copy } from '../config/wedding'
defineProps<{ title: string }>()
const emit = defineEmits<{ 'open-change': [open: boolean] }>()
const element = ref<HTMLDialogElement>()
const titleId = useId()
let opener: HTMLElement | null = null
let previousOverflow = ''
let opened = false
/** 仅用户触发时打开；关闭后恢复触发控件的焦点和原滚动样式。 */
function show() {
  if (!element.value || opened) return
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  element.value.showModal()
  opened = true
  document.body.style.overflow = 'hidden'
  emit('open-change', true)
}
function close() { element.value?.close() }
function onClose() {
  if (!opened) return
  opened = false
  document.body.style.overflow = previousOverflow
  emit('open-change', false)
  opener?.focus({ preventScroll: true })
}
function onBackdrop(event: MouseEvent) {
  if (event.target !== element.value) return
  const rect = element.value.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
}
onBeforeUnmount(() => { if (opened) document.body.style.overflow = previousOverflow })
defineExpose({ show, close })
</script>
