<template>
  <div class="venue-route" :class="{ 'is-playing': isInView }">
    <!-- H5 省去图片顶部重复标题，仍沿用原图坐标以保持线路对齐。 -->
    <svg viewBox="0 145 1024 1317" role="img" aria-labelledby="venue-route-title venue-route-description">
      <title id="venue-route-title">新饭店与附楼四合院线路指引</title>
      <desc id="venue-route-description">上方展示新饭店周边位置，下方展示附楼线路。经斑马线过杨仙大道，沿公园弯路前往附楼四合院，朱砂色路线循环描绘。</desc>
      <image :href="overviewUrl" width="1024" height="1536" />
      <!-- 底图已去除固定红线；两层 SVG 共用同一路径，避免描线错位。 -->
      <defs>
        <path id="venue-walking-path"
        d="M477.5 1010 C479.3 1015 484 1028.3 488 1040 C492 1051.7 497.7 1068.3 501.5 1080 C505.3 1091.7 507.6 1101.7 511 1110 C514.4 1118.3 516.7 1124.2 522 1130 C527.3 1135.8 536.1 1140.8 543 1145 C549.9 1149.2 553 1152 563.5 1155 C574 1158 594.3 1160.8 606 1163 C617.7 1165.2 624.7 1165.2 633.5 1168 C642.3 1170.8 651.8 1174.7 659 1180 C666.2 1185.3 672.7 1193.3 676.5 1200 C680.3 1206.7 681.3 1213.3 682 1220 C682.8 1226.7 682 1233.3 681 1240 C680 1246.7 678.7 1253.3 676 1260 C673.3 1266.7 669.8 1273.3 665 1280 C660.2 1286.7 654.5 1293.9 647 1300 C639.5 1306.1 629.5 1312 620 1316.5 C610.5 1321 600 1324.4 590 1327 C580 1329.6 570 1331 560 1332 C550 1333 540 1333.2 530 1333 C520 1332.8 510 1332.1 500 1331 C490 1329.9 480 1328.3 470 1326.5 C460 1324.8 450 1322.9 440 1320.5 C430 1318.1 420.7 1315.1 410 1312 C399.3 1308.9 381.7 1303.7 376 1302"
        />
        <mask id="venue-route-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536">
          <use href="#venue-walking-path" class="route-reveal" fill="none" stroke="white" stroke-width="24" stroke-linecap="round" />
        </mask>
      </defs>
      <g ref="routeElement" class="route-lines" fill="none" stroke="#A93624" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <use href="#venue-walking-path" class="route-base" vector-effect="non-scaling-stroke" />
        <use href="#venue-walking-path" class="route-ink" vector-effect="non-scaling-stroke" mask="url(#venue-route-reveal)" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import overviewUrl from '../assets/venue-map-h5.webp'

const routeElement = ref<SVGGElement | null>(null)
// 只观察实际线路区域；离开视口暂停，系统减少动态效果时直接展示完整路线。
const isInView = ref(false)
let observer: IntersectionObserver | undefined

onMounted(() => {
  observer = new IntersectionObserver(entries => {
    isInView.value = entries.some(entry => entry.isIntersecting)
  }, { threshold: 0 })
  if (routeElement.value) observer.observe(routeElement.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.venue-route svg { display: block; width: 100%; height: auto; }
/* 底线常驻，遮罩按路径自身坐标描绘；线宽独立于地图缩放，手机上保持 2.5px。 */
.route-base { opacity: .28; }
/* 696.76 为收窄弯路后曲线的近似长度；调整路径时需同步重算。 */
.route-reveal { stroke-dasharray: 696.76; stroke-dashoffset: 696.76; animation: route-draw 7s linear infinite; animation-play-state: paused; }
.route-ink { animation: route-fade 7s linear infinite; animation-play-state: paused; }
.is-playing .route-reveal, .is-playing .route-ink { animation-play-state: running; }
/* 5 秒描完、1 秒停留、1 秒淡出；循环复位时深色线已透明。 */
@keyframes route-draw { 0% { stroke-dashoffset: 696.76; } 71.4286%, 100% { stroke-dashoffset: 0; } }
@keyframes route-fade { 0% { opacity: 0; } 2%, 85.7143% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .route-reveal { animation: none; stroke-dashoffset: 0; }
  .route-ink { animation: none; opacity: 1; }
}
</style>
