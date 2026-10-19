# 我们的婚礼 · 电子请柬

Vue 3 + Vite + TypeScript 的单页婚礼请柬。依据 47 张真实精修婚纱照选用 8 张，保留照片原始比例、色彩和人物面貌。无后端、账户、数据采集或背景音乐。

## Git 与素材管理

- 提交源码、依赖锁文件、测试、选片文档与 JSON 索引，以及 `public/photos/` 中网页实际使用的 8 张照片的优化版本（合计约 3.9 MiB）。`src/generated/photos.json` 是运行必需的图片映射，也随代码提交。
- 不提交约 665 MiB 的 `source/` 原图、全量联系表与缩略图、`artifacts/` 截图和导出稿、`dist/`、`node_modules/`。这些文件保留在本地，已通过 `.gitignore` 排除。
- `public/wedding.ics` 在开发启动或构建时生成，不提交。拉取代码后安装依赖即可开发、构建，无需取得全部原图。
- 重新选片、制作全素材联系表或导出高分辨率静态请柬时，需先将原图按原文件名放回 `source/`。原图请另行备份；Git 不承担原始素材备份。

## 本地运行

使用满足 Vite 要求的 Node.js（20.19+ 或 22.12+，本次使用 26.7）。

```sh
npm ci
npm run dev
```

默认开发地址 `http://localhost:5173`。已有服务时直接复用，不重复启动。

构建及预览：

```sh
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

预览地址 `http://127.0.0.1:4173/`。生产部署仅上传 `dist/`；不要上传包含原图的项目根目录。资源采用相对路径，可部署到 HTTPS 静态托管的根目录或子目录。无路由，无需 SPA rewrite。

## 婚礼信息

统一修改 `src/config/wedding.ts`：

| 字段 | 填写规则 |
|---|---|
| groomName / brideName | 新人真实姓名 |
| weddingDate | `YYYY-MM-DD` |
| ceremonyTime / endTime | `HH:mm`，均为中国标准时间；结束时间可留空，此时生成赴约时刻提醒 |
| endDate | 跨日才填写，否则留空表示当日 |
| banquetTime | 可选，`HH:mm` |
| ceremonyVenue / banquetVenue | 仪式、宴席各自所在的楼栋或宴会厅 |
| venueName / venueRegion | 已按新人确认填写赣州新饭店及所在地区 |
| venueAddress | 酒店真实详细地址，不以地区代替 |
| location | 使用高德/腾讯提供的 **GCJ-02** 经纬度；核实酒店入口后设置 confirmed 为 true |
| invitationText / closingText / copy | 页面文案，支持显式换行 |
| titleStyle | `xi` 为「囍」字版本 B；`text` 为文字版本 A |
| publicUrl / publicUrlVerifiedOn | 已部署公开 HTTPS 网址及实际检查日期（`YYYY-MM-DD`） |
| mapShareUrl / mapShareUrlVerifiedOn | 人工验证能到达正确场地的 HTTPS 地图分享链接及检查日期 |
| calendarUid | 稳定事件标识；调整婚期时保留，不要反复重建 |

已确认：戚培俊、涂丽纯；2026 年 12 月 24 日（星期四）；仪式 11:00，在新饭店附楼；午宴 12:00，在新饭店主楼；酒店为赣州新饭店，江西省赣州市赣县区梅林镇杨仙大道21号。仍缺结束时间和酒店入口坐标。日历已可生成 11:00 赴约提醒，不填写未知的结束时间；普通浏览器已可通过新人提供的分享链接直达高德地点。更新配置后重新构建；不需要修改组件。

## 选片和素材目录

