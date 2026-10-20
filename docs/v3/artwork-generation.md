# 标题素材来源与提示词

当前决定：用户对比后选择恢复旧版「我们结婚啦」及原排布；正式版现采用「婚礼请柬」行书。下文保留迭代来源，最新状态见文末。

- 工具：内置 image_gen，透明背景生成；未使用API/CLI替代。
- 原始生成文件：`artifacts/v3/wedding-title-original.png`，2062×763 RGBA，保留原尺寸。
- 网页文件：`public/artwork/wedding-title.webp`，同尺寸无损编码，透明通道保留。
- 使用范围：只作五字标题，不包含真人照片、姓名、日期或场地信息。已肉眼检查「我们结婚啦」五字。
- 生图仅用于标题字形；所有人像继续使用项目原始婚纱照的衍生图。

## 原始提示词

Create a bespoke Chinese typographic artwork for an elegant joyful wedding invitation H5, as an isolated transparent PNG asset. ONLY the exact five Chinese characters: 我们结婚啦 . Layout: a small refined handwritten 我们 above left, with the three large characters 结婚啦 below in one compact horizontal line. The overall inked artwork should be approximately 2.7:1 width to height with generous clear transparent margin. Lettering color warm ivory #FFF8F0, opaque clean strokes. Art direction: sophisticated contemporary Chinese lettering, expressive graceful thick/thin contrast, slightly flowing connected rhythm, beautifully rounded confident endings, joyful and personal but very legible, refined wedding stationery quality. Not old-fashioned rough dry calligraphy, not cartoon, not standard computer font. Design the three large characters as one coherent composition, balancing subtle curved extended strokes. No added words, no Latin letters, no dates, no punctuation, no hearts, no flowers, no frames, no shadows, no texture, no colored rectangle, no photographic background. Real transparent alpha background, high resolution clean edges. This is a typography asset, not a mockup.

## 4K请帖专用矢量轮廓

- 文件：`docs/v3/assets/wedding-title-vector.svg`，只含矢量路径，无内嵌位图；不改变H5正在使用的WebP。
- 输入：已确认的 `public/artwork/wedding-title.webp`，2062×763。读取透明通道并反相，按128阈值提取已有笔画，不重新生成文字或人物。
- 转换：临时工具 `potrace@2.1.8`，`turdSize: 40`、`alphaMax: 1`、`optTolerance: 0.2`；去掉小孤立杂点，保留五字主要轮廓；统一婚纱白 `#FFF8F0`。
- 使用：304逻辑像素宽；3840px母版按矢量路径渲染约3243px宽，避免放大原位图。矢量化改善边缘采样，不增加原始字形信息；已复核五字与原版笔势。
- 工具仅安装于本地临时目录，未加入项目依赖。可重复导出只依赖保存的SVG，公开站点不加载该素材。


## 历史试用：行书标题（2026-10-20）

用户确认最后一版书法方向后，同步替换H5和四版海报。采用有提按、飞白与收笔变化的行书；暖白字无描边、发光、投影。仅生成标题，人物照片保持原样。

| 标题 | 使用范围 | 已保存墨稿 | 裁后矢量尺寸 | 交付PNG |
|---|---|---|---|---|
| 我们结婚啦 | H5、朋友海报 | `artifacts/v3/title-assets/source/wedding-title-approved.png` | 1367×687 | 3840×1930，透明 |
| 婚礼邀请 | 长辈、男方父母、女方父母海报 | `artifacts/v3/title-assets/source/invitation-title-generated.png` | 1854×509 | 3840×1054，透明 |

