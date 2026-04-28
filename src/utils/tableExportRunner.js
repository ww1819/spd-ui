import { exportPreviewRowsToXlsx } from '@/utils/importPreviewExport'

/** 报表文件名：报表标题 + 日期起_日期止.xlsx（非法文件名字符替换为下划线） */
export function buildReportFileName(reportTitle, query, dateRangeKeys) {
  const keys = dateRangeKeys || { start: 'beginDate', end: 'endDate' }
  const q = query || {}
  const norm = (v) => {
    if (v == null || v === '') return ''
    const s = String(v).trim()
    if (!s) return ''
    return s.replace(/\//g, '-').slice(0, 10)
  }
  const start = norm(q[keys.start])
  const end = norm(q[keys.end])
  const today = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const d0 = start || today()
  const d1 = end || start || today()
  const title = (reportTitle != null && String(reportTitle).trim()) ? String(reportTitle).trim() : '报表'
  const base = `${title}${d0}_${d1}.xlsx`
  return base.replace(/[/\\?%*:|"<>]/g, '_')
}

/** 与 buildReportFileName 对应的表内首行标题（无 .xlsx 后缀） */
export function buildReportTopTitle(reportTitle, query, dateRangeKeys) {
  return buildReportFileName(reportTitle, query, dateRangeKeys).replace(/\.xlsx$/i, '')
}

function toRows(resp) {
  if (!resp) return []
  if (Array.isArray(resp)) return resp
  if (Array.isArray(resp.rows)) return resp.rows
  if (resp.data && Array.isArray(resp.data.rows)) return resp.data.rows
  if (Array.isArray(resp.data)) return resp.data
  return []
}

function toTotal(resp, fallback) {
  const n = Number(resp && (resp.total != null ? resp.total : (resp.data && resp.data.total)))
  if (Number.isFinite(n) && n >= 0) return n
  return fallback
}

function getValueByPath(obj, path) {
  if (!obj || !path) return undefined
  const segs = String(path).split('.')
  let cur = obj
  for (let i = 0; i < segs.length; i++) {
    if (cur == null) return undefined
    cur = cur[segs[i]]
  }
  return cur
}

function mapRows(columns, rows) {
  return rows.map((row, index) => {
    const out = {}
    columns.forEach((col) => {
      const label = col && col.label != null ? String(col.label) : ''
      if (!label) return

      let raw
      if (typeof col.valueGetter === 'function') {
        raw = col.valueGetter(row, index)
      } else if (col.prop) {
        raw = getValueByPath(row, col.prop)
      } else {
        raw = undefined
      }

      let value = raw
      if (typeof col.formatter === 'function') {
        value = col.formatter(raw, row, index)
      }
      out[label] = value == null ? '' : value
    })
    return out
  })
}

/**
 * 通用表格导出执行器（数据驱动的“所见即所得”）
 *
 * @param {Object} options
 * @param {Array} options.columns 列配置：[{ label, prop?, valueGetter?, formatter? }]
 * @param {Function} options.fetchPage 分页查询函数：(params) => Promise<{rows,total}>
 * @param {Object} options.query 查询条件（不含分页）
 * @param {String} options.fileName 文件名（若与 reportTitle 同时存在，优先 fileName）
 * @param {String} options.reportTitle 报表标题，用于生成文件名：标题+日期起_日期止.xlsx
 * @param {{ start?: string, end?: string }} options.dateRangeKeys query 中日期字段名，默认 beginDate / endDate
 * @param {'all'|'currentPage'} options.mode 导出模式
 * @param {number} options.pageSize 分页拉取大小（mode=all 时生效）
 * @param {number} options.pageNum 当前页（mode=currentPage 时生效）
 * @param {Function} options.rowFilter 行过滤函数：(row)=>boolean
 * @param {Object|Function} options.summaryRow 合计行：与列 label 同 key 的对象；或函数 ({ mappedRows, rawRows, columns }) => 合计行对象
 * @param {string} options.sheetName 工作表名称
 * @param {string|false|undefined} options.sheetTopTitle 表内首行大标题；不传且存在 reportTitle 时自动生成（与文件名一致）；传 false 或空串则不插入
 * @returns {Promise<{ rowCount: number }>}
 */
export async function runConfiguredTableExport(options) {
  const opts = options || {}
  const columns = Array.isArray(opts.columns) ? opts.columns : []
  if (!columns.length) {
    throw new Error('导出失败：未提供列配置')
  }
  if (typeof opts.fetchPage !== 'function') {
    throw new Error('导出失败：未提供查询方法 fetchPage')
  }

  const query = { ...(opts.query || {}) }
  const mode = opts.mode || 'all'
  const pageSize = Number(opts.pageSize) > 0 ? Number(opts.pageSize) : 500
  const pageNum = Number(opts.pageNum) > 0 ? Number(opts.pageNum) : 1
  const rowFilter = typeof opts.rowFilter === 'function' ? opts.rowFilter : null

  let fileName = opts.fileName
  if (!fileName && opts.reportTitle) {
    fileName = buildReportFileName(opts.reportTitle, query, opts.dateRangeKeys)
  }
  fileName = fileName || `table_export_${Date.now()}.xlsx`

  let rawRows = []
  if (mode === 'currentPage') {
    const resp = await opts.fetchPage({ ...query, pageNum, pageSize: query.pageSize || pageSize })
    rawRows = toRows(resp)
  } else {
    let page = 1
    let done = false
    let total = null
    while (!done) {
      const resp = await opts.fetchPage({ ...query, pageNum: page, pageSize })
      const chunk = toRows(resp)
      rawRows = rawRows.concat(chunk)

      if (total == null) {
        total = toTotal(resp, null)
      }
      if (total != null) {
        done = rawRows.length >= total
      } else {
        done = chunk.length < pageSize
      }
      page += 1
      if (page > 5000) {
        throw new Error('导出失败：分页拉取超过安全上限')
      }
    }
  }

  const filtered = rowFilter ? rawRows.filter(rowFilter) : rawRows
  if (!filtered.length) {
    throw new Error('没有可导出的数据')
  }

  const mappedRows = mapRows(columns, filtered)
  const headers = mappedRows.length ? Object.keys(mappedRows[0]) : []

  let summaryRow = null
  if (opts.summaryRow != null) {
    if (typeof opts.summaryRow === 'function') {
      summaryRow = opts.summaryRow({
        mappedRows,
        rawRows: filtered,
        columns,
        headers
      })
    } else if (typeof opts.summaryRow === 'object') {
      summaryRow = opts.summaryRow
    }
  }

  let sheetTopTitle = ''
  if (Object.prototype.hasOwnProperty.call(opts, 'sheetTopTitle')) {
    const v = opts.sheetTopTitle
    if (v !== false && v != null && String(v).trim()) {
      sheetTopTitle = String(v).trim()
    }
  } else if (opts.reportTitle) {
    sheetTopTitle = buildReportTopTitle(opts.reportTitle, query, opts.dateRangeKeys)
  }

  await exportPreviewRowsToXlsx(mappedRows, fileName, {
    summaryRow,
    sheetName: opts.sheetName || 'Sheet1',
    sheetTopTitle: sheetTopTitle || undefined
  })
  return { rowCount: mappedRows.length }
}

