/** 婚礼信息为空时保持待确认状态，不推测正式信息。 */
export interface WeddingConfig {
  groomName: string
  brideName: string
  weddingDate: string
  ceremonyTime: string
  /** 仪式所在楼栋或宴会厅，与酒店完整地址分开维护。 */
  ceremonyVenue: string
  banquetTime: string
  /** 宴席所在楼栋或宴会厅。 */
  banquetVenue: string
  /** 留空时仅生成赴约时刻提醒，不推测婚礼时长。 */
  endTime: string
  /** 跨日活动可填写结束日期；留空表示婚礼当天。 */
  endDate: string
  venueName: string
  venueRegion: string
  venueAddress: string
  location: {
    latitude: number | null
    longitude: number | null
    /** 统一采用高德/腾讯的 GCJ-02 坐标；不接受未经核实的 GPS/百度坐标。 */
    coordinateSystem: 'gcj02'
    /** 确认坐标确实指向酒店入口后才置为 true。 */
    confirmed: boolean
  }
  invitationText: string
  closingText: string
  copy: {
    banquetLabel: string
    coverSubtitle: string
    invitationHeading: string
    galleryHeading: string
    galleryIntro: string
    portraitCaption: string
    landscapeCaption: string
    embraceCaption: string
    venueHeading: string
    closingThanks: string
  }
  /** xi：囍字封面（版本 B）；text：文字封面（版本 A）。 */
  titleStyle: 'xi' | 'text'
  publicUrl: string
  /** 真实设备验证公开网页后填写 ISO 日期，静态请柬导出据此放行。 */
  publicUrlVerifiedOn: string
  /** 静态定位二维码使用人工验证过的 HTTPS 地图分享地址。 */
  mapShareUrl: string
  mapShareUrlVerifiedOn: string
  /** 稳定事件标识，修改日期时不应随之变化。 */
  calendarUid: string
}

export interface PhotoChoice {
  file: string
  alt: string
  /** 焦点使用 CSS object-position；默认以原始比例完整显示。 */
  position: string
}

/** full：通栏原比例；pair：两张原比例并排；inset：竖幅与独立文字留白。 */
export type GalleryLayout = 'full' | 'pair' | 'inset'

export interface GalleryBlock {
  id: string
  layout: GalleryLayout
  photos: PhotoChoice[]
  caption: string
}
