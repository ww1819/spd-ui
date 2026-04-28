/** 使用 xlsx-js-style，支持导出单元格样式（加粗、字号、对齐等） */
const XLSX_STYLE_CDN =
  'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.min.js'

/**
 * 导入解析结果导出为 xlsx（与后端 previewRows 结构一致：对象数组，key 为表头中文名）
 */
export function loadXlsxScript() {
  return new Promise((resolve, reject) => {
    const marked = document.querySelector('script[data-spd-xlsx-export="1"]')
    if (marked && marked.getAttribute('data-loaded') === 'true') {
      resolve()
      return
    }
    if (marked) {
      marked.addEventListener('load', () => {
        marked.setAttribute('data-loaded', 'true')
        resolve()
      })
      marked.addEventListener('error', () => reject(new Error('加载 Excel 库失败')))
      return
    }
    const script = document.createElement('script')
    script.src = XLSX_STYLE_CDN
    script.setAttribute('data-spd-xlsx-export', '1')
    script.async = true
    script.onload = () => {
      script.setAttribute('data-loaded', 'true')
      resolve()
    }
    script.onerror = () => reject(new Error('加载 Excel 库失败'))
    document.head.appendChild(script)
  })
}

/**
 * @param {Array<Object>} previewRows 行数据，首行对象的 key 作为表头
 * @param {string} fileName 文件名
 * @param {Object} [extra]
 * @param {Object} [extra.summaryRow] 合计行：与表头同 key；在数据行之后追加一行
 * @param {string} [extra.sheetName] 工作表名称，默认「解析结果」
 * @param {string} [extra.sheetTopTitle] 首行大标题（跨列合并），在表头行之上
 */
export async function exportPreviewRowsToXlsx(previewRows, fileName, extra = {}) {
  if (!previewRows || !previewRows.length) {
    return
  }
  await loadXlsxScript()
  const XLSX = window.XLSX
  const headers = Object.keys(previewRows[0])
  const topTitle = extra && extra.sheetTopTitle && String(extra.sheetTopTitle).trim()
    ? String(extra.sheetTopTitle).trim()
    : ''

  const aoa = [headers]
  previewRows.forEach((row) => {
    aoa.push(headers.map((h) => (row[h] !== undefined && row[h] !== null ? row[h] : '')))
  })
  const summaryRow = extra && extra.summaryRow
  if (summaryRow && typeof summaryRow === 'object') {
    aoa.push(headers.map((h) => (summaryRow[h] !== undefined && summaryRow[h] !== null ? summaryRow[h] : '')))
  }

  if (topTitle) {
    const titleRow = [topTitle]
    for (let c = 1; c < headers.length; c++) {
      titleRow.push('')
    }
    aoa.unshift(titleRow)
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const headerRowIndex = topTitle ? 1 : 0

  if (topTitle && headers.length > 0) {
    if (!ws['!merges']) ws['!merges'] = []
    const lastCol = Math.max(0, headers.length - 1)
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } })

    const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 })
    const titleCell = ws[titleRef]
    if (titleCell && typeof titleCell === 'object') {
      titleCell.s = {
        font: { bold: true, sz: 18, name: '微软雅黑' },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      }
    }
  }

  /** 表头：加粗、深灰底、白字、居中 */
  const headerSheetStyle = {
    font: { bold: true, sz: 11, name: '微软雅黑', color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: '4A5568' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
  }
  for (let c = 0; c < headers.length; c++) {
    const ref = XLSX.utils.encode_cell({ r: headerRowIndex, c })
    const cell = ws[ref]
    if (cell && typeof cell === 'object') {
      cell.s = {
        font: { ...headerSheetStyle.font },
        fill: { ...headerSheetStyle.fill },
        alignment: { ...headerSheetStyle.alignment }
      }
    }
  }

  if (!ws['!rows']) ws['!rows'] = []
  if (topTitle) {
    ws['!rows'][0] = { hpt: 32 }
    ws['!rows'][headerRowIndex] = { hpt: 24 }
  } else {
    ws['!rows'][headerRowIndex] = { hpt: 24 }
  }

  const wb = XLSX.utils.book_new()
  const sheetName = (extra && extra.sheetName) || '解析结果'
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  XLSX.writeFile(wb, fileName || `import_preview_${Date.now()}.xlsx`)
}
