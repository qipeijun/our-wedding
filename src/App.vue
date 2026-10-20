<template>
  <main ref="invitation" class="invitation" @click.capture="pauseMusicForDeparture">
    <BackgroundMusic v-if="wedding.backgroundMusic" v-show="!modalOpen" ref="backgroundMusic" />
    <section id="top" ref="coverSection" class="cover" aria-label="婚礼封面">
      <div class="hero-photo">
        <WeddingPhoto :photo="coverPhoto" priority />
        <header class="hero-heading" :class="{ 'is-ready': titleArtworkReady || titleArtworkFailed }">
          <h1>
            <span :class="{ 'sr-only': !titleArtworkFailed }">{{ copy.h5.title }}</span>
            <img v-if="!titleArtworkFailed" :src="titleArtwork" alt="" width="2062" height="763" fetchpriority="high" decoding="async" @load="titleArtworkReady = true" @error="titleArtworkFailed = true" />
          </h1>
        </header>
      </div>
      <div class="cover-invite">
        <p class="couple-names"><span>{{ wedding.couple.groom }}</span><b aria-hidden="true">＆</b><span>{{ wedding.couple.bride }}</span></p>
        <div class="cover-details">
          <div class="date-band">
            <p class="date-main"><time :datetime="wedding.date.iso">{{ wedding.dateMain }}</time></p>
            <p class="date-secondary">{{ wedding.date.weekday }}<span aria-hidden="true"> · </span>{{ wedding.venue.areaLabel }}{{ wedding.venue.name }}</p>
          </div>
          <a class="jump-link" href="#schedule"><span>{{ copy.ui.jumpToDetails }}</span><span class="arrow-circle" aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>

    <section class="welcome" aria-labelledby="welcome-title">
      <div class="welcome-heading section-pad reveal">
        <p class="small-label">{{ copy.h5.welcomeLabel }}</p>
        <h2 id="welcome-title"><span v-for="line in copy.h5.welcomeTitle" :key="line">{{ line }}</span></h2>
        <svg class="ring-mark" viewBox="0 0 90 70" fill="none" aria-hidden="true"><ellipse cx="34" cy="37" rx="22" ry="27" transform="rotate(-24 34 37)" /><ellipse cx="57" cy="37" rx="22" ry="27" transform="rotate(24 57 37)" /></svg>
      </div>
      <figure class="rings-photo reveal"><WeddingPhoto :photo="photoById('rings')" /></figure>
      <div class="invitation-copy section-pad reveal"><p v-for="paragraph in copy.h5.invitationParagraphs" :key="paragraph">{{ paragraph }}</p></div>
    </section>

    <section class="response-section" aria-label="我们的婚纱照">
      <div class="response-heading section-pad reveal"><h2>{{ copy.h5.responseTitle }}</h2></div>
      <div class="response-pair">
        <figure class="response-photo response-groom reveal"><WeddingPhoto :photo="photoById('response-groom')" sizes="(min-width: 560px) 459px, 82vw" /></figure>
        <figure class="response-photo response-bride reveal"><WeddingPhoto :photo="photoById('response-bride')" sizes="(min-width: 560px) 459px, 82vw" /></figure>
      </div>
      <div class="quiet-photo reveal"><WeddingPhoto :photo="photoById('quiet')" /></div>
    </section>

    <section id="schedule" class="event-section" aria-labelledby="schedule-title">
      <header class="event-heading section-pad reveal"><p class="small-label">{{ copy.ui.scheduleHeading }}</p><h2 id="schedule-title">{{ copy.h5.scheduleTitle }}</h2></header>
      <div class="event-paper">
        <div class="event-date"><time :datetime="wedding.date.iso">{{ wedding.dateMain }}</time><p>{{ wedding.date.weekday }}<span aria-hidden="true"> · </span>{{ wedding.date.lunarFull }}</p></div>
        <ScheduleList />
        <VenueGuide @open-change="modalOpen = $event" />
      </div>
    </section>

    <footer class="closing-section">
      <div class="closing-photo reveal"><WeddingPhoto :photo="closingPhoto" /></div>
      <div class="closing-copy section-pad"><p class="small-label">{{ copy.h5.closingLabel }}</p><h2>{{ copy.h5.closing }}</h2><p class="closing-names">{{ wedding.couple.displayName }}</p><a class="back-top" href="#top">{{ copy.ui.backToTop }} <span aria-hidden="true">↑</span></a></div>
    </footer>

    <nav v-show="showNavigation" class="sticky-navigation" :aria-hidden="!showNavigation" aria-label="快捷到场导航">
      <a class="sticky-details" href="#schedule"><span>{{ shortDate }} · {{ wedding.venue.name }}</span><small>{{ copy.ui.scheduleHeading }} ↑</small></a>
      <a class="button-primary" :href="wedding.venue.mapUrl">{{ copy.ui.navigation }} <span aria-hidden="true">↗</span></a>
    </nav>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { wedding, copy } from './config/wedding'
