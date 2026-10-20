import QRCode from 'qrcode'
import sharp from 'sharp'
import jsQR from 'jsqr'
import { writeFile } from 'node:fs/promises'
import { wedding } from './content'
import tokens from '../../config/design-tokens.json'

export interface QrBounds { left: number; top: number; width: number; height: number }
export async function decodeQr(input: string | Buffer, bounds?: QrBounds): Promise<string> {
  const pipeline = sharp(input)
  if (bounds) pipeline.extract(bounds)
  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  if (!result) throw new Error(`二维码无法解码：${typeof input === 'string' ? input : '内存图像'}`)
  return result.data
}

/** 圆润外角保留相邻码点的连接；三个定位框独立描绘，保留7:5:3模块结构和静区。 */
function roundedQrSvg(matrix: ReturnType<typeof QRCode.create>, margin: number, scale: number): string {
  const size = matrix.modules.size
  const extent = size + margin * 2
  const finders: [number, number][] = [[0, 0], [size - 7, 0], [0, size - 7]]
  const dark = (x: number, y: number) => x >= 0 && y >= 0 && x < size && y < size && matrix.modules.get(y, x)
  const shapes: string[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!dark(x, y) || finders.some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7)) continue
      shapes.push(`<rect x="${x}" y="${y}" width="1" height="1" rx=".28"/>`)
      if (dark(x + 1, y)) shapes.push(`<rect x="${x + .5}" y="${y}" width="1" height="1"/>`)
      if (dark(x, y + 1)) shapes.push(`<rect x="${x}" y="${y + .5}" width="1" height="1"/>`)
    }
  }
  for (const [x, y] of finders) {
    shapes.push(`<rect x="${x}" y="${y}" width="7" height="7" rx="1.3"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx=".85" fill="${tokens.colors.qrLight}"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".55"/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${extent * scale}" height="${extent * scale}" viewBox="0 0 ${extent} ${extent}"><rect width="${extent}" height="${extent}" fill="${tokens.colors.qrLight}"/><g transform="translate(${margin} ${margin})" fill="${tokens.colors.qrDark}">${shapes.join('')}</g></svg>`
}

/** 母版和分享版按各自最终尺寸生成，圆角仅在轮廓边缘抗锯齿，不缩放母版码图。 */
export async function generateQrs(directory: string, outputWidth = tokens.layout.posterExportWidth) {
  const codes = []
  for (const item of wedding.qr) {
    const matrix = QRCode.create(item.url, { errorCorrectionLevel: 'M' })
    const margin = tokens.qr.quietZoneModules
    const ratio = outputWidth / 1080
    const scale = Math.floor(tokens.qr.targetPrintedBoxPx[1]! * ratio / (matrix.modules.size + margin * 2))
    if (scale < tokens.qr.minModulePxAt1080 * ratio) throw new Error('二维码模块过密，需要重新评估布局')
    const pixels = (matrix.modules.size + margin * 2) * scale
    const artwork = roundedQrSvg(matrix, margin, scale)
    const buffer = await sharp(Buffer.from(artwork)).png().toBuffer()
    if (await decodeQr(buffer) !== item.url) throw new Error('源二维码载荷错误')
    const png = `${directory}/qr-${item.id}.png`
    const svg = `${directory}/qr-${item.id}.svg`
    await writeFile(png, buffer)
    await writeFile(svg, artwork)
    codes.push({ ...item, pixels, modules: matrix.modules.size, scale, margin, png, svg, buffer })
  }
  return codes
}
