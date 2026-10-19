import type { GalleryBlock, PhotoChoice } from '../types'
import { wedding } from './wedding'

/** 调整照片与顺序只改此文件，然后运行 npm run photos:prepare。 */
export const coverPhoto: PhotoChoice = {
  file: '9.1032978.jpg', alt: '暖红色背景前，两人微笑挥手，新娘的婚纱完整展开', position: '50% 50%',
}
export const invitationPhoto: PhotoChoice = {
  file: '9.1032428.jpg', alt: '身着中式礼服的新人牵手站在红色背景前', position: '50% 50%',
}
export const gallery: GalleryBlock[] = [
  { id: 'two-smiles', layout: 'pair', caption: wedding.copy.portraitCaption, photos: [
    { file: '9.1032999.jpg', alt: '新郎看向镜头微笑，画面右侧是新娘递来的花束', position: '50% 50%' },
    { file: '9.1032993.jpg', alt: '新娘捂嘴微笑，画面左侧是新郎递来的花束', position: '50% 50%' },
  ] },
  { id: 'a-little-promise', layout: 'full', caption: '', photos: [
    { file: '9.1032698.jpg', alt: '灰色影棚里，新郎轻吻新娘的手，新娘侧身微笑', position: '50% 50%' },
  ] },
  { id: 'walk-together', layout: 'full', caption: wedding.copy.landscapeCaption, photos: [
    { file: '3R4A8900.jpg', alt: '开阔草地上，新郎朝新娘走去，长长的裙摆铺向右侧', position: '50% 50%' },
  ] },
  { id: 'ordinary-days', layout: 'inset', caption: wedding.copy.embraceCaption, photos: [
    { file: '3R4A9039.jpg', alt: '树叶间洒下阳光，新人在林间相拥', position: '50% 50%' },
  ] },
]
export const closingPhoto: PhotoChoice = {
  file: '3R4A9081.jpg', alt: '新人坐在林间长椅上，新娘轻捏新郎的脸，两人笑着看向镜头', position: '50% 50%',
}
export const selectedPhotos = [coverPhoto, invitationPhoto, ...gallery.flatMap((block) => block.photos), closingPhoto]
