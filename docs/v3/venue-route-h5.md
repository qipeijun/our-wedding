# H5 动态线路与朋友分享素材

> 本文记录 V4 及早期动效。当前交付已更新为 [V5 配色与朱砂描线](venue-map-v5.md)：分享图统一配色、两栋新饭店归属标清、弯路向左收窄，H5 使用独立无路线底图和 7 秒循环描线。以下旧方案不再作为当前效果依据。

2026-10-21。用户确认 H5 以线路局部图优先展示、可查看周边总览，要求 SVG 动态效果，并同步调整发给朋友的素材。两种交付均去除起点／终点概念。

## 交付

- H5 线路：[VenueRoute.vue](../../src/components/VenueRoute.vue)，按用户最终要求直接展示完整手绘地图的周边总览与线路两部分，viewBox 为 0 0 1024 1462，仅裁去底部重复说明和比例提示。流光路径与原图共用 1024 × 1536 坐标，依照原红线中心校准。
- 用户后续要求安静循环、不提供手动暂停，并希望动效更明显：在原红线上叠加暖金高光短虚线，20 个原图单位亮段、16 个单位间隔，每 1.6 秒向前移动一个周期；使用轻微晕光，避免闪烁。离开视口暂停，减少动态效果时隐藏动效。完整红线始终保留；无起终点标签或播放控件。原简化建筑 SVG 已移除。
- 移除总览折叠区与额外路线说明，不显示「步行示意 · 非等比例」等文字。原导航链接与联系入口保留。
- 朋友分享原图：[venue-map-share-v4.png](previews/venue-map-share-v4.png)，1024 × 1536，内置 imagegen 编辑；删除起终点字样和对应大圆点，保留线路、过街说明及上下两幅布局。
- 网页总览：[venue-overview.webp](../../src/assets/venue-overview.webp)，由分享原图只作格式压缩，338,042 字节。
- 手机尺寸静态设计校验：[venue-route-glow-390.png](previews/venue-route-glow-390.png)。初版矢量建筑静态预览已被手绘底图方案替代，不作为当前效果依据。

## 验证与边界

- npm run typecheck 通过；现有 npm test 26 项通过；SVG XML 校验和 git diff --check 通过。
- 以 Sharp 渲染 390px SVG 静态图，目视检查主要标签、建筑、斑马线与绕行路径。此过程不等于浏览器或手机验证。
- 浏览器检查脚本的地图目标由 img 更新为 svg；未运行浏览器检查，未启动 dev、未构建、未发布。
- 当前直接复用手绘建筑，SVG 仅提供裁切视口与路线动效；不代表楼高和入口坐标的精确复原。未给具体圆楼指定 A/B 身份。

## 分享图片编辑提示词

```text
Edit this wedding wayfinding card with strictly targeted changes. The user wants a ROUTE GUIDE with NO start/end concept. Remove the Chinese labels "起点" and "终点" completely. Remove only the two large burgundy endpoint circles associated with those labels at hotel forecourt and annex gate; leave a continuous burgundy route with simple rounded line caps instead. Do not remove destination annotation leader dots. Change lower heading "前往附楼" to exact "线路指引". Replace the bottom two lines with "经斑马线过街" on first line and "沿公园弯路前往附楼四合院" on second line, removing the phrase "从新饭店出发". Preserve everything else precisely: warm ivory wedding stationery theme; brown fine outlines; elegant Chinese serif text; top "赴约指引", "新饭店 · 附楼四合院"; upper overview including two lake areas, stadium, gym, two round hotel masses, avenue, annex, park and river; lower view two round Hakka-style hotel buildings and grey/red courtyard annex; continuous red route across the zebra crossing then around RIGHT side and along lower edge of annex; labels "新饭店", "杨仙大道", "斑马线", "进入公园", "附楼四合院", "户外仪式", "樱花锦绣公园", "贡水"; bottom small non-scale note. No arrows, no new circles, no additional labels. No start/end semantics anywhere. Same portrait 2:3 ratio and detailed quality.
```
