import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { selectedPhotos } from '../src/config/photos'
import priorInventory from '../docs/assets/inventory.json'
import reviewData from '../config/photo-review.json'
const reviews: Record<string, { sha256: string; viewedOn: string; actuallyViewed: boolean }> = reviewData

await mkdir('public/photos', { recursive: true })
await mkdir('src/generated', { recursive: true })
await mkdir('docs/v2', { recursive: true })
const h5Photos = selectedPhotos.filter(photo => !photo.id.startsWith('formal-'))
const manifest: Record<string, { width: number; height: number; widths: number[]; stem: string }> = {}
const inventory = []
const mapping = []
const retained = new Set<string>()
for (const file of (await readdir('source')).filter(file => /\.jpe?g$/i.test(file)).sort()) {
  const bytes = await readFile(`source/${file}`)
  const meta = await sharp(bytes).metadata()
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const prior = priorInventory.find(item => item.file === file)
  if (prior && prior.sha256 !== sha256) throw new Error(`原图 ${file} 与档案哈希不一致，请复核`)
  inventory.push({ file, width: meta.width, height: meta.height, format: meta.format, orientation: meta.orientation ?? 1, bytes: bytes.length, sha256, matchesPrior: prior?.sha256 === sha256 })
  const selected = selectedPhotos.find(item => item.file === file)
  if (!selected) continue
  const review = reviews[file]
  if (!review?.actuallyViewed || review.sha256 !== sha256) throw new Error(`照片 ${file} 缺少与原文件哈希一致的人工复核记录`)
  const outputs = []
  const { width, height } = meta.autoOrient
  const stem = file.replace(/\.[^.]+$/, '')
  if (h5Photos.some(photo => photo.file === file)) {
    // 430px、3倍屏幕可选1600px原片衍生图，避免高密度手机放大1200px版本。
    const widths = [480, 800, 1200, 1600].filter(size => size <= width)
    for (const size of widths) {
      const name = `${stem}-${size}.webp`
      // 正确应用方向、转换 sRGB 后编码；不裁切、不重绘，默认清除 EXIF/GPS。
      const info = await sharp(bytes).rotate().resize({ width: size }).toColourspace('srgb').webp({ quality: 88 }).toFile(`public/photos/${name}`)
      outputs.push({ path: `public/photos/${name}`, width: info.width, height: info.height, bytes: info.size })
      retained.add(name)
    }
    const name = `${stem}-1200.jpg`
    const info = await sharp(bytes).rotate().resize({ width: 1200, withoutEnlargement: true }).toColourspace('srgb').jpeg({ quality: 90, mozjpeg: true }).toFile(`public/photos/${name}`)
    retained.add(name)
    outputs.push({ path: `public/photos/${name}`, width: info.width, height: info.height, bytes: info.size })
    manifest[file] = { width, height, widths, stem }
  }
  mapping.push({ ...selected, sha256, width, height, originalActuallyViewed: review.actuallyViewed, reviewDate: review.viewedOn, crop: 'none', focalPosition: 'not needed: intrinsic ratio', selected: selected.id !== 'formal-fallback', status: selected.id === 'formal-fallback' ? '备用，未使用' : '已选用', outputs, reason: selected.id.startsWith('formal') ? '中式牵手合影保留团扇、衣饰与完整人物；备用图未启用' : '执行包确定的六张照片之一；原比例保留神态和手部，不叠加滤镜' })
}
// 旧轮次的网页衍生图移到本地留档，避免随生产构建发布未选用照片。
await mkdir('artifacts/v2/retired-photos', { recursive: true })
for (const file of await readdir('public/photos')) {
  if (!retained.has(file)) await rename(`public/photos/${file}`, `artifacts/v2/retired-photos/${file}`)
}
await writeFile('src/generated/photos.json', JSON.stringify(manifest, null, 2) + '\n')
await writeFile('docs/v2/source-inventory.json', JSON.stringify(inventory, null, 2) + '\n')
await writeFile('docs/v2/photo-selection.json', JSON.stringify(mapping, null, 2) + '\n')
console.log(`实到 ${inventory.length} 张原图；核对 ${mapping.length} 张候选，网页输出 ${Object.keys(manifest).length} 张。`)
