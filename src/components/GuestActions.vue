<template>
  <div class="guest-actions">
    <button class="button button-light" type="button" @click="open('calendar')">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16m-12 4h3m2 0h3" /></svg>
      设置提醒
    </button>
    <button class="button button-outline" type="button" @click="navigate">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></svg>
      导航前往
    </button>
  </div>

  <Teleport to="body">
    <dialog ref="dialog" class="action-dialog" aria-labelledby="action-title" @close="close" @click="onBackdrop">
      <div class="sheet-content">
        <div class="sheet-heading">
          <h2 id="action-title">{{ mode === 'calendar' ? '把这一天，留给我们' : '赴约的路，为你备好' }}</h2>
          <button type="button" class="close-button" aria-label="关闭" @click="dialog?.close()">×</button>
        </div>
        <template v-if="mode === 'calendar'">
          <p class="sheet-intro">{{ dateLabel(wedding.weddingDate) }}</p>
          <p>{{ wedding.ceremonyTime }} · {{ wedding.ceremonyVenue }}</p>
          <p class="sheet-intro">{{ wedding.copy.banquetLabel }} {{ wedding.banquetTime }} · {{ wedding.banquetVenue }}</p>
          <p v-if="missingCalendar.length" class="notice">{{ missingCalendar.join('、') }}尚待确认，请先复制婚礼信息。</p>
          <template v-else>
            <p class="sheet-note">建议提前一天、提前两小时提醒。保存后，请在日历中核对提醒时间并开启通知。</p>
            <p v-if="isWeChat" class="notice">请点右上角「···」，选择在{{ isIOS ? ' Safari ' : '浏览器' }}中打开，再保存日历。也可以复制下方信息，在手机日历中手动设置。</p>
            <template v-else>
              <a v-if="isIOS && subscriptionHref" class="button button-red" :href="subscriptionHref">订阅日历</a>
              <a class="button" :class="isIOS && subscriptionHref ? 'button-calendar-file' : 'button-red'" :href="calendarHref" download="婚礼提醒.ics" @click="downloadCalendar">下载日历</a>
              <a v-if="googleHref" class="list-link" :href="googleHref" target="_blank" rel="noopener noreferrer">Google 日历 <span aria-hidden="true">↗</span></a>
              <details class="reminder-help" :open="isIOS">
                <summary>iPhone 如何设置</summary>
                <p>可通过「订阅日历」打开系统日历并确认订阅。下载的文件也可以作为邮件附件发送给自己，在苹果「邮件」中打开并导入。</p>
                <p>若没有出现添加入口，请复制下方信息，在「日历」中点「＋」新建日程，并设置提醒。</p>
              </details>
              <details class="reminder-help" :open="isAndroid">
                <summary>安卓手机如何设置</summary>
                <p>下载后用支持导入的日历应用打开。不同手机的日历功能不同；若没有添加入口，请复制下方信息，在手机日历中新建日程，并设置提醒。</p>
              </details>
            </template>
          </template>
          <p v-if="downloadMessage" role="status" class="feedback">{{ downloadMessage }}</p>
          <div class="manual-reminder">
            <h3>手动设置</h3>
            <p class="sheet-note">在手机日历中新建 {{ dateLabel(wedding.weddingDate) }} {{ wedding.ceremonyTime }} 的日程，粘贴婚礼信息，再选择提醒时间。</p>
            <CopyText :text="eventText(wedding)" label="复制婚礼信息" />
          </div>
        </template>
        <template v-else>
          <p class="sheet-intro">{{ wedding.venueName }}</p>
          <p>{{ wedding.venueAddress || '酒店详细地址待确认' }}</p>
          <p class="sheet-intro">仪式 {{ wedding.ceremonyTime }} · {{ wedding.ceremonyVenue }}<br>{{ wedding.copy.banquetLabel }} {{ wedding.banquetTime }} · {{ wedding.banquetVenue }}</p>
          <p v-if="isWeChat" class="notice">微信内置定位尚未开通，暂时无法直接打开微信位置。可先复制下方地址使用。</p>
          <CopyText v-if="wedding.venueAddress" :text="`${wedding.venueName}\n${wedding.venueAddress}`" label="复制婚礼地址" />
        </template>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { wedding } from '../config/wedding'
import { calendarIssues, dateLabel, eventText } from '../lib/wedding'
import { googleCalendarUrl } from '../lib/calendar'
import { amapUrl } from '../lib/maps'
import CopyText from './CopyText.vue'

/** calendar：日历操作；map：导航未就绪提示与地址复制；null：尚未打开。 */
const mode = ref<'calendar' | 'map' | null>(null)
const dialog = ref<HTMLDialogElement>()
const missingCalendar = computed(() => calendarIssues(wedding))
const amapHref = computed(() => amapUrl(wedding))
const isWeChat = /MicroMessenger/i.test(navigator.userAgent)
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isAndroid = /Android/i.test(navigator.userAgent)
const googleHref = computed(() => googleCalendarUrl(wedding))
// 使用部署目录下的实际文件，保留子路径部署能力；本地 HTTP 不提供订阅入口。
const calendarHref = new URL(`${import.meta.env.BASE_URL}wedding.ics`, window.location.href).href
const subscriptionHref = calendarHref.startsWith('https://') ? calendarHref.replace(/^https:/, 'webcal:') : ''
const downloadMessage = ref('')
let previousOverflow = ''

function navigate() {
  // 微信原生定位依赖待确认的公众号签名服务，不用腾讯网页冒充，也不绕过 SDK 鉴权。
  if (isWeChat || !amapHref.value) {
    open('map')
    return
  }
  window.location.assign(amapHref.value)
}

function open(nextMode: 'calendar' | 'map') {
  mode.value = nextMode
  downloadMessage.value = ''
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
}
function close() {
  document.body.style.overflow = previousOverflow
  mode.value = null
}
function onBackdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return
  const rect = dialog.value.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.value.close()
}
function downloadCalendar() {
  downloadMessage.value = '请打开文件并在日历中确认保存；下载文件不会自动设置提醒。'
}
onBeforeUnmount(() => {
  if (mode.value) document.body.style.overflow = previousOverflow
})
</script>
