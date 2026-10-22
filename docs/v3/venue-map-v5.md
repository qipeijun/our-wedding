# 手绘地图 V5：配色与朱砂描线

2026-10-21，依据用户批准的实施计划及两项补充纠正完成。

## 最新交付

- [朋友分享 PNG](previews/venue-map-share-v5.png)：1024 × 1536，保留「赴约指引」与完整两幅地图、静态朱砂路线。移除底部重复说明及比例提示。
- [H5 无路线底图 PNG](previews/venue-map-h5-base-v5.png)：与分享图相同画布，移除固定步行红线，由 SVG 绘制。
- 网页素材：src/assets/venue-map-h5.webp，340,964 字节。由 PNG 作格式压缩，不做全图滤镜。
- H5 组件：src/components/VenueRoute.vue。viewBox 为 0 145 1024 1317，省去图内顶部重复标题，保留周边位置与线路指引。
- 旧版 PNG 及静态预览保留；src/assets/venue-overview.webp 为上一版素材，已不被当前组件引用。

## 事实和视觉修正

- 用户明确：上图靠杨仙大道的大小两栋圆楼都属于新饭店。新版使用分叉引线分别指向两栋；上方独立白顶圆楼的「体育馆」标注单独指向自身。
- 用户明确：附楼右侧弯路实际没有此前那么向右凸，应向左收约一棵树的距离。新版分享图、H5 底图及 SVG 同步向左收窄约 50 个原图像素，过街处及附楼入口位置保留。
- 采用暖米白底、枣红重点字、灰棕道路轮廓、淡灰绿植被和浅青蓝水面。生成式栅格颜色为视觉匹配；CSS 底色 #FFF8F0、SVG 路线 #A93624、页面地址 #79625E 使用确定色值。
- 处理后目视核对两幅地图主要建筑、斑马线、附楼与河岸关系；生成式编辑不等于逐像素保持所有笔触，也不构成测绘复原。

## 动效

- 淡红完整路线常驻，深朱砂路线 3 秒描完、1.5 秒完整停留、1 秒淡出，5.5 秒循环。2026-10-22 用户反馈停顿过久，缩短完整停留，保留描绘速度和淡出时长。
- 线宽采用 non-scaling-stroke，常驻底线为4px、42%不透明度，动态朱砂线为6px；按2026-10-22用户确认加强手机辨识度。另用粗线遮罩控制描绘范围，避免地图缩放影响描线时长。
- 首轮在线路区域至少60%进入视口后启动；启动后移出视口暂停、返回时从原进度续播，不重新等待60%或重头描绘。组件卸载断开观察器。
- 减少动态效果时取消动画并显示完整朱砂路线。
- 无霓虹、光点、箭头、起终点标签、额外说明或播放控件。

## 验证

- 2026-10-22：6px动态线、4px底线及5.5秒循环已通过生产构建（含类型检查）与 `git diff --check`；构建产物已核对新线宽和时序。已更新4173预览所读取的 `dist`。本轮未重新进行浏览器或真机视觉验收；下列截图为历史证据。
- npm run typecheck 通过；现有 npm test 26 项通过；git diff --check 通过。
- 静态 SVG 阶段渲染：320、390、430px，核对描线中段、完整线路、文字与底图关系。
- [320px 完整描线](previews/venue-cinnabar-320-5s.png)、[390px 半程](previews/venue-cinnabar-390-2.5s.png)、[430px 完整描线](previews/venue-cinnabar-430-5s.png)。另保存 390px 的 0 秒与 5 秒版本。这些为加粗前的2.5px历史预览；4px调整已完成类型检查，尚未重新进行浏览器或真机视觉验收。
- 静态渲染不代替浏览器动画验证。尚未验证真实浏览器循环接缝、视口暂停和系统减少动态效果，也未进行微信真机验证。
- 最新节奏调整通过类型检查，并以真实组件脚本模拟7个视口状态及卸载清理：不足60%时不首播、达到60%启动、离屏暂停、重新进入后续播。该模拟不证明浏览器中的交叉比例或实际观感。
- 本轮不构建、不提交、不发布。既有本地 dev 服务在最终素材和组件保存后重启，并检查实际返回内容。

## 素材生成方式与提示词

使用内置 imagegen 依次进行配色、标注与弯路纠正、道路颜色清理和 H5 去线处理。原图未覆盖。

### 配色

```text
Edit this exact wedding map, preserving pixel positions, all building geometry, all roads, text glyphs, sizes, and its 1024x1536 portrait layout. This is selective COLOR REFINEMENT, not redesign or redrawing. Give ONE finished high-resolution PNG with the SAME framing and aspect ratio. Use a perfectly uniform warm ivory paper background #FFF8F0 including all page edges, not bright white and not a dark beige wash.
Selective palette:
All major Chinese headings, hotel/annex destination names and annotation pins become deep muted jujube red #852D27 instead of vivid scarlet.
The single pedestrian route in the LOWER map becomes clear cinnabar #A93624, with the existing continuous geometry unchanged, from the hotel forecourt through zebra crossing and curving around right then lower edge of courtyard annex.
Secondary lettering and fine architectural outlines become warm grey-brown #79625E; retain readable contrast.
Trees subdued sage grey-green; river and two lakes become muted soft pale blue-green rather than saturated cyan. Keep warm ochre hotel walls and subtle terracotta running track, subdued grey tiled roofs. Do NOT apply a uniform filter. Buildings must retain contrast and detailed hand-drawn character.

Remove ONLY the bottom footer texts "经斑马线过街", "沿公园弯路前往附楼四合院", and the tiny "位置与步行路线示意 · 非等比例". Fill those text areas with the same clean #FFF8F0 background. Do not remove any other text.
Keep EXACT headings "赴约指引", "新饭店 · 附楼四合院", "周边位置", "线路指引"; keep all geographic labels, "附楼四合院" and "户外仪式".
Invariants: two map panels stay at identical coordinates; hotel two circular buildings retain their roofs/courtyard; oval running track and separate closed circular sports hall remain distinct; annex across 杨仙大道 within park beside 贡水. Preserve every landmark's location and sizes and the complete route's location. No arrows, start/end circles, glow, new text, new buildings or architectural redesign. Quiet elegant Chinese wedding stationery, same illustration.
```

