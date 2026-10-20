# 我们的婚礼 · H5「喜讯入画」

戚培俊与涂丽纯的婚礼 H5，以及朋友、长辈、男方父母、女方父母四张图片请帖。Vue 3 + Vite + TypeScript，保留真实摄影、原比例和肤色；本版已取消日历提醒。

2026-10-20最新迭代优先完成H5：专属中文标题、招手封面、精简邀请文案、错位递花双图与集中赴宴信息。设计与交互说明见 [H5设计记录](docs/v3/h5-design.md)，验收见 [H5验证记录](docs/v3/verification.md)。图片请帖现已延伸为四张统一招手照的独立海报：3840px宽4K PNG母版与1080px宽独立分享版。设计见[图片请帖记录](docs/v3/poster-design.md)，导出与验收见[海报验收记录](docs/v3/poster-verification.md)。`artifacts/v2/`内请帖和旧ZIP保留为历史版本。

正式信息依据本地执行包与配置；最新会话已重新确认视觉方向，以 `docs/v3/`记录为准，旧执行包不再约束新版的布局和字体。执行包从 `Downloads/our-wedding-agent-pack` 复制，未放进公开资源。用户明确要求二维码融入整体设计；后续新版请帖仍须验证实际扫码。

## 运行与构建

```sh
npm ci
npm run dev
```

开发地址为 `http://localhost:5173/our-wedding/`。先检查并复用现有服务，不重复启动。

```sh
npm test
npm run build
npm run preview
```

生产预览为 `http://127.0.0.1:4173/our-wedding/`，默认绑定局域网，同一Wi-Fi的手机可使用Vite显示的Network地址。构建会生成页面专用配置、CSS 变量和同一事实来源的无脚本基础信息，再执行类型检查。已有 `public/photos/` 优化图与字体子集时，安装和构建不需要47张原图、交接包或Python工具。

## 正式信息与文案

| 文件 | 用途 |
|---|---|
| `config/wedding.json` | 姓名、日期、三项日程、父母、场地、电话、网址、二维码载荷 |
| `config/copy.json` | H5、四版请帖、功能提示的定稿文案 |
| `config/design-tokens.json` | 色彩、字号基准、版心、触控、二维码参数 |
| `config/selection-plan.json` | 6张H5照片、正式主图与备用图的角色 |
| `config/photo-review.json` | 与8张候选原图哈希绑定的人工复核记录 |
| `src/generated/page.json` | 从上述母本生成的H5子集，不手工编辑 |

正式信息：2026年12月24日（星期四），农历丙午年十一月十六；上午10:30欢迎到场，11:00户外仪式在附楼四合院，中午12:00婚宴在主楼A栋三楼5号厅。酒店为新饭店，地址为江西省赣州市赣县区杨仙大道北侧。联系新郎戚培俊：18126072587。14:00仅为配置内部估计，不对宾客显示。

改数据后执行 `npm run build`，重新导出四张图片；`npm test` 中保留当前定稿的事实断言，正式信息改变时需一起按用户确认更新。日历按钮、代码、`.ics`生成与下载流程已删除，不再维护旧日历字段。

页面不打包父母请帖文案或内部结束时间。文字不会从旧效果图或网络资料提取。

## 摄影与地图

后续讨论设计与选片时，先查阅 [原始摄影素材档案](docs/photo-catalog.md)，按主题或文件名筛选，再打开候选原图细看；无需每轮重新扫描全部素材。档案中的设计建议不等于已确认方案。

- `docs/photo-catalog.md`：全部 47 张原图的画面描述、构图与留白、潜在用途、复核提醒和主题检索入口。
- `source/`：47张高分辨率原始JPEG，只读使用，不随Git或网站发布。
- `docs/v2/source-inventory.json`：本轮实际47张文件的尺寸、方向、哈希及原档案一致性。
- `docs/v2/photo-selection.json`：本轮8张候选的原图复核、角色、无裁切记录与网页衍生图路径/尺寸/字节数。
- `public/photos/`：仅六张网页照片的480/800/1200/1600px WebP与1200px JPEG回退。
- `src/assets/venue-map.svg`：沿用既有周边道路示意图，直接以大图完整展示，无图注和二次点击；不虚构楼栋入口、停车位或路线。它不是酒店内部楼层图。