- `source/`：47 张原始精修图，保持独立，所有脚本只读这里。
- `docs/visual-plan.md`：视觉方案、全部 8 张入选及 39 张未选理由。
- `docs/assets/inventory.json`：原图尺寸、比例、格式、字节数、SHA-256。
- `docs/assets/selection.json`：本轮视觉分组、入选与未入选文件列表的机器可读快照。
- `docs/assets/contact-sheet-1.jpg` 至 `contact-sheet-4.jpg`：全部素材联系表。
- `docs/assets/thumbnails/`：全素材缩略图，不随网站部署。
- `src/config/photos.ts`：页面选片、图库顺序、布局与焦点配置。
- `public/photos/`：网站优化图，WebP 480/800/1200px，JPEG 1200px 回退；不包含原图或未选片。
- `src/generated/photos.json`：优化图与原文件名、尺寸的映射，由脚本生成。

换片操作：

1. 将精修原图放入 `source/`。
2. 修改 `src/config/photos.ts` 中对应文件名、中文描述、组合顺序及焦点。
3. 执行 `npm run photos:prepare`，再执行 `npm run build`。
4. 重新检查封面留白与移动端截图，特别是更换封面时。默认 `width:100%; height:auto; object-fit:contain` 完整展示，不会为固定模板强行裁切。焦点已经绑定 `object-position`，原比例完整显示时无需偏移。

图库布局：`pair` 为双图；`full` 为通栏原比例；`inset` 为竖幅与独立文字留白。原图文件名仅作索引，顺序来自人工视觉选片。重新盘点全素材可执行 `npm run photos:index`。此命令只生成索引和联系表，**不会自动判断人物内容或替代视觉选片**。

## 日历与导航

日历按照 `Asia/Shanghai` 解释时间，输出等价 UTC 时间的 RFC 5545 `.ics`，含提前一天与提前两小时提醒，处理 CRLF、文本转义和 UTF-8 字节折行。下载后仍需用户在日历应用确认，网页不会宣称已添加。结束时间未定时，按 RFC 5545 省略 DTEND，标题明确为赴约提醒；不猜测婚礼时长。Google 日历入口仅在结束时间齐备后提供，需要相应网络及账户，并由用户核对提醒。

构建会生成 `public/wedding.ics` 并复制到部署产物，使用普通文件 URL 而非临时 Blob。iOS 在 HTTPS 网页中提供 `webcal` 订阅入口及下载/苹果邮件导入说明；本地 HTTP 仅提供下载与手动设置。安卓提供文件下载、支持导入的日历打开说明，以及手动新建日程的流程。Google 官方说明 Android 日历导入需在电脑执行，因此不能承诺所有安卓机型都能直接导入文件。微信内引导在系统浏览器打开，保留复制信息手动设置，不展示不可用的下载或订阅按钮。

微信原生订阅通知尚未接入：官方 `wx-open-subscribe` 需要已认证服务号、JS 接口安全域名和有效模板；发送还需服务端保存授权并定时调用通知 API。现有项目没有账号、模板和服务端契约，不添加假订阅按钮、不把用户同意订阅当作通知已发送。

普通浏览器点击「导航前往」直接打开新人确认的分享链接 `https://surl.amap.com/2siOh8Ng46li`。2026-10-19 已检查 HTTP 重定向，目标为「新饭店 · 杨仙大道北侧」，POI ID 为 `B031D0R7BT`。这里只确认链接对应地点，未完成真实手机导航或现场路线验收。未配置分享链接时，才使用已有的坐标标注或完整地址搜索。正式 PNG 的定位二维码也使用此分享链接，不再要求额外填写酒店入口坐标。

微信期望使用 `wx.openLocation` 打开原生位置页。**当前尚未接入**：需要具备该接口权限的公众号/服务号、配置好的 JS 接口安全域名、服务端签名能力和确认的坐标。现有项目没有签名服务，也未提供其 API 契约，因此没有猜测接口或添加后端。微信导航目前明确提示未开通并提供地址复制，不把腾讯地图网页冒充原生微信位置。若没有公众号，可另行确认是否改为微信内打开腾讯地图网页。

复制功能仅在 Clipboard API 返回成功后提示已复制；权限被拒或 API 不可用时展示可选中的完整文字。