import { coverPhoto, closingPhoto, photoById } from './config/photos'
import WeddingPhoto from './components/WeddingPhoto.vue'
import ScheduleList from './components/ScheduleList.vue'
import VenueGuide from './components/VenueGuide.vue'
import BackgroundMusic from './components/BackgroundMusic.vue'

const invitation = ref<HTMLElement>()
const backgroundMusic = ref<InstanceType<typeof BackgroundMusic>>()
/** 在导航或拨号交给外部应用前暂停；页内跳转与普通点击不改变音乐选择。 */
function pauseMusicForDeparture(event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  const href = event.target.closest('a')?.getAttribute('href')
  if (href === wedding.venue.mapUrl || href === wedding.contact.href) backgroundMusic.value?.pause()
}
const coverSection = ref<HTMLElement>()
const pastCover = ref(false)
const modalOpen = ref(false)
const mainNavigationVisible = ref(false)
// 标题素材加载失败时显示同一文案的可读字形，仍能识别邀请主题。
const titleArtworkFailed = ref(false)
// 等待素材加载后才播放标题入场，慢网下不会提前消耗掉开场动画。
const titleArtworkReady = ref(false)
const showNavigation = computed(() => pastCover.value && !modalOpen.value && !mainNavigationVisible.value)
const titleArtwork = `${import.meta.env.BASE_URL}artwork/wedding-title.webp`
const shortDate = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', timeZone: wedding.date.timeZone }).format(new Date(`${wedding.date.iso}T12:00:00+08:00`))
let coverObserver: IntersectionObserver | undefined
let revealObserver: IntersectionObserver | undefined
let navigationObserver: IntersectionObserver | undefined

onMounted(() => {
  // 观察器只增强导航与入场表现，正文默认可见，不依赖动画完成才能阅读。
  if (!('IntersectionObserver' in window) || !coverSection.value) return
  coverObserver = new IntersectionObserver(([entry]) => {
    pastCover.value = !!entry && !entry.isIntersecting && entry.boundingClientRect.bottom <= 0
  })
  coverObserver.observe(coverSection.value)
  const mainNavigation = invitation.value?.querySelector('[data-main-navigation]')
  if (mainNavigation) {
    // 正文导航进入可操作区域后收起固定栏，避免重复入口遮住联系人。
    navigationObserver = new IntersectionObserver(([entry]) => {
      mainNavigationVisible.value = !!entry && entry.isIntersecting
    }, { rootMargin: '0px 0px -84px 0px', threshold: 0 })
    navigationObserver.observe(mainNavigation)
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-revealed')
      revealObserver?.unobserve(entry.target)
    }
  }, { threshold: 0.12 })
  invitation.value?.querySelectorAll('.reveal').forEach(element => revealObserver?.observe(element))
})
onBeforeUnmount(() => {
  coverObserver?.disconnect()
  revealObserver?.disconnect()
  navigationObserver?.disconnect()
})
</script>
