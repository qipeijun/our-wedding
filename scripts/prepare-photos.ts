import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { selectedPhotos } from '../src/config/photos'

await mkdir('public/photos', { recursive: true })
await mkdir('src/generated', { recursive: true })
const manifest: Record<string, { width: number; height: number; widths: number[]; stem: string }> = {}
for (const photo of selectedPhotos) {
  const source = `source/${photo.file}`
  const meta = await sharp(source).metadata()
  const { width, height } = meta.autoOrient
  const stem = photo.file.replace(/\.[^.]+$/, '')
  const widths = [480, 800, 1200].filter((size) => size <= width)
  for (const size of widths) {
    // 只做方向校正、sRGB 转换及等比缩放，不裁切、不修脸、不加滤镜；默认移除 EXIF。
    await sharp(source).rotate().resize({ width: size }).toColourspace('srgb').webp({ quality: 86 }).toFile(`public/photos/${stem}-${size}.webp`)
  }
  await sharp(source).rotate().resize({ width: 1200, withoutEnlargement: true }).toColourspace('srgb').jpeg({ quality: 88, mozjpeg: true }).toFile(`public/photos/${stem}-1200.jpg`)
  manifest[photo.file] = { width, height, widths, stem }
}
await writeFile('src/generated/photos.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(`已生成 ${Object.keys(manifest).length} 张照片的移动端版本；source 原图未修改。`)
