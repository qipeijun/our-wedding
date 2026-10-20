<template>
  <dl class="schedule-list">
    <div v-for="item in wedding.schedule" :key="item.id" class="schedule-row">
      <dt><time>{{ item.time }}</time></dt>
      <dd>{{ item.title }}<span v-if="item.location" class="schedule-location">{{ item.location }}</span></dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { wedding } from '../config/wedding'
</script>
