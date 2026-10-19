import type { WeddingConfig } from '../types'
import { isHttpsUrl } from './wedding'

export function locationIssues(config: WeddingConfig): string[] {
  const issues: string[] = []
  const { latitude, longitude, confirmed, coordinateSystem } = config.location
  if (!config.venueName.trim() || !config.venueAddress.trim()) issues.push('酒店详细地址')
  if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || coordinateSystem !== 'gcj02') issues.push('有效的 GCJ-02 坐标')
  if (!confirmed) issues.push('酒店入口位置确认')
  return issues
}

/** 优先使用新人确认的分享链接；未配置时按已知坐标或完整地址打开高德。 */
export function amapUrl(config: WeddingConfig): string {
  if (isHttpsUrl(config.mapShareUrl)) return config.mapShareUrl
  if (locationIssues(config).length) {
    if (!config.venueAddress.trim()) return ''
    return `https://uri.amap.com/search?${new URLSearchParams({
      keyword: config.venueAddress, view: 'map', callnative: '0', src: 'our-wedding',
    })}`
  }
  const { latitude, longitude } = config.location
  return `https://uri.amap.com/marker?${new URLSearchParams({
    position: `${longitude},${latitude}`, name: config.venueName,
    coordinate: 'gaode', callnative: '0', src: 'our-wedding',
  })}`
}
