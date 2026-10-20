import plan from '../../config/selection-plan.json'
import type { PhotoChoice } from '../types'

const descriptions: Record<string, string> = {
  cover: '暖红背景前，两人微笑挥手，新娘的婚纱完整展开',
  rings: '两人举起戒指，面向镜头开怀微笑',
  'response-groom': '新郎微笑，画面右侧伸来的手递上花束',
  'response-bride': '新娘捂嘴微笑，画面左侧的手递上花束',
  quiet: '灰色背景前，新郎轻吻新娘的手，新娘微笑注视他',
  closing: '两人在暖红背景前靠近微笑，新娘手持花束',
  'formal-main': '中式礼服的新人牵手站立，新娘手持团扇',
  'formal-fallback': '暖红背景前，新人站立合影，婚纱裙摆完整展开',
}
export const selectedPhotos: PhotoChoice[] = plan.selected.map(item => ({ id: item.id, file: item.file, alt: descriptions[item.id]! }))
export function photoById(id: string): PhotoChoice {
  const photo = selectedPhotos.find(item => item.id === id)
  if (!photo) throw new Error(`选片配置缺少 ${id}`)
  return photo
}
export const coverPhoto = photoById('cover')
export const closingPhoto = photoById('closing')