换片必须先复核原图，更新选片配置、描述和视觉审阅记录，再执行：

```sh
npm run photos:prepare
npm run qa:content
npm run build
```

`photos:prepare`检查原图哈希，应用方向、sRGB等比缩放并移除EXIF/GPS。旧网页衍生图移入本地 `artifacts/v2/retired-photos/`，不删除原图、不发布未选片。脚本校验 `config/photo-review.json` 中人工复核记录与文件哈希一致；更换照片时必须实际复核后更新记录，不能把脚本执行当成自动视觉审阅。

## 背景音乐

已接入用户提供的《这一天，与你》60秒循环版，仅发布 `public/audio/the-day-with-you-loop.mp3`。进入页面尝试播放，受限时可通过首次页面触摸或点击再次尝试；右上角保留简洁音符，可随时暂停。手动暂停后普通交互不再唤起。切后台、导航或拨号前暂停，返回后不自动恢复。来源、文件校验、播放规则和真机边界见 [音乐接入记录](docs/v3/music/README.md)。

## 字体

开场标题使用透明定制字形，原图与生成提示词见 [标题素材记录](docs/v3/artwork-generation.md)。姓名与段落标题使用Adobe思源宋体CN SemiBold的文案子集，修改后名称为 `Wedding Serif`，600字重；字体文件约64KB，自托管，不从境外字体CDN加载。许可在 `public/fonts/OFL.txt`，来源、哈希及缺字核验在 `docs/v2/font-manifest.json`。H5正文使用系统黑体；图片导出正文固定为macOS的PingFang SC；H5与朋友海报按用户对比后的决定恢复旧版「我们结婚啦」艺术字及原比例；其余三张采用「婚礼请柬」行书。海报使用矢量轮廓，H5使用旧版2062×763透明WebP。

