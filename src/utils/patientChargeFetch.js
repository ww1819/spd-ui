import { Loading } from 'element-ui'

/** HIS 计费抓取/补全：默认分段间隔（自然日） */
export const CHARGE_FETCH_DEFAULT_CHUNK_DAYS = 5
export const CHARGE_FETCH_MAX_CHUNK_DAYS = 7

/** 单段 HTTP 超时（毫秒）：对齐后端 query-timeout-seconds(600s) + 合并余量 */
export const PATIENT_CHARGE_SEGMENT_TIMEOUT_MS = 720000

/** 分段任务进行中提示（弹窗说明用） */
export const PATIENT_CHARGE_HIS_SLOW_HINT =
  'HIS 数据库响应可能较慢，将按间隔天数自动分段查询；单段最长约 10 分钟，处理期间请勿关闭页面。'

export function normalizeChargeFetchChunkDays(value) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) {
    return CHARGE_FETCH_DEFAULT_CHUNK_DAYS
  }
  return Math.min(CHARGE_FETCH_MAX_CHUNK_DAYS, Math.max(1, n))
}

function parseDateTime(str) {
  if (!str) return null
  const s = String(str).trim().replace(/\//g, '-')
  if (s.length <= 10) {
    return new Date(s + 'T00:00:00')
  }
  return new Date(s.replace(' ', 'T'))
}

function pad(n) {
  return n < 10 ? '0' + n : String(n)
}

function formatDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
}

function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
}

function addDays(d, days) {
  const r = new Date(d.getTime())
  r.setDate(r.getDate() + days)
  return r
}

/**
 * 按间隔自然日切分计费时间闭区间 [beginDate, endDate]。
 * 首段保留 beginDate 时分秒，末段保留 endDate 时分秒。
 */
export function splitChargeFetchDateRange(beginDate, endDate, chunkDays) {
  const interval = normalizeChargeFetchChunkDays(chunkDays)
  const start = parseDateTime(beginDate)
  const end = parseDateTime(endDate)
  if (!start || !end || end.getTime() < start.getTime()) {
    return []
  }
  const segments = []
  let cursor = new Date(start.getTime())
  const endMs = end.getTime()
  while (cursor.getTime() <= endMs) {
    const segBegin = segments.length === 0 ? new Date(cursor.getTime()) : startOfDay(cursor)
    const lastDay = addDays(startOfDay(segBegin), interval - 1)
    let segEnd = endOfDay(lastDay)
    if (segEnd.getTime() > endMs) {
      segEnd = new Date(endMs)
    }
    segments.push({
      beginDate: formatDateTime(segBegin),
      endDate: formatDateTime(segEnd)
    })
    const next = addDays(startOfDay(segEnd), 1)
    cursor = next
  }
  return segments
}

function isTimeoutError(error) {
  const msg = error && error.message ? String(error.message) : ''
  return msg.includes('timeout') || msg.includes('超时')
}

/** 将 axios / 业务错误转为面向 HIS 慢查询的友好文案 */
export function formatHisChargeSlowError(error, options = {}) {
  const msg = error && error.message ? String(error.message) : ''
  if (isTimeoutError(error)) {
    return options.timeoutMsg ||
      'HIS 数据库响应较慢，本段查询超时。请缩小时间范围或减小间隔天数后重试。'
  }
  if (msg.includes('Network Error') || msg.includes('连接异常') || msg.includes('代理')) {
    return '网络或代理连接中断。若后台仍在处理，请稍后在列表中核对结果，勿重复提交。'
  }
  if (msg.includes('数据正在处理，请勿重复提交')) {
    return msg
  }
  return msg || options.fallbackMsg || '操作失败，请稍后重试'
}

function formatSegmentRange(seg) {
  if (!seg) return ''
  return `${seg.beginDate || ''} ~ ${seg.endDate || ''}`
}

/**
 * 按段执行 HIS 抓取/补全：全屏 Loading + 段进度文案，避免长时间无反馈被误判为卡死。
 */
export async function runPatientChargeSegments({ segments, runOneSegment, getProgressText }) {
  const total = segments.length
  let loadingInstance = null

  const showLoading = (text) => {
    if (loadingInstance && typeof loadingInstance.setText === 'function') {
      loadingInstance.setText(text)
      return
    }
    if (loadingInstance) {
      loadingInstance.close()
    }
    loadingInstance = Loading.service({
      lock: true,
      text,
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0.7)'
    })
  }

  try {
    for (let i = 0; i < total; i++) {
      const seg = segments[i]
      const cur = i + 1
      const text = typeof getProgressText === 'function'
        ? getProgressText(cur, total, seg)
        : `正在从 HIS 查询第 ${cur}/${total} 段（${formatSegmentRange(seg)}），请耐心等待…`
      showLoading(text)
      await runOneSegment(seg, i)
    }
  } finally {
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }
}
