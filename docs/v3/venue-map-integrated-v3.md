# 整合地图第三版效果图

2026-10-21。根据文案与位置关系审核优化，使用内置 imagegen 编辑，保留第二版。

- 素材：[venue-map-integrated-v3.png](previews/venue-map-integrated-v3.png)。
- 延续米白底、暖棕线稿、暗红重点和上下两幅地图的婚礼主题。
- 下图标题改为「前往附楼」，标注起点、终点和「户外仪式」。步行线连续穿过斑马线，沿附楼右侧弯路进入临江侧入口。
- 「公园入口」改成「进入公园」，引线靠近过街后转入公园的位置；删除多余路线圆点。
- 底部说明明确从新饭店出发、经斑马线过街、沿公园弯路前往附楼四合院。
- 梅林古镇简化为左小右大的两片水域和沿湖建筑，去除无依据的装饰岛屿及桥梁。移除误圈体育馆的放大圈和连接线。
- 已目视复核文字、路线连续性以及主要地标位置关系；建筑比例、细部、入口坐标仍为插画示意，不是测绘复原。未做手机显示或现场路线实测。
- 仅新增独立素材，未替换请柬网页资源。

## 编辑提示词

```text
Use case: precise-object-edit.
Edit reference image 1 into a refined third version of this wedding wayfinding card. Reference 1 is the EDIT TARGET: preserve its exact portrait 2:3 two-panel composition, elegant Chinese Song typography, warm ivory background, delicate brown linework, pale ochre hotel, restrained sage greenery, grey tiled roofs and burgundy emphasis. Reference 2 is satellite GEOGRAPHY REFERENCE only, never render satellite pixels/UI. Keep wedding invitation aesthetic; no new decorative motifs or technical drawing style.

Targeted corrections:
1. Lower section heading replaces "步行指引" with EXACT "前往附楼". Keep title "赴约指引" and subtitle "新饭店 · 附楼四合院".
2. Draw ONE CONTINUOUS slender burgundy walking line from hotel central forecourt, through CENTER of the zebra crossing, to the park side, curving around the RIGHT side of the annex then bending LEFT along its lower river-facing edge to the front gate. The line MUST NOT BREAK at the zebra crossing. Keep clear white zebra stripes visible on both sides of line. Only TWO round route endpoint dots: hotel start and annex gate finish. Remove intermediate red dots on both road edges and the bend. No arrowheads. Add small readable burgundy "起点" near hotel start, small burgundy "终点" near annex gate, positioned without covering buildings or other text. Existing landmark label leader dots are okay.
3. Replace "公园入口" with EXACT "进入公园". Its thin brown annotation leader ends precisely at the lower end of zebra crossing, where route leaves road for curved park access, NOT at a tree. Keep "斑马线" annotation beside crossing. Remove redundant "前往附楼" label at right bend, since section heading now explains direction.
4. Lower annex label remains "附楼四合院", add subordinate smaller brown "户外仪式" directly beneath with whitespace. Do not invent A/B building identity, ceremony time or banquet details.
5. Bottom footer exact wording, use TWO centered lines for legibility:
"从新饭店出发，经斑马线过街"
"沿公园弯路前往附楼四合院"
Tiny bottom note "位置与步行路线示意 · 非等比例".
6. Upper lake/commercial district: simplify ornate invented bridges, islands and excessive buildings. Reference satellite shows smaller rounded water basin at LEFT and larger irregular elongated lake at RIGHT, separated by broad paved plaza/path, low rectangular grey-roof commercial masses around edges. Depict these TWO SIMPLE WATER AREAS and sparse low commercial blocks, no fantasy bridges, no decorative archipelago. Label "梅林古镇" clearly.
7. Upper zoom outline/connector uses muted light warm BROWN dashes (not burgundy pedestrian route color); enclose hotel pair plus annex, exclude the indoor sports hall. Small existing "局部放大" brown text retained. Keep line away from all labels.
Geographic invariants: 城南大道 above lake group; 茶山路 below lake and above oval running track; 体育场 left, round enclosed white roof 体育馆 right/above hotel. Hotel consists of TWO connected round Hakka-style masses: smaller lower-left with solid light roof center, larger upper-right with open court and small inner building. Do not confuse third sports hall with hotel. Hotel inland ABOVE 杨仙大道, annex across avenue BELOW and slightly LEFT of hotel, park and 贡水 further below. Keep these relations identical in overview and detail. Keep annex grey/red courtyard with taller rear building and lower wings. Keep labels "樱花锦绣公园" and "贡水" correctly spelled. Preserve existing simplified architectural identity; no unverified detailed entrances or new roads.
Render polished legible Chinese lettering, spacious calm wedding stationery. Keep line drawing delicate, no photographic realism, no extra frames, no new landmarks.
```

## 清理放大圈提示词

```text
Make ONE strictly localized cleanup of this existing wedding map image. REMOVE the entire dashed brown/orange oval in the UPPER neighborhood overview, remove its long dashed descending connector between panels, and remove only the small text "局部放大" next to that connector. Restore the paper, park, road and building outlines underneath those thin dashed marks naturally. Do not replace this oval with anything. The two map headings already distinguish overview and detail. Preserve EVERY other element precisely: portrait layout; "赴约指引" and subtitle; "周边位置"; "前往附楼"; both lakes; all buildings and their placement; indoor sports hall; running track; two round hotel buildings; courtyard annex; trees; river; every other Chinese label; the continuous burgundy walking line THROUGH zebra crossing and around the RIGHT then lower side of annex; start/end dots and labels; footer. Preserve the ivory, brown, burgundy wedding stationery illustration aesthetic. Do not change any other text, architecture, route, color or position.
```
