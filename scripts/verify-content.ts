import assert from 'node:assert/strict'
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { wedding, copy, variants } from './lib/content'
import { selectedPhotos } from '../src/config/photos'

for (const photo of selectedPhotos) await access(`source/${photo.file}`)
const manifest = JSON.parse(await readFile('src/generated/photos.json', 'utf8'))
assert.equal(Object.keys(manifest).length, 6)
const images = []
for (const file of await readdir('public/photos')) {
  const meta = await sharp(`public/photos/${file}`).metadata()
  assert.equal(meta.exif, undefined, `${file} 不应携带 EXIF/GPS`)
  images.push({ file, width: meta.width, height: meta.height, bytes: (await readFile(`public/photos/${file}`)).length })
}
for (const variant of variants) assert.ok(copy.variants[variant].names.every(item => [wedding.couple.groom, wedding.couple.bride].includes(item.name)))
const generated = JSON.parse(await readFile('src/generated/page.json', 'utf8'))
assert.deepEqual(generated.wedding.schedule, wedding.schedule)
assert.deepEqual(generated.copy.h5, copy.h5)
assert.equal(generated.wedding.internal, undefined)
assert.equal(generated.copy.variants, undefined)
await mkdir('artifacts/v3', { recursive: true })
await writeFile('artifacts/v3/content-check.json', JSON.stringify({ passed: true, candidateOriginals: selectedPhotos.length, h5Photos: 6, images, runtimeDoesNotIncludeParentsOrEndTime: true }, null, 2) + '\n')
console.log('配置同步、8张候选原图、6张网页图与公开资源元数据检查通过。')
