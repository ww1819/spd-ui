import { parseTime } from '@/utils/ruoyi'

/** 列表默认日期：止=今天，起=往前 days 天（默认 5） */
export function buildDefaultDateRange(days = 5) {
  const today = new Date()
  const endDate = parseTime(today, '{y}-{m}-{d}')
  const begin = new Date(today)
  begin.setDate(begin.getDate() - days)
  const beginDate = parseTime(begin, '{y}-{m}-{d}')
  return { beginDate, endDate }
}

/** 患者收费/高值页：字段名为 beginChargeDate、endChargeDate */
export function buildDefaultChargeDateRange(days = 5) {
  const { beginDate, endDate } = buildDefaultDateRange(days)
  return { beginChargeDate: beginDate, endChargeDate: endDate }
}
