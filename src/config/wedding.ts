import type { WeddingConfig } from '../types'

/** 所有正式婚礼信息只在此维护。空字符串不是示例数据，表示尚未确认。 */
export const wedding: WeddingConfig = {
  groomName: '戚培俊',
  brideName: '涂丽纯',
  weddingDate: '2026-12-24',
  ceremonyTime: '11:00',
  ceremonyVenue: '新饭店附楼',
  banquetTime: '12:00',
  banquetVenue: '新饭店主楼',
  endTime: '',
  endDate: '',
  venueName: '赣州新饭店',
  venueRegion: '江西省 · 赣州市 · 赣县区',
  venueAddress: '江西省赣州市赣县区梅林镇杨仙大道21号',
  location: { latitude: null, longitude: null, coordinateSystem: 'gcj02', confirmed: false },
  invitationText: '诚挚邀请你来到我们的婚礼现场，\n共同见证这一幸福时刻。',
  closingText: '期待与你相见',
  copy: {
    banquetLabel: '午宴',
    coverSubtitle: '我们结婚啦',
    invitationHeading: '这一席，邀你入座',
    galleryHeading: '往后的日子，一起',
    galleryIntro: '从两个人的欢喜，到一辈子的日常。',
    portraitCaption: '眼里有你，笑里有光。',
    landscapeCaption: '走向彼此，也走向往后。',
    embraceCaption: '把平常的日子，\n过成喜欢的样子。',
    venueHeading: '赴一场欢喜之约',
    closingThanks: '感谢你，见证我们的幸福。',
  },
  titleStyle: 'xi',
  publicUrl: '',
  publicUrlVerifiedOn: '',
  // 新人提供并确认；已核对短链重定向为「新饭店 · 杨仙大道北侧」，未作现场路线验收。
  mapShareUrl: 'https://surl.amap.com/2siOh8Ng46li',
  mapShareUrlVerifiedOn: '2026-10-19',
  calendarUid: 'our-wedding-6fb45c60-46f9-42ef-88b1-09bba053ef60',
}
