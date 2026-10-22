import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// 将 HTML 已占用的等待时间传入开场，脚本迟到不能再重新等待五秒。
const openingStartedAt = Number(document.getElementById('app')!.dataset.startedAt)
createApp(App, { openingStartedAt }).mount('#app')
