<template>
  <section id="venue" class="venue-guide" aria-labelledby="venue-title">
    <div class="venue-address">
      <h2 id="venue-title" class="venue-label">{{ copy.ui.venueHeading }}</h2>
      <h3>{{ wedding.venue.name }}</h3>
      <p>{{ wedding.venue.address }}</p>
    </div>
    <figure class="venue-diagram">
      <VenueRoute />
    </figure>
    <a class="button-primary" data-main-navigation :href="wedding.venue.mapUrl">{{ copy.ui.navigation }} <span aria-hidden="true">↗</span></a>
    <div class="secondary-actions"><CopyText /><a class="text-link" :href="wedding.contact.href">{{ copy.ui.contact }}</a></div>
  </section>
</template>

<script setup lang="ts">
import { wedding, copy } from '../config/wedding'
import CopyText from './CopyText.vue'
import VenueRoute from './VenueRoute.vue'
</script>
