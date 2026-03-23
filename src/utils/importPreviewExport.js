/**
 * 导入解析结果导出为 xlsx（与后端 previewRows 结构一致：对象数组，key 为表头中文名）
 */
export function loadXlsxScript() {
  return new Promise((resolve, reject) => {
    if (typeof window.XLSX !== 'undefined') {
      resolve()
      return
    }
    const existing = document.querySelector('script[src*="xlsx"]')
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => {
        existing.setAttribute('data-loaded', 'true')
        resolve()
      })
      existing.addEventListener('error', () => reject(new Error('加载 Excel 库失败')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
    script.onload = () => {
      script.setAttribute('data-loaded', 'true')
      resolve()
    }
    script.onerror = () => reject(new Error('加载 Excel 库失败'))
    document.head.appendChild(script)
  })
}

export async function exportPreviewRowsToXlsx(previewRows, fileName) {
  if (!previewRows || !previewRows.length) {
    return
  }
  await loadXlsxScript()
  const XLSX = window.XLSX
  const headers = Object.keys(previewRows[0])
  const aoa = [headers]
  previewRows.forEach((row) => {
    aoa.push(headers.map((h) => (row[h] !== undefined && row[h] !== null ? row[h] : '')))
  })
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '解析结果')
  XLSX.writeFile(wb, fileName || `import_preview_${Date.now()}.xlsx`)
}
