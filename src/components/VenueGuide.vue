<template>
  <section id="venue" class="venue-guide" aria-labelledby="venue-title">
    <h2 id="venue-title" class="sr-only">{{ copy.ui.venueHeading }}</h2>
    <div class="venue-address"><h3>{{ wedding.venue.name }}</h3><p>{{ wedding.venue.address }}</p></div>
    <figure class="venue-diagram">
      <img :src="mapUrl" alt="新饭店位于杨仙大道，周边道路非等比例示意，不表示楼栋入口或行车路线" width="480" height="342" loading="lazy" />
    </figure>
    <a class="button-primary" data-main-navigation :href="wedding.venue.mapUrl">{{ copy.ui.navigation }} <span aria-hidden="true">↗</span></a>
    <div class="secondary-actions"><CopyText /><a class="text-link" :href="wedding.contact.href">{{ copy.ui.contact }}</a></div>
    <p class="contact-number">{{ wedding.contact.name }} <a :href="wedding.contact.href">{{ wedding.contact.phone }}</a></p>
  </section>
</template>

<script setup lang="ts">
import { wedding, copy } from '../config/wedding'
import mapUrl from '../assets/venue-map.svg?url&no-inline'
import CopyText from './CopyText.vue'
</script>
