import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { selectedPhotos } from '../../src/config/photos'

/** 从已确认的原片生成轻量预览，保留构图；手写标题只缩放原素材，不重新排字。 */
export async function prepareLoadingAssets() {
  await mkdir('src/assets', { recursive: true })
  await mkdir('public/photos', { recursive: true })
  const retained: string[] = []
  for (const photo of selectedPhotos.filter(item => !item.id.startsWith('formal-'))) {
    const name = `${photo.file.replace(/\.[^.]+$/, '')}-preview.webp`
    const destination = photo.id === 'cover' ? 'src/assets/cover-preview.webp' : `public/photos/${name}`
    await sharp(`source/${photo.file}`).rotate().resize({ width: 480 }).toColourspace('srgb').webp({ quality: 64 }).toFile(destination)
    if (photo.id !== 'cover') retained.push(name)
  }
  await sharp('public/artwork/wedding-title.webp').resize({ width: 824 }).png({ palette: true, quality: 90, dither: 0, compressionLevel: 9 }).toFile('src/assets/wedding-title.png')
  return retained
}
