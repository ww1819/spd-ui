import { exportPreviewRowsToXlsx } from '@/utils/importPreviewExport'

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
 * @param {String} options.fileName 文件名
 * @param {'all'|'currentPage'} options.mode 导出模式
 * @param {number} options.pageSize 分页拉取大小（mode=all 时生效）
 * @param {number} options.pageNum 当前页（mode=currentPage 时生效）
 * @param {Function} options.rowFilter 行过滤函数：(row)=>boolean
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
  await exportPreviewRowsToXlsx(mappedRows, opts.fileName || `table_export_${Date.now()}.xlsx`)
  return { rowCount: mappedRows.length }
}

