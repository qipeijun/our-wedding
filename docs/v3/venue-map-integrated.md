# 赴约指引：整合地图素材

2026-10-21。用户已确认：将周边总览与近景步行路线整合为一张竖版素材，采用米白底、暖棕细线、暗红路线、留白较多的手绘方向。

## 交付与检查

- 图片：[venue-map-integrated-v1.png](previews/venue-map-integrated-v1.png)。使用内置 imagegen 生成，未接入 H5 或图片请柬。
- 上方为周边位置，下方为步行指引；总览通过圈选与“局部放大”引线关联近景。
- 总览保留城南大道、梅林古镇、赣县体育馆、赣县区文体中心、杨仙大道、公园及贡水。周边地标使用概括图形，不宣称精确建筑外形。
- 近景保留两栋黄色围屋、灰砖红柱四合院、斑马线和绕附楼右侧进入的暗红路线。建筑细节和树木已简化。
- 已目视核对文字、道路两侧关系、过街位置表达以及箭头朝向；未做真实手机显示验收。建筑内部布局、距离和比例为示意，依据与实景档案见 [venue-map-reference.md](venue-map-reference.md)。

## 完整生成提示词

### 初次整合

```text
Design ONE finished portrait Chinese wedding wayfinding card integrating two map scales. Aspect 2:3 portrait, ideally 1536x2304 or similar. Reference image 1 is the existing broader neighborhood overview, reference image 2 is the accepted close-up pedestrian map. Integrate their facts, redrawing both in ONE unified elegant sparse hand-drawn style, warm paper ivory #FAF5ED, fine warm brown #B28C7C lines, muted burgundy #8F2F28 destinations and pedestrian path, very light sage parks, pale neutral blue/beige river. Refined, warm, spacious, legible on mobile, not a busy tourist brochure. NO thick frames, no ornamental wedding clipart, no photo collage, no fake embossed paper, no massive title.

LAYOUT: small elegant centered Chinese Song-style title '赴约指引', smaller subtitle '新饭店 · 附楼四合院'. Clear vertical hierarchy. Upper section roughly 1/3 of usable map area labeled discreetly '周边位置', lower section roughly 2/3 labeled '步行指引'. Sections distinguished by generous blank space, NOT boxes or thick rules. A fine brown dashed oval around the HOTEL AND ANNEX together in overview, with a delicate connector ending at the detail-section margin, communicates enlarged area; connector must never resemble walking route or obscure a label. No global outer border.

TOP OVERVIEW: simplify ref 1, maintain geographic relationships and street topology, roads rise gently from left to right. '城南大道' across upper inland part, '梅林古镇' on upper left, '赣县体育馆' upper right above hotel, '赣县区文体中心' lower left of hotel. '新饭店' inland just ABOVE '杨仙大道'. '附楼' just BELOW 杨仙大道 within park band, river further below. Label river '贡水'. Hotel miniature symbol is two connected rings; annex miniature symbol is a square enclosed courtyard, NEVER H-shaped. Use small burgundy destination dots and labels for hotel and annex. Retain only key roads and small sparse landmark outlines. Text not crammed, no overlapping. No pedestrian route in overview. No exact distances or north arrow. Avoid excessively tiny labels.

LOWER DETAIL: follow ref 2 layout and HUMAN-CONFIRMED ROUTE EXACTLY, but simplify drawing detail by 60%: remove dense repeated roof tiles/window grids and most trees. Show two connected circular Hakka hotel buildings on inland/top side of street, smaller left/lower and larger right/upper with low connecting entrance. Pale ochre walls, grey tiled ring roofs, courtyards. Collective burgundy label '新饭店', no A/B wing labels. Across middle show '杨仙大道'. Just in front of hotel central entrance show ONE zebra crossing across the road, correctly oriented white stripes, label '斑马线'. On river-side edge of crossing mark '公园入口'. A single burgundy walking route goes FROM hotel forecourt across zebra crossing, enters park, curves AROUND RIGHT side of annex, then bends LEFT toward its front/lower gate. Show only 2 small arrowheads and do not draw a shortcut through buildings. Route label '前往附楼'. Annex below road and slightly left of crossing: square enclosed courtyard, grey brick walls, low side wings, TWO-STORY rear/main hall with muted red columns, simple grey tiled roofs and restrained blue-cream beam accents, front courtyard gate. Burgundy label '附楼四合院'. Keep open courtyard visible and the building identifiable but not photoreal architectural rendering. Sparse trees (about 8-12 only) suggest shaded curved access lane. Label park on right '樱花锦公园'. Thin river band along bottom, '贡水'. Preserve road separating hotel and annex. Don't put route in river.

One discreet bottom caption: '过斑马线，沿公园弯路前往附楼'. Tiny footer '位置与步行路线示意 · 非等比例'.
All text is exact simplified Chinese. All important labels readily readable. Use same typography and line weight across both maps; destination names slightly larger and burgundy, context labels warm grey. Both sections feel drawn by same illustrator. Maps dominate card, no schedule, no wedding date, no couple names, no QR codes.
```

### 简化与修正

```text
Revise the supplied portrait wedding map card with these precise corrections. Preserve exact Chinese text, typography, paper background, two-panel layout, all road/river positions, hotel/annex relative placements and pedestrian path geometry.
1. Upper '周边位置' panel: the three CONTEXT landmarks have incorrectly invented architectural illustrations. Replace the building above '梅林古镇' with just a thin brown irregular oval lake outline, no roof no house no stadium. Replace '赣县体育馆' illustration with a simple flat double oval outline, no perspective no roof no courtyard. Replace '赣县区文体中心' illustration with a tiny flat outlined rectangular footprint, no ornate facade. These are neutral diagram symbols. Keep their exact labels and positions. Simplify upper hotel and annex icons substantially, still two rings and one courtyard.
2. The circle around overview hotel+annex and connector between sections must be thin muted BROWN, not red. The connector has NO ARROWHEAD at its end. Tiny label '局部放大' next to connector in whitespace so it cannot be mistaken for a walking route. Do not move or redraw roads.
3. Lower walking route has contradictory/excess arrowheads on bottom arc. Remove ALL existing arrowheads, then add exactly TWO small burgundy arrowheads: one heading down from hotel toward zebra crossing, a second on bottom arc pointing LEFT toward annex front gate. Absolutely no right-pointing arrow on bottom arc. Keep continuous burgundy line curving around annex right side into lower/front gate. Preserve crossing, route and all route labels.
4. Across both panels remove about HALF the decorative trees and simplify roof hatching and repeated windows substantially. Keep main hotel recognizable pale yellow two circular Hakka buildings, annex grey brick red-column courtyard with two-storey rear hall. More breathing room, clear thin lines, fewer fine details. This is a wedding invitation map, restrained hand-drawn graphic, not a densely detailed architectural rendering.
Do not add any new streets, landmarks, details, labels, border, title or symbols beyond requested '局部放大'. Keep all other content unchanged.
```
