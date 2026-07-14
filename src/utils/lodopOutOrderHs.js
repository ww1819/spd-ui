/**
 * 衡水出库单 Lodop HTML：仅用 table/基础 CSS（Lodop 不支持 grid/flex）
 * 版式按 outOrderPrintHs 屏上预览对齐（列宽、字号、间距）
 */

function esc(v) {
  if (v == null) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 与屏上 .print-head-grid：1.72fr 0.62fr 0.96fr 对齐
 * 约 52% / 19% / 29%
 */
const HEAD_COL = { a: '52%', b: '19%', c: '29%' }

/**
 * 与屏上 detail-table colgroup 一致
 */
const DETAIL_COLS = ['14%', '12%', '7%', '4%', '11%', '12%', '13%', '11%', '8%']

/**
 * @param {object} payload
 */
export function buildHsOutboundLodopHtml(payload) {
  const p = payload || {}
  const row = p.row || {}
  const pages = Array.isArray(p.detailPages) ? p.detailPages : [[]]
  const hospitalName = p.hospitalName || ''
  // 与屏上一致：表体/表头信息 12px；标题固定 20px（不要用正文 21 撑大标题）
  const tableFs = Math.round(Number(p.tableFontSize) || 12)
  const headFs = 12
  const titleFs = 20
  const signFs = 12
  const pageMetaFs = 12

  const fmtDate = typeof p.formatOutboundDate === 'function' ? p.formatOutboundDate : (v) => v || ''
  const fmtSpec = typeof p.formatSpecModel === 'function' ? p.formatSpecModel : () => ''
  const fmtNum = typeof p.formatNum === 'function' ? p.formatNum : (v) => (v == null ? '' : v)
  const fmtPrice = typeof p.formatPrice === 'function' ? p.formatPrice : (v) => (v == null ? '' : v)
  const fmtAmt = typeof p.formatAmt === 'function' ? p.formatAmt : (v) => (v == null ? '' : v)
  const fmtValid = typeof p.formatValidDate === 'function' ? p.formatValidDate : (v) => (v == null ? '' : v)

  const css =
    '<style type="text/css">' +
    'html,body{margin:0;padding:0;background:#fff;}' +
    'body{font-family:SimSun,"宋体","NSimSun","STSong",serif;color:#000;font-size:' +
    tableFs +
    'px;line-height:1.35;}' +
    /* 左右约 1 汉字宽度，贴近屏上 padding-left/right:1ch */
    '.page{width:100%;box-sizing:border-box;padding:2mm 1.5mm 2mm 1.5mm;}' +
    '.page-break{page-break-after:always;}' +
    /* 标题行：左右各 92px 占位，与 .doc-header 一致 */
    '.title-row{width:100%;border-collapse:collapse;margin:0 0 6px 0;}' +
    '.title-row td{border:none;padding:0;vertical-align:middle;}' +
    '.title-row .spacer,.title-row .page-meta{width:92px;}' +
    '.title-row .page-meta{text-align:right;font-size:' +
    pageMetaFs +
    'px;letter-spacing:0.5px;}' +
    '.title-row .doc-title{text-align:center;font-size:' +
    titleFs +
    'px;font-weight:normal;line-height:1.1;}' +
    /* 表头信息：列宽对齐 1.72/0.62/0.96 */
    '.head-table{width:100%;border-collapse:collapse;margin:0 0 6px 0;font-size:' +
    headFs +
    'px;}' +
    '.head-table td{border:none;padding:1px 0;vertical-align:middle;line-height:1.35;}' +
    '.head-table .lbl{white-space:nowrap;}' +
    /* 明细表：padding 与屏上 4px 6px 一致 */
    '.detail{width:100%;border-collapse:collapse;table-layout:fixed;border:1px solid #000;' +
    'font-size:' +
    tableFs +
    'px;margin:0 0 8px 0;}' +
    '.detail th,.detail td{border:1px solid #000;padding:4px 6px;vertical-align:middle;' +
    'word-wrap:break-word;word-break:break-all;line-height:1.35;}' +
    '.detail th{font-weight:bold;text-align:center;background:#f5f5f5;}' +
    '.detail .num{text-align:right;}' +
    '.detail .ctr{text-align:center;}' +
    '.detail .txt{text-align:left;vertical-align:top;}' +
    '.detail .total-label{text-align:left;font-weight:normal;}' +
    '.detail .total-amt{text-align:right;font-weight:normal;white-space:nowrap;}' +
    /* 签字区：三等分，与屏上 embed 预览一致 */
    '.sign-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:' +
    signFs +
    'px;}' +
    '.sign-table td{border:none;padding:2px 6px 2px 0;vertical-align:middle;width:33%;}' +
    '.sign-table .lbl{white-space:nowrap;}' +
    '</style>'

  const colgroupDetail =
    '<colgroup>' +
    DETAIL_COLS.map(function (w) {
      return '<col style="width:' + w + '"/>'
    }).join('') +
    '</colgroup>'

  const pageHtml = pages
    .map((detailPage, pageIndex) => {
      const isLast = pageIndex === pages.length - 1
      const breakCls = isLast ? 'page' : 'page page-break'
      const rows = (detailPage || [])
        .map((item) => {
          const it = item || {}
          return (
            '<tr>' +
            '<td class="txt">' +
            esc(it.materialName) +
            '</td>' +
            '<td class="txt">' +
            esc(fmtSpec(it)) +
            '</td>' +
            '<td class="num">' +
            esc(fmtNum(it.qty)) +
            '</td>' +
            '<td class="ctr">' +
            esc(it.unitName) +
            '</td>' +
            '<td class="num">' +
            esc(fmtPrice(it.unitPrice != null ? it.unitPrice : it.price)) +
            '</td>' +
            '<td class="num">' +
            esc(fmtAmt(it.amt)) +
            '</td>' +
            '<td class="txt">' +
            esc(it.factoryName) +
            '</td>' +
            '<td class="txt">' +
            esc(it.batchNumber) +
            '</td>' +
            '<td class="txt">' +
            esc(fmtValid(it.endTime || it.periodDate)) +
            '</td>' +
            '</tr>'
          )
        })
        .join('')

      // 与 Vue 模板一致：合计占前 4 列，金额横跨采购价+采购金额
      const totalRow = isLast
        ? '<tr>' +
          '<td colspan="4" class="total-label">合计：' +
          esc(row.totalAmtConverter) +
          '</td>' +
          '<td colspan="2" class="total-amt">' +
          esc(row.totalAmt != null ? fmtAmt(row.totalAmt) : '') +
          '</td>' +
          '<td colspan="3"></td>' +
          '</tr>'
        : ''

      return (
        '<div class="' +
        breakCls +
        '">' +
        '<table class="title-row"><tr>' +
        '<td class="spacer">&nbsp;</td>' +
        '<td class="doc-title">' +
        esc(hospitalName) +
        '物资出库单</td>' +
        '<td class="page-meta">' +
        (pageIndex + 1) +
        '/' +
        pages.length +
        '</td>' +
        '</tr></table>' +
        '<table class="head-table">' +
        '<colgroup>' +
        '<col style="width:' +
        HEAD_COL.a +
        '"/><col style="width:' +
        HEAD_COL.b +
        '"/><col style="width:' +
        HEAD_COL.c +
        '"/>' +
        '</colgroup>' +
        '<tr>' +
        '<td><span class="lbl">发往科:</span>' +
        esc(row.departmentName) +
        '</td>' +
        '<td><span class="lbl">仓库:</span>' +
        esc(row.warehouseName) +
        '</td>' +
        '<td><span class="lbl">单据号:</span>' +
        esc(row.billNo) +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<td><span class="lbl">出库日期（审核）:</span>' +
        esc(fmtDate(row.auditDate || row.billDate)) +
        '</td>' +
        '<td colspan="2"><span class="lbl">资金来源:</span>' +
        esc(row.fundSource) +
        '</td>' +
        '</tr>' +
        '</table>' +
        '<table class="detail">' +
        colgroupDetail +
        '<thead><tr>' +
        '<th>消耗品名称</th><th>规格型号</th><th>数量</th><th>单位</th>' +
        '<th>采购价</th><th>采购金额</th><th>产地</th><th>批号</th><th>效期</th>' +
        '</tr></thead><tbody>' +
        rows +
        totalRow +
        '</tbody></table>' +
        '<table class="sign-table"><tr>' +
        '<td><span class="lbl">领用人：</span></td>' +
        '<td><span class="lbl">保管：</span></td>' +
        '<td><span class="lbl">出库操作员：</span>' +
        esc(row.outboundOperator || row.createBy) +
        '</td>' +
        '</tr></table>' +
        '</div>'
      )
    })
    .join('')

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    css +
    '</head><body>' +
    pageHtml +
    '</body></html>'
  )
}
