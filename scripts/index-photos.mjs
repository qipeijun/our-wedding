import sharp from 'sharp'
import { mkdir, readdir, writeFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'

await mkdir('docs/assets/thumbnails', { recursive: true })
const files = (await readdir('source')).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).sort()
const inventory = []
for (const [index, file] of files.entries()) {
  const input = `source/${file}`
  const meta = await sharp(input).metadata()
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(input)) hash.update(chunk)
  const thumbnail = `docs/assets/thumbnails/${file.replace(/\.[^.]+$/, '.jpg')}`
  await sharp(input).rotate().resize({ width: 700, height: 700, fit: 'inside' }).jpeg({ quality: 86 }).toFile(thumbnail)
  inventory.push({ index: index + 1, file, width: meta.autoOrient.width, height: meta.autoOrient.height,
    ratio: Number((meta.autoOrient.width / meta.autoOrient.height).toFixed(4)), format: meta.format,
    bytes: (await stat(input)).size, sha256: hash.digest('hex'), thumbnail })
}
await writeFile('docs/assets/inventory.json', JSON.stringify(inventory, null, 2) + '\n')
for (let start = 0; start < inventory.length; start += 12) {
  const batch = inventory.slice(start, start + 12)
  const overlays = []
  for (const [i, item] of batch.entries()) {
    const left = (i % 4) * 320
    const top = Math.floor(i / 4) * 370
    const image = await sharp(item.thumbnail).resize(304, 324, { fit: 'contain', background: '#eee8df' }).toBuffer()
    overlays.push({ input: image, left: left + 8, top: top + 8 })
    const label = `<svg width="320" height="36"><text x="12" y="23" font-family="sans-serif" font-size="16" fill="#302923">${item.index}. ${item.file} · ${item.width}×${item.height}</text></svg>`
    overlays.push({ input: Buffer.from(label), left, top: top + 334 })
  }
  await sharp({ create: { width: 1280, height: Math.ceil(batch.length / 4) * 370, channels: 3, background: '#eee8df' } })
    .composite(overlays).jpeg({ quality: 91 }).toFile(`docs/assets/contact-sheet-${Math.floor(start / 12) + 1}.jpg`)
}
console.log(`已索引 ${inventory.length} 张原图；尺寸、SHA-256、缩略图及联系表已保存至 docs/assets。`)
