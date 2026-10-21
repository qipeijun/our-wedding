# 场地实景与地图素材核对

审阅日期：2026-10-21。逐张查看用户提供的 IMG_9165–IMG_9173.HEIC，使用系统解码生成临时 JPEG 预览，Downloads 原文件未修改。此批为场地参考，不计入 source/ 的 47 张婚纱照。

## 用户已确认

- 新饭店为两栋客家围屋；附楼为四合院。
- 附楼位于杨仙大道临江一侧、公园内。
- 按用户红线，过斑马线后沿附楼右侧弯道绕向下方进入；跨杨仙大道方式为地面斑马线。

## 逐张观察

| 原文件（均在 /Users/qipeijun/Downloads/） | 画面事实 | 素材用途 |
|---|---|---|
| IMG_9165.HEIC | 灰砖灰瓦的低层建筑、红柱、彩绘檐枋、台阶与敞开门洞 | 附楼侧翼材质与色彩参考 |
| IMG_9166.HEIC | 灰砖院墙、灰瓦门楼、红木门金色福字、石铺院落 | 院墙与门楼特征参考，不据此认定通行门 |
| IMG_9167.HEIC | 两层中式主体、红柱红栏杆、灰瓦挑檐和彩绘梁枋，前方开敞石铺庭院 | 附楼主体辨识特征 |
| IMG_9168.HEIC | 树荫下柏油弯路、绿篱、灯柱与远处铁门 | 进入路径氛围与形态，不单凭该图定位铁门 |
| IMG_9169.HEIC | 新饭店入口、两侧浅黄弧形楼体、灰瓦屋顶，左下见斑马线 | 饭店外形与配色 |
| IMG_9170.HEIC | 主路旁林荫人行道及向公园转入的铺装路口 | 公园入口连接关系 |
| IMG_9171.HEIC | 新饭店临街立面与前景完整斑马线 | 地面过街方式的实景证据 |
| IMG_9172.HEIC | 饭店、道路、人行道与部分斑马线 | 临街环境辅助参考 |
| IMG_9173.HEIC | 从人行道转入的树荫柏油弯路、绿篱与公园提示牌 | 公园入口识别特征 |

## 预览边界

- [第二版地图](previews/venue-map-annex-v2.png) 为内置 imagegen 生成的独立预览，未替换 H5 的 src/assets/venue-map.svg，也未加入图片请柬。
- 表现两栋围屋、灰砖红柱四合院、斑马线与进入附楼的弯路。建筑体量、树木、院内布局和距离为图示概括，不是测绘复原；未确定 A 栋在两栋围屋中的对应位置。
- 用户要求先解决素材；后续已确认将周边总览与步行近景整合为竖版手绘地图卡，见[整合地图素材](venue-map-integrated.md)。是否放入请柬及请柬中的具体版式尚未定稿。

## 生成提示词

### 首轮近景地图

```text
Create a revised Chinese wedding location map asset, landscape 3:2, refined MINIMAL LINE DRAWING with limited flat washes. Image 1 previous map is STYLE reference ONLY; replace its overly broad geographical crop with a close-up. Image 2 user annotated map is the definitive spatial and walking-route reference. Image 3 map building model defines two hotel masses. Images 4-5 on-site photos show actual architecture, zebra crossing, and tree-lined park access. The human confirms: hotel comprises TWO circular Hakka enclosed buildings; annex is a rectangular four-sided courtyard; street crossing is a ground-level zebra crossing.

Composition: top half inland has hotel two connected circular Hakka ring buildings: smaller at upper left/lower left relative to larger at upper right, connected at their inward sides by low central entrance block. Use modest bird-eye architectural line icons, pale ochre facades and grey-brown tiled circular roofs based on photos; make ring courtyard recognizable, not two sports stadiums. Label the pair collectively '新饭店' and small subtitle '两栋客家围屋'. Do not assign A/B labels or precise banquet wing.
Across middle a gently diagonal broad road rising from left bottom to right top, labeled '杨仙大道' well away from crosswalk.
Below road river-side park, ample room. Annex below and slightly left of hotel group, a simple RECTANGULAR enclosed courtyard with four connected wings around an obvious empty square central courtyard, label '附楼四合院'. Not an H shaped building; do not draw round annex. Keep courtyard as schematic icon without detailed invented facade.
A single short zebra crossing spans the road in front of the hotel central forecourt, directly above and to right of annex as in annotated map. Zebra stripes must be geometrically oriented correctly: long stripe axes parallel to the road, sequence of stripes runs across the road. Label '斑马线' alongside, not over stripes.
A muted burgundy pedestrian route starts at hotel forecourt, crosses road ONLY at zebra crossing, reaches the '公园入口' at near edge of park, follows the curved tree-lined access around the RIGHT side of annex, then bends LEFT toward annex's lower/river-facing edge, ending at courtyard approach. This route must faithfully follow the user's red curve in image 2; don't make a straight shortcut through courtyard or route pass through roofs. Add 2 small clear arrowheads pointing FROM hotel TOWARD annex. Route line slightly thicker than context outlines but elegant. Label '前往附楼' next to curve. Clear distinction between public park entrance next to road and final annex destination farther along curved path.
A few sparse simple tree outlines along curved lane, pale desaturated olive wash in park. Label '樱花锦公园' on right, '贡水' in narrow beige river band along bottom. River is behind annex and never between road and annex. No distant landmarks, no sports stadium, no 梅林古镇, no 城南大道, no other businesses, no parking symbols, no navigation pins obscuring building detail. No timings or walking distances.
Palette warm cream #FAF5ED, thin brown #B28C7C architecture and context, dark warm grey labels, burgundy #8F2F28 route and main destination labels. Plenty of negative space. Flat paper graphic, subtle hand-drawn line charm, NO watercolor haze, NO photorealism, NO large decorative title, NO heavy frames. Accurate large simplified Chinese labels; no English. Small footer '步行路线示意 · 非等比例'. This is an explanatory map preview based on human-confirmed spatial relationships, not survey geometry.
```

### 依据补充实景修正附楼

```text
Edit reference image 1, the wedding walking map draft. Preserve the entire layout, all Chinese labels, hotel two round buildings, zebra crossing, road, river, and burgundy pedestrian route exactly. Only correct the annex courtyard architecture in the lower-left using references 2,3,4: these are actual photos of the annex, showing grey brick walls, charcoal grey tiled roofs, muted red columns and red wood railings, restrained pale blue/cream painted beams, and a TWO-STORY main hall at the far/back side of the enclosed courtyard. Ref 2 is that two-story main hall; ref 3 shows low side wing; ref 4 shows grey courtyard wall and red wooden gate. Replace the generic pale-yellow single-storey annex with a recognizable simplified courtyard compound: open square paved courtyard, far side two-story hall with slightly upswept grey tiled eaves, red columns and balcony, lower side wings and a low front entrance, grey brick walls. No need to copy intricate ornament, no legible 福 characters, no extra decoration. The building is a schematic icon informed by photos, not a reconstruction of unseen interior geometry. Keep route approaching its LOWER edge from the RIGHT, don't alter route or gate approach position. Keep map legible at mobile size; existing warm cream background, delicate brown outlines, restrained flat colors. Do not change the yellow facade colors of the main hotel above road. Preserve all exact Chinese labels from image 1.
```
