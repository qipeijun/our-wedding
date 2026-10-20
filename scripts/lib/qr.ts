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

/** 按矩阵模块数确定整数尺寸；浅底与码点按最新用户要求统一为米白与深棕。 */
export async function generateQrs(directory: string) {
  const codes = []
  for (const item of wedding.qr) {
    const matrix = QRCode.create(item.url, { errorCorrectionLevel: 'M' })
    const margin = tokens.qr.quietZoneModules
    const scale = Math.floor(tokens.qr.targetPrintedBoxPx[1]! / (matrix.modules.size + margin * 2))
    if (scale < tokens.qr.minModulePxAt1080) throw new Error('二维码模块过密，需要重新评估布局')
    const pixels = (matrix.modules.size + margin * 2) * scale
    const options = { margin, scale, errorCorrectionLevel: 'M' as const, color: { dark: tokens.colors.qrDark, light: tokens.colors.qrLight } }
    const buffer = await QRCode.toBuffer(item.url, options)
    if (await decodeQr(buffer) !== item.url) throw new Error('源二维码载荷错误')
    const png = `${directory}/qr-${item.id}.png`
    const svg = `${directory}/qr-${item.id}.svg`
    await writeFile(png, buffer)
    await writeFile(svg, await QRCode.toString(item.url, { ...options, type: 'svg' }))
    codes.push({ ...item, pixels, modules: matrix.modules.size, scale, margin, png, svg, buffer })
  }
  return codes
}