改动文字引入新字时，从[Adobe官方仓库](https://github.com/adobe-fonts/source-han-serif/tree/release/SubsetOTF/CN)取得 `SourceHanSerifCN-SemiBold.otf` 和[许可](https://github.com/adobe-fonts/source-han-serif/blob/master/LICENSE.txt)，在独立Python环境安装 `fonttools==4.67.0`、`brotli==1.2.0` 后执行：

```sh
python3 scripts/prepare-fonts.py /绝对路径/SourceHanSerifCN-SemiBold.otf /绝对路径/LICENSE.txt
npm run build
```

子集只在本地处理，保留OFL版权和许可，修改字库名称不使用保留名Source。下载源字体不放进public。

## 四张图片请帖与二维码

四个版本为朋友、长辈、男方父母、女方父母，统一使用完整招手原片。海报独立排版，不直接截取H5。导出需本机Google Chrome、macOS PingFang SC、`source/9.1032978.jpg`（4000×6000）、自托管字体与 `docs/v3/assets/` 内两组标题SVG，不启动网站，不访问线上服务。

```sh
# 全部4版：4K母版与独立分享版
npm run invitation:export
# 单版：friends / elders / groom-parents / bride-parents
npm run invitation:export -- --variant friends
# 全部导出后：检查两套二维码源文件及8张成品的16个码位
npm run qa:qr
```

输出在 `artifacts/v3/posters/`：

- `invitation-<variant>-master.png`：3840px宽PNG母版，原片直接缩至目标宽度，完整保留人物与裙摆。
- `invitation-<variant>-share.jpg`：独立1080px宽、96质量、4:4:4分享版，**待微信真机转发验证**。
- `qr-wedding.png/.svg`、`qr-navigation.png/.svg`：母版真实二维码；`share-qr/`保存分享尺寸的独立源码。
- `manifest-all.json`：原片哈希、每个输出的尺寸/字节数/字体、渲染文字、最终码位与回读记录。单版导出仅更新自己的 `manifest-<variant>.json`；交付全部版本前执行全量导出。
- `invitation-<variant>.html`：离线可复查母版DOM，不放进生产网站。

逻辑宽360px，母版输出3840px、分享输出1080px。等待字体及所有图片解码后，按内容实际高度渲染。中文姓名与正文由字体直接输出，全部艺术标题为矢量路径；不放大旧1080px请帖，不用网页压缩图冒充原片。

二维码为深酒红/米白，米白与整张信息区一致，码点外角与定位框适度圆润。使用M纠错、4模块静区、整数像素模块；母版和分享版分别生成，再原生合成到各自成品。每张最终图片两个码位都需解码；母版码区逐像素核验与原始码图一致，圆角边缘保留必要抗锯齿；分享版增加75%缩小及JPEG质量80再压缩检查。码指向现有正式H5和高德链接，本地导出不代表网站发布或微信实测通过。

两组当前标题的透明SVG、4K PNG与源稿打包于 `artifacts/v3/wedding-title-assets.zip`。四版完整包为 `artifacts/v3/wedding-posters-4k-and-share.zip`，分享包为 `artifacts/v3/wedding-posters-share.zip`。

本轮确认文案见[文案定稿](docs/v3/copy-final.md)，H5与四张图片采用各自完整口吻，10:30统一标为「建议到场」。

阅读预览与原像素细节在 `artifacts/v3/poster-previews/`；视觉取舍见[设计记录](docs/v3/poster-design.md)。PNG母版适合保存和细看，分享版便于发送；微信压缩可能改变清晰度和扫码表现，需实际转发检查。

## 验证与交付

```sh
npm test
npm run build
npm run qa:content
# 复用上面已启动的生产预览
npm run qa:visual
# 也可指定本项目预览地址
PREVIEW_URL=http://127.0.0.1:4173/our-wedding/ npm run qa:visual
npm run invitation:export
npm run qa:qr
```

`qa:visual`使用无头Chrome，截图320/360/390/430/1440px，验证原图比例、文字安全区、日程、资源、固定栏、复制成功/拒绝/不可用及焦点恢复、正文示意图展示、导航请求、无JS信息、图片失败与主动重试。最新精修通过内置浏览器复验，完整自动化基线与本轮证据分列于验证记录。微信UA模拟只核对网页链接行为，不能替代微信真机。

- [当前H5设计与交互记录](docs/v3/h5-design.md)
- [当前H5验证记录](docs/v3/verification.md)
- 页面截图：`artifacts/v3/screenshots/`，另含430px三倍像素密度手机截图。
- [旧V2实现记录](docs/v2/implementation.md)、[旧V2验收报告](docs/v2/acceptance.md)
- 四图360px阅读预览：`artifacts/v2/previews/`
- `docs/visual-plan.md`与`docs/verification.md`保留V1历史记录，不代表新版验收。

## 发布边界

正式网址保持 [qipeijun.github.io/our-wedding/](https://qipeijun.github.io/our-wedding/)，高德链接保持 [新饭店](https://surl.amap.com/2siOh8Ng46li)。`vite.config.ts` 从配置读取 `/our-wedding/`，避免子路径资源404。

当前开发分支为 `codex/design-v2`。本地 `main` 保存此前GitHub Pages静态产物，含旧日历文件；当前开发分支没有自动部署工作流。本版按用户要求保存本地提交，不推送、合并或覆盖线上版本，不创建新的部署平台或自动发布动作。后续获准发布时，沿用既有静态站点方式完整替换发布产物，并移除旧的 `.ics`，不要把源码、原图、设计包或artifacts整体上传。

微信iPhone/Android、国内蜂窝网络/Wi-Fi、转发压缩后双码识别、实际导航与拨号均需真机测试。`share`文件名不表示已通过微信测试。页面不承诺微信原生位置或自定义分享卡片，无公众号鉴权、数据采集与后台接口。
