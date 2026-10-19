<template>
  <main id="top" class="invitation">
    <section class="cover" aria-label="婚礼封面">
      <div class="cover-image">
        <WeddingPhoto :photo="coverPhoto" priority />
        <div class="cover-title">
          <h1 v-if="wedding.titleStyle === 'xi'" class="xi" aria-label="囍" :style="{ backgroundImage: `url(${doubleHappiness})` }"></h1>
          <h1 v-else class="cover-text-title">{{ wedding.copy.coverSubtitle }}</h1>
          <p class="cover-names"><span class="cover-groom">{{ wedding.groomName || '新郎姓名' }}</span><span aria-hidden="true"> · </span><span class="cover-bride">{{ wedding.brideName || '新娘姓名' }}</span></p>
          <p class="cover-date"><time :datetime="wedding.weddingDate">{{ dateLabel(wedding.weddingDate) }}</time></p>
        </div>
      </div>
      <div class="cover-footer">
        <p class="cover-venue">{{ wedding.venueName }}</p>
        <div class="cover-schedule">
          <p><span><time>{{ wedding.ceremonyTime }}</time> 仪式</span><span>{{ wedding.ceremonyVenue }}</span></p>
          <p v-if="isTime(wedding.banquetTime)"><span><time>{{ wedding.banquetTime }}</time> {{ wedding.copy.banquetLabel }}</span><span>{{ wedding.banquetVenue }}</span></p>
        </div>
        <GuestActions navigation-only />
      </div>
    </section>

    <section id="invitation" class="invitation-section section-pad" aria-labelledby="invitation-title">
      <h2 id="invitation-title">{{ wedding.copy.invitationHeading }}</h2>
      <p class="invitation-copy">{{ wedding.invitationText }}</p>
      <div class="invitation-composition">
        <WeddingPhoto :photo="invitationPhoto" sizes="(min-width: 600px) 280px, 52vw" />
        <div class="invitation-aside">
          <p class="vertical-wish">谨备喜筵<br />恭请光临</p>
          <p>{{ wedding.venueName }}</p>
          <a href="#details">查看婚礼安排 <span aria-hidden="true">↙</span></a>
        </div>
      </div>
    </section>

    <section class="gallery-section" aria-labelledby="gallery-title">
      <header class="section-pad gallery-heading">
        <p class="eyebrow">关于我们</p>
        <h2 id="gallery-title">{{ wedding.copy.galleryHeading }}</h2>
        <p>{{ wedding.copy.galleryIntro }}</p>
      </header>
      <figure v-for="block in gallery" :key="block.id" class="gallery-block" :class="`gallery-${block.layout}`">
        <div class="gallery-photos">
          <WeddingPhoto v-for="photo in block.photos" :key="photo.file" :photo="photo"
            :sizes="block.layout === 'pair' ? '(min-width: 600px) 252px, 44vw' : block.layout === 'inset' ? '(min-width: 600px) 330px, 59vw' : '(min-width: 600px) 560px, 100vw'" />
        </div>
        <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
      </figure>
    </section>

    <section id="details" class="details-section section-pad" aria-labelledby="details-title">
      <p class="eyebrow">良辰 · 喜宴</p>
      <h2 id="details-title">{{ wedding.copy.venueHeading }}</h2>
      <div class="date-display">
        <p v-if="isDate(wedding.weddingDate)" class="date-numerals">{{ wedding.weddingDate.replaceAll('-', '.') }}</p>
        <p v-else class="date-pending">好日子，敬待公布</p>
        <p>{{ isDate(wedding.weddingDate) ? dateLabel(wedding.weddingDate) : '婚礼日期与仪式时间待确认' }}</p>
      </div>
      <dl class="event-times">
        <div><dt>婚礼仪式</dt><dd>{{ isTime(wedding.ceremonyTime) ? wedding.ceremonyTime : '时间待确认' }}<small>{{ wedding.ceremonyVenue }}</small></dd></div>
        <div v-if="wedding.banquetTime"><dt>{{ wedding.copy.banquetLabel }}开席</dt><dd>{{ isTime(wedding.banquetTime) ? wedding.banquetTime : '时间待确认' }}<small>{{ wedding.banquetVenue }}</small></dd></div>
      </dl>
      <div class="venue">
        <p class="eyebrow">婚礼地点</p>
        <h3>{{ wedding.venueName }}</h3>
        <p>{{ wedding.venueRegion }}</p>
        <p class="venue-address">{{ wedding.venueAddress || '详细地址与入场位置待确认' }}</p>
      </div>
      <figure class="venue-map">
        <a :href="venueMapUrl" target="_blank" rel="noopener" aria-label="查看婚礼地点周边示意图大图" v-html="venueMap"></a>
      </figure>
      <GuestActions />
      <p class="details-note">珍重每一份心意，期待每一位到来。</p>
    </section>

    <footer class="closing-section">
      <WeddingPhoto :photo="closingPhoto" />
      <div class="closing-copy section-pad">
        <p class="eyebrow">有你在，喜悦才圆满</p>
        <h2>{{ wedding.closingText }}</h2>
        <p>{{ wedding.copy.closingThanks }}</p>
        <p class="closing-names">{{ coupleLabel(wedding) }}</p>
        <a class="back-top" href="#top">回到开头 <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { wedding } from './config/wedding'
import { coverPhoto, invitationPhoto, gallery, closingPhoto } from './config/photos'
import { coupleLabel, dateLabel, isDate, isTime } from './lib/wedding'
import WeddingPhoto from './components/WeddingPhoto.vue'
import GuestActions from './components/GuestActions.vue'
import doubleHappiness from './assets/double-happiness-brush.webp'
// 受版本管理的本地 SVG，无外部或用户输入的 HTML。
import venueMap from './assets/venue-map.svg?raw'
// 保留独立文件，确保小于内联阈值的 SVG 仍可在新标签页打开。
import venueMapUrl from './assets/venue-map.svg?url&no-inline'
</script>