### 标注与弯路纠正

```text
Edit this exact wedding map. Keep 1024x1536 canvas and all building/river/road locations except ONE explicitly requested park bend adjustment. Preserve both map panels, architecture, typography, all existing text, warm ivory paper, muted sage foliage, muted pale blue-green water.
Three precise refinements:
1. In the UPPER overview, the TWO circular yellow buildings (small one centered around x640,y495 and larger one around x760,y465) BOTH belong to 新饭店. Replace the existing hotel's single ambiguous pin with ONE label "新饭店" and TWO delicate muted burgundy leader branches, clearly ending at these two yellow buildings respectively. Do NOT label the upper independent white-roof circle as hotel. That independent circle around x590,y410 is 体育馆: place "体育馆" clearly adjacent to THAT building with a very short precise grey-brown leader if necessary. Avoid overlapping hotel/sports labels. Leave 体育场 label on the running track. Lower hotel label should also clearly designate BOTH connected yellow circular buildings, use a subtle branched leader if needed, no new verbose text.
2. LOWER walking map: user confirms park bend is too wide. Tighten the bulging RIGHT-HAND curve of the red walking route and its underlying pale park lane by moving the rightmost arc LEFT by approximately one small tree spacing, about 45 to 50 pixels on this 1024-wide image. The old rightmost road/red-line position is approximately x730 between y1210 and y1280; new rightmost position should be approximately x680. Keep the crossing and top of park access at x540,y1145 unchanged and annex front-gate endpoint near x376,y1303 unchanged. Smooth the top and bottom joins to the tighter arc; no sharp corners or kink. Also move the pale underlying lane, restore displaced greenery, and avoid running the route through trees or buildings. Do NOT move or resize the annex. This is a modest narrower curve, NOT a new route. Upper overview stays geographically same.
3. Make ALL red TITLE lettering and destination lettering visibly DARKER and more subdued: deep brownish burgundy #852D27, NOT current bright scarlet. Pedestrian route remains cinnabar #A93624 and easy to distinguish. Use warm grey-brown #79625E for secondary labels. Paper at all outer borders must be clean flat warm ivory #FFF8F0. Preserve color variety in roofs, buildings, water and trees, no uniform filter.
No footer, no extra captions, no arrows, no start/end dots, no decorative circles. Keep all headings, landmarks and labels correctly spelled. Precise localized edits, otherwise preserve original faithfully.
```

### 道路细线颜色

```text
Make ONE precise COLOR CORRECTION to this exact map, keeping ALL pixels' layout and geometry unchanged. ALL THIN bright red/orange lines that outline streets, blocks and background road boundaries in BOTH upper and lower panels must become muted light warm grey-brown #B59B8C. These hairline street borders must be subdued, NOT scarlet. Keep the THICK walking route in the lower panel cinnabar #A93624. Keep headings, labels, and destination leader branches dark burgundy #852D27; do NOT fade those. Preserve the two clear 新饭店 leader branches and separate 体育馆 annotation in the upper panel. Preserve the newly tightened lower park bend whose rightmost arc is near x680. Keep every building, tree, water shape, text glyph, and route in EXACT same position, same 1024x1536 canvas. Maintain muted sage, pale blue-green water, warm ochre walls and grey roofs. Background flat warm ivory #FFF8F0, especially outer edges. No new text, no captions, no geometry changes. Only recolor thin street outline strokes from bright scarlet to quiet grey-brown.
```

### H5 底图去线

```text
Precise local erasure edit for a web animation background. Use this EXACT 1024x1536 wedding map image, preserve framing, positions, dimensions, ALL Chinese text, ALL architecture, roads, trees, palette and page background pixel-for-pixel wherever possible.
Remove ONLY the thick cinnabar pedestrian route in the LOWER map. It runs from the hotel forecourt near (477,1010), across the zebra crossing toward (540,1145), curves on the pale park lane to rightmost (682,1230), then curves left to the annex front gate at (376,1303). Erase the entire thick red walking line and its artificial white outline, including the portion crossing the zebra crossing. Reconstruct natural paving, continuous white zebra stripes and the pale park lane underneath. Keep the existing park lane width and its newly tightened shape EXACTLY; do not move it or make it wider, and do not grow trees into it.
Do NOT erase hotel destination annotation lines or dots, the two branched hotel leaders in the upper overview, the 体育馆 leader, the 附楼 marker, any heading, any black/brown text, or any building's red columns. Keep the small "进入公园" annotation leader in place.
No replacement route, no dashes, no glow, no dots, no new text. This is a clean base image; software adds the path later. Preserve muted brown outlines, deep burgundy text #852D27, sage trees, pale blue-green water and the clean warm ivory #FFF8F0 background. Do not redraw or redesign the map.
```
