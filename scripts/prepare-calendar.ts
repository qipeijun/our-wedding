import { writeFile } from 'node:fs/promises'
import { wedding } from '../src/config/wedding'
import { createCalendar } from '../src/lib/calendar'

// 输出可直接访问、供手机导入或订阅的日历文件；配置无效时构建明确失败。
await writeFile('public/wedding.ics', createCalendar(wedding), 'utf8')
console.log('已生成婚礼日历 public/wedding.ics')