- 两张源稿由内置image_gen生成。第一张是用户确认的1536×1024墨稿；第二张以第一张为参考生成2172×724横排四字。人工核对文字与笔画，未使用其他AI提供方。
- 配套四字提示词核心：以参考图同样的行书笔法，只写「婚礼邀请」，单行横排，中等笔画，有干湿和提按变化，近黑墨字、纯白底，不添加落款、印章、光晕或装饰。
- 原稿SHA256依次为 `0969c02255aaf69ccf066ffe5e3a06ed179b3c6b823e31673cc4626fc4bee29f`、`b247698031c3d875e3d3af373b1806b5796c9bfb91a69e41c0ff3d95e280c047`。
- 制作流程：灰度阈值170确定字组外框，留16px边距；Potrace 2.1.8提取轮廓，`threshold:170, turdSize:3, alphaMax:1, optTolerance:0.15`；填色 `#FFF8F0`，背景透明。保留主要飞白，不添加原稿没有的笔画。
- 当前矢量为 `docs/v3/assets/wedding-title-vector.svg` 与 `invitation-title-vector.svg`。均为真实路径，无内嵌位图；4K PNG从矢量直接渲染，矢量化不增加原稿笔触细节。
- H5从同一矢量生成2400×1206无损透明WebP，保存为 `public/artwork/wedding-title.webp`；标题定位为顶距3%、左距15%、宽70%，避免较高的新字组碰到人物。
- 海报朋友版标题宽252逻辑像素、顶距22；正式版宽280、顶距44。实际安全区检查在导出时执行。
- 源稿、透明SVG、4K PNG、红底预览、转换参数与旧稿备份均在 `artifacts/v3/title-assets/`；源图及历史备份不发布到网页。


## 当前采用：恢复旧版「我们结婚啦」（2026-10-20）

用户比较两版后明确选择旧版。H5恢复原始2062×763透明WebP，定位恢复顶距4%、左距8%、宽84%；朋友海报恢复旧版SVG，宽304逻辑像素、顶距24。没有进一步修改原字形或缩短拖尾。

- 从 `artifacts/v3/title-assets/archive/wedding-title-before-calligraphy.webp` 和同名SVG精确恢复。
- 当前透明PNG为3840×1421，由旧版SVG直接渲染；当前源稿为 `artifacts/v3/title-assets/source/wedding-title-original.png`。
- 长辈及双方父母版「婚礼邀请」继续使用既有行书素材，本轮比较和恢复对象仅为「我们结婚啦」。
- 新版行书「我们结婚啦」保留在archive，未放入当前下载包；总览、朋友版母版/分享版和下载包同步刷新。


## 当前正式标题：婚礼请柬（2026-10-20）

用户确认正式版标题由「婚礼邀请」改为「婚礼请柬」。内置image_gen以既有墨稿为参考修改后两字，保留横排、笔法和前两字。为使「柬」在手机缩图上仍可辨认，最后以标准字形作结构参考，明确中间框的底横和两点，使用更易辨认的行楷结构。已人工检查四字及透明矢量预览。

- 输入参考：`artifacts/v3/title-assets/source/invitation-title-generated.png`；字形参考：`source/jian-glyph-reference.png`（同目录）；当前源稿：`artifacts/v3/title-assets/source/invitation-card-title-generated.png`，2172×724。
- 源稿SHA256：`f57b15f9980d4c007cbbde82a5ae328bce7a911096b3a3cfb023201d72d70b3a`。
- 保持原有Potrace参数：阈值170、turdSize 3、alphaMax 1、optTolerance 0.15；裁框1903×501，填色#FFF8F0。
- 当前输出：`docs/v3/assets/invitation-title-vector.svg`；透明PNG为3840×1011，源于矢量渲染。
- 最终提示词：Image 1 is the calligraphy edit target. Image 2 is the exact structural reference for 柬. Replace only the last character with clearly recognizable brush-written 柬. Keep the bottom horizontal stroke of the central enclosing rectangle and both interior diagonal dots. Use semi-regular brush script with no omitted strokes. Preserve 婚礼请 exactly, near-black ink on white, horizontal layout, matching brush weight and scale. Exact text 婚礼请柬, no additions.
- 字稿制作只涉及标题，人物照片不参与生成。旧稿在archive保留，不进入当前素材下载包。
