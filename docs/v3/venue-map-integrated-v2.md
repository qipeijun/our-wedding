# 整合地图第二版效果图

2026-10-21，用户要求根据卫星图和前轮核查结果出效果图，并保持已确认的婚礼手绘主题。

- 交付：[venue-map-integrated-v2.png](previews/venue-map-integrated-v2.png)，1024 × 1536，内置 imagegen 生成。
- 保留「赴约指引」主题、上下总览与近景布局、米白底、暖棕细线和暗红步行线。
- 依据用户卫星图修正：梅林古镇为湖区商业群；补绘椭圆体育场；体育馆使用封闭圆顶；新饭店小圆楼采用浅色中心覆盖面，大圆楼保留庭院与内部建筑；公园简称修正为「樱花锦绣公园」；补充茶山路。
- 为避免生成的反向箭头造成歧义，最终步行线使用圆点端点，通过「前往附楼」及底部文案表达用途。
- 已目视检查主要文字、两岸关系和路线走向。总览建筑群、岛屿、树木、建筑高度及附楼内部布局仍为插画概括，不是卫星图逐栋描摹或测绘复原。未进行手机实测。
- 本次仅交付独立效果图，不替换 H5 或图片请柬资源。

## 生成提示词

```text
Create ONE polished portrait 2:3 wedding wayfinding illustration, a revised version of reference 1. CRITICAL: preserve the wedding invitation theme of reference 1: warm ivory paper, delicate warm brown pen lines, light restrained ochre and sage washes, burgundy destination names and pedestrian arrows, quiet elegant Chinese Song typography, generous whitespace. Keep title '赴约指引' subtitle '新饭店 · 附楼四合院', upper neighborhood overview and lower walking detail. This is a romantic refined hand-drawn invitation companion, NOT a satellite image, architectural engineering sheet, tourist brochure, or generic city map. Reference 1 is STYLE/layout only, its incorrect buildings MUST be corrected. Reference 2 satellite overview is geographic shape/placement evidence; reference 3 satellite detail is building roof/footprint evidence. Never reproduce satellite textures, POI clutter, logos or map UI.

UPPER MAP about 36% usable area, heading '周边位置':
Match satellite geometry in simplified hand-drawn form. Broad irregular lake with small green islands and a smaller adjoining water feature at its left, surrounded by clusters of low rectangular commercial buildings with understated grey pitched roofs; label '梅林古镇'. It is a lake-side commercial group NOT one circular Hakka house.
Above lake show '城南大道'; below lake show '茶山路'.
Below 茶山路 and below-left of hotel show large prominent VERTICALLY elongated oval running track with muted terracotta lanes and green rectangular football field, modest side stands; label '体育场'.
To RIGHT of running track and ABOVE hotel show a SEPARATE round enclosed indoor sports hall: dark low ring perimeter around a solid ivory roof disc with a small grey central spot; label '体育馆'. NO hollow central courtyard.
Hotel is below-right of sports hall, adjacent to upper/inland side of '杨仙大道'. Hotel two connected round masses: small lower-left, large upper-right. Larger roof grey annular with inner court containing a small block; SMALL circle has a SOLID pale central roof disc, NOT open courtyard. Collective label '新饭店' burgundy.
Across 杨仙大道 below and slightly left of hotel, in river-side green park strip, draw annex courtyard symbol labeled '附楼'. Thin river band below park labeled '贡水'. Minimal background blocks to right and left, no invented ornate landmarks. Do NOT add 文体中心 as separate little building; stadium is the visual reference. Do NOT label extra businesses/schools/government. Circle only hotel-and-annex area with thin muted brown dashed oval, never include sports hall in hotel symbol. A thin brown connector without arrow, labeled '局部放大', links to lower detail using whitespace. This connector is NOT a burgundy walking path.

LOWER MAP about 56% usable area, heading '步行指引':
Retain reference 1 recognizable pale ochre Hakka hotel facades and grey tiled roof motif but CORRECT smaller circle to show opaque pale roof in center; NO trees/open courtyard in smaller circle. Larger circle shows actual small central courtyard building/green patch instead of exaggerated huge empty hole. Size and diagonal relation match satellite 3. Both connected by low central entry block, collective '新饭店'. No A/B wing labels.
Across middle road labeled '杨仙大道'; one zebra crossing in front of central hotel forecourt, label '斑马线'. White stripes correct orientation. On river-side end mark '公园入口'.
Annex is across road, down and somewhat LEFT of crossing. Based satellite 3, an irregular rectangle-like grey tiled compound with central open paved courtyard, wider two-story rear main hall and slightly projecting lower side wings, not perfectly geometrical hollow square. Preserve recognizable muted red columns, grey brick, grey tile and restrained painted beams from reference 1; use sparse roof lines. Label '附楼四合院'.
Single burgundy pedestrian path starts at hotel forecourt, uses zebra crossing, then follows tree-lined curved access around RIGHT side of annex, bends LEFT along lower/river-facing edge into front entrance. EXACTLY two arrowheads, one toward crossing and one pointing LEFT to annex at end of bottom curve. No wrong direction arrows. No shortcut straight to roof. Route label '前往附楼'.
Sparse trees and light sage indicate park, label '樱花锦绣公园' (EXACT SIX characters 樱 花 锦 绣 公 园; do not omit 绣). Small supplemental caption at bottom can use full name '赣南客家名人（樱花锦绣）公园' if there is room, but not necessary.
Narrow river band at bottom '贡水'.
Footer '过斑马线，沿公园弯路前往附楼' and tiny '位置与步行路线示意 · 非等比例'.

Aesthetic invariants: restrained hand-drawn warmth, line work simple and airy, ivory background #FAF5ED, warm brown outlines, burgundy #8F2F28, no heavy boxes or border, no extra hearts/flowers/characters, no dense urban details. Maintain hand-drawn building identity, not photorealism. Destinations visually strongest, supporting landmarks lighter. All text legible accurate Chinese. The entire artifact must feel like the same elegant wedding map design as reference 1 with factually corrected geography and architecture.
```

## 最终路线修正提示词

```text
Revise this wedding map's LOWER walking guidance section. Replace ALL THREE RED ROUTE ARROWHEADS with plain ROUND DOTS, so the map has ZERO ARROWHEADS anywhere. This is a visible stylistic change: all pedestrian route strokes now have rounded termini, no triangles. Specifically erase the triangle pointing down near hotel entrance, erase the triangle pointing up at the bottom of zebra crossing, erase the triangle pointing left near annex entrance. Keep red route curves and label leader lines. Use one continuous elegant burgundy walking line with circular start and end markers, with existing text '前往附楼' and footer explaining route. The curving path must have a round end at the zebra crossing, NOT an arrow pointing up. Show clearly smooth round line caps. Redraw that full curved route as necessary to remove triangles. Preserve all other illustration content exactly: same two-panel portrait layout, ivory wedding stationery style, title, all Chinese text, lake, running track, closed-roof sports hall, two hotel buildings with small covered roof and large courtyard, grey-red annex courtyard, roads, trees and river. Do not reimagine architecture. Goal: ZERO triangles or arrowheads along the red walking route.
```
