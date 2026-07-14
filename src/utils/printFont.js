/** 单据浏览器打印统一字体（针式：比宋体横笔实、比黑体细） */
export const PRINT_FONT_FAMILY = '"Microsoft YaHei", "微软雅黑", "PingFang SC", sans-serif'

/** 注入到 $print iframe 末尾，避免其它页 @media print 盖回宋体 */
export const PRINT_FONT_EXTRA_STYLE =
  'html,body,.browser-print-root,.browser-print-root *,' +
  '.receipt-print,.receipt-print *,.detail-table,.detail-table *,' +
  '.print-page,.print-page *,.print-copy-block,.print-copy-block *,' +
  '.print-sign-footer-fixed,.print-sign-footer-fixed *{' +
  'font-family:' +
  PRINT_FONT_FAMILY +
  '!important}' +
  '@media print{' +
  'html,body,.browser-print-root,.browser-print-root *,' +
  '.receipt-print,.receipt-print *,.detail-table,.detail-table *,' +
  '.print-page,.print-page *,.print-copy-block,.print-copy-block *,' +
  '.print-sign-footer-fixed,.print-sign-footer-fixed *{' +
  'font-family:' +
  PRINT_FONT_FAMILY +
  '!important}}'

export function applyPrintFontToEl(el) {
  if (!el || !el.style) return
  try {
    el.style.setProperty('font-family', PRINT_FONT_FAMILY, 'important')
    const table = typeof el.querySelector === 'function' ? el.querySelector('.detail-table') : null
    if (table && table.style) {
      table.style.setProperty('font-family', PRINT_FONT_FAMILY, 'important')
    }
  } catch (e) {
    /* ignore */
  }
}

/** $print 公用选项：纸张 210×140 + 字体兜底 */
export function browserPrintOptions(extra) {
  return Object.assign(
    {
      injectPageSize: true,
      pageMargin: '0 4mm',
      waitForAssets: true,
      beforePrintDelay: 320,
      extraStyle: PRINT_FONT_EXTRA_STYLE
    },
    extra || {}
  )
}