## 静态图片请柬

导出需要本机安装 Google Chrome（Playwright 的 `channel: chrome`），不需要启动网站。

```sh
# 可立即生成的设计稿：缺失信息明确标注，不生成假二维码
npm run invitation:export -- --draft

# 配置真实信息、部署并实际验证链接后，生成正式 PNG 和两个二维码
npm run invitation:export
```

输出在 `artifacts/`。设计稿为 `invitation-draft.png`；正式文件为 `invitation.png`、`qr-wedding.png`、`qr-location.png`。正式导出有配置门槛，缺少确认信息会失败，不会偷偷使用样例 URL。二维码由 QR 编码库生成，分别在二维码原图和最终请柬缩放图中解码回读。机器回读通过不等于微信实机扫码通过。

当前还缺仪式/结束时间、确认坐标、部署网址和已验证地图分享链接，因此只交付更新后的设计稿和可复用导出工具，未生成正式双二维码请柬，也未发布远端。

## 验证

```sh
npm run typecheck
npm test
# 先运行 preview，再执行；也可用 PREVIEW_URL 指定已经运行的本项目地址
npm run test:browser
```

浏览器脚本使用独立无头 Chrome，检查 7 个尺寸、姓名日期与分楼栋日程、图片比例、无横向溢出、实际日历下载、模拟 iOS/安卓/微信及 HTTPS 子目录入口、高德分享链接请求、焦点返回、减少动画和复制权限拒绝。高德请求在测试中被截获，不代表实际高德客户端或路线验收。截图与机器报告位于 `artifacts/`，详细边界见 `docs/verification.md`。

## 微信兼容性边界

- iOS Safari / Chrome 及现代微信内核需要支持 ES2018、CSS Grid 和原生 `<dialog>`。Safari 原生 dialog 需 15.4+；旧版微信内核需实机确认，未宣称兼容所有历史版本。
- 微信对下载 `.ics`、唤起 App、剪贴板有环境限制。页面提供系统浏览器提示、网页地图及手动复制。
- 浏览器中模拟微信 UA 只检查提示分支，不能代替 iPhone / Android 微信真机验证。
- 不依赖微信 JSSDK，因此不保证自定义分享卡片缩略图。任务范围内的静态图片请柬可单独发给宾客。
- 没有试图将微信原生位置消息转换成未经验证的网页二维码。

## 契约依据

- [RFC 5545 iCalendar](https://www.rfc-editor.org/rfc/rfc5545)
- [高德 URI API](https://developer.amap.com/api/uri-api/gettingstarted)
- [百度地图 Web URI](https://lbs.baidu.com/docs/webapi?title=mapadjustment%2Furi%2Fweb)
- [腾讯地图 Web 标点 URI](https://lbs.qq.com/webApi/uriV1/uriGuide/uriWebMarker)
- [Google Calendar 活动编辑链接](https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events)
- [微信官方 JS-SDK：openLocation、域名与签名](https://developers.weixin.qq.com/doc/service/guide/h5/jssdk)

## 周边线条地图

`src/assets/venue-map.svg` 根据新人提供的两张高德地图截图绘制，保留饭店、道路、河岸及主要地标的相对关系。仅作非等比例周边示意，不表达精确坐标、楼栋入口或行车路线。H5 支持点击查看 SVG 大图；静态请柬复用同一文件，导出时另存 `artifacts/venue-map.png`。仪式与午宴的楼栋名称仍集中在婚礼配置中。

提醒兼容性依据：

- [Apple 日历账户与 ICS 导入](https://support.apple.com/zh-cn/guide/iphone/-ipha0d932e96/ios)
- [Google Android 日历导入说明](https://support.google.com/calendar/answer/37118?co=GENIE.Platform%3DAndroid&hl=zh-Hans)
- [微信网页订阅通知开放标签](https://developers.weixin.qq.com/doc/service/guide/h5/opentag)
- [RFC 5545 VEVENT 定义](https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1)
