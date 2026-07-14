/**
 * 衡水出库单 — Lodop 纯文本模板（ADD_PRINT_TEXT + ADD_PRINT_LINE）
 *
 * 设计基准（与 outOrderPrintHs 屏上预览同一套比例，单位 mm）：
 * - 纸张：210 × 140
 * - 左右边距 3，内容宽 204
 * - 表头信息列：1.72 : 0.62 : 0.96 → 52% / 19% / 29%
 * - 明细列宽：14/12/7/6/11/12/14/11/13 %（批号/效期按固定长度给够即可）
 *
 * 走文本项，便于针式机用字体打印，避免 HTML 位图断笔。
 */

import { loadCLodop } from '@/utils/lodop'

const PAGE_W = 210
const PAGE_H = 140
const MARGIN_L = 3
const MARGIN_R = 3
const MARGIN_T = 3
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R // 204

/** 明细列宽：批号≈8位、效期≈10位固定，列宽够用即可；其余还给名称/规格/产地 */
const COL_RATIO = [14, 12, 7, 6, 11, 12, 14, 11, 13]
const COL_HEADERS = ['消耗品名称', '规格型号', '数量', '单位', '采购价', '采购金额', '产地', '批号', '效期']

function mm(n) {
  const v = Math.round(Number(n) * 100) / 100
  return v + 'mm'
}

function str(v) {
  if (v == null) return ''
  return String(v)
}

/** 显示宽度单位：汉字=1，ASCII/数字≈0.55（避免批号、效期被按汉字宽度误截断） */
function displayUnits(text) {
  const s = str(text)
  let u = 0
  for (let i = 0; i < s.length; i++) {
    u += s.charCodeAt(i) <= 0xff ? 0.55 : 1
  }
  return u
}

/** 列内可排多少「汉字宽」 */
function maxUnitsInWidth(widthMm, fontPt) {
  const cw = Math.max(2.4, Number(fontPt) * 0.32)
  return Math.max(1, Number(widthMm) / cw)
}

function wrapLinesByWidth(text, widthMm, fontPt, maxLines) {
  const s = str(text)
  if (!s) return ['']
  const limit = maxUnitsInWidth(widthMm, fontPt)
  const lines = []
  let buf = ''
  let bufU = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i)
    const cu = s.charCodeAt(i) <= 0xff ? 0.55 : 1
    if (buf && bufU + cu > limit && lines.length < maxLines - 1) {
      lines.push(buf)
      buf = ch
      bufU = cu
    } else {
      buf += ch
      bufU += cu
    }
  }
  if (buf) lines.push(buf)
  // 超出行数：末行加省略
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (last && displayUnits(last + '…') > limit && last.length > 1) {
      last = last.slice(0, -1)
    }
    kept[maxLines - 1] = last + (displayUnits(str(text)) > displayUnits(kept.join('')) ? '…' : '')
    return kept
  }
  // 单行仍超宽
  if (lines.length === 1 && displayUnits(lines[0]) > limit && maxLines === 1) {
    let last = lines[0]
    while (last.length > 1 && displayUnits(last + '…') > limit) {
      last = last.slice(0, -1)
    }
    return [last + '…']
  }
  return lines.length ? lines : ['']
}

function buildColWidths(totalW) {
  const sum = COL_RATIO.reduce((a, b) => a + b, 0)
  const widths = COL_RATIO.map((r) => (totalW * r) / sum)
  // 纠正累计误差到最后一列
  let acc = 0
  for (let i = 0; i < widths.length - 1; i++) {
    widths[i] = Math.round(widths[i] * 100) / 100
    acc += widths[i]
  }
  widths[widths.length - 1] = Math.round((totalW - acc) * 100) / 100
  return widths
}

function buildColLefts(left0, widths) {
  const lefts = []
  let x = left0
  for (let i = 0; i < widths.length; i++) {
    lefts.push(x)
    x += widths[i]
  }
  return lefts
}

/**
 * 画表格外框 + 竖线 + 横线
 * @param {object} [mergeLast] 合计行合并：与浏览器 colspan 一致
 *   - labelCols: 左侧合并列数（默认 4）
 *   - amtCols: 金额合并列数（默认 2）
 */
function drawTableGrid(LODOP, top, left, widths, rowHeights, mergeLast) {
  const tableW = widths.reduce((a, b) => a + b, 0)
  const tableH = rowHeights.reduce((a, b) => a + b, 0)
  const right = left + tableW
  const bottom = top + tableH
  const lastH = rowHeights.length ? rowHeights[rowHeights.length - 1] : 0
  const bodyBottom = mergeLast && rowHeights.length > 1 ? bottom - lastH : bottom

  // 外框
  LODOP.ADD_PRINT_LINE(mm(top), mm(left), mm(top), mm(right), 0, 1)
  LODOP.ADD_PRINT_LINE(mm(bottom), mm(left), mm(bottom), mm(right), 0, 1)
  LODOP.ADD_PRINT_LINE(mm(top), mm(left), mm(bottom), mm(left), 0, 1)
  LODOP.ADD_PRINT_LINE(mm(top), mm(right), mm(bottom), mm(right), 0, 1)

  // 竖线：表头+数据行画满；合计行只保留合并分界线（对齐浏览器 colspan=4 / colspan=2）
  let x = left
  const labelCols = (mergeLast && mergeLast.labelCols) || 4
  const amtCols = (mergeLast && mergeLast.amtCols) || 2
  for (let i = 0; i < widths.length - 1; i++) {
    x += widths[i]
    LODOP.ADD_PRINT_LINE(mm(top), mm(x), mm(bodyBottom), mm(x), 0, 1)
    if (mergeLast && rowHeights.length > 1) {
      const afterLabel = i === labelCols - 1
      const afterAmt = i === labelCols + amtCols - 1
      if (afterLabel || afterAmt) {
        LODOP.ADD_PRINT_LINE(mm(bodyBottom), mm(x), mm(bottom), mm(x), 0, 1)
      }
    }
  }

  // 横线（行间）
  let y = top
  for (let i = 0; i < rowHeights.length - 1; i++) {
    y += rowHeights[i]
    LODOP.ADD_PRINT_LINE(mm(y), mm(left), mm(y), mm(right), 0, 1)
  }
}

function addText(LODOP, top, left, width, height, content, style) {
  const s = style || {}
  LODOP.ADD_PRINT_TEXT(mm(top), mm(left), mm(width), mm(height), str(content))
  LODOP.SET_PRINT_STYLEA(0, 'FontName', s.fontName || '宋体')
  LODOP.SET_PRINT_STYLEA(0, 'FontSize', s.fontSize != null ? s.fontSize : 10)
  if (s.bold) LODOP.SET_PRINT_STYLEA(0, 'Bold', 1)
  if (s.align) LODOP.SET_PRINT_STYLEA(0, 'Alignment', s.align) // 1左 2中 3右
}

/**
 * 在单元格内多行文本（上对齐）
 * 批号/效期等数字列按半角宽度计算，避免误截断
 */
function addCellText(LODOP, top, left, width, height, text, fontSize, align, maxLines) {
  const padX = 0.5
  const padY = 0.5
  const innerW = Math.max(2, width - padX * 2)
  const innerH = Math.max(2, height - padY * 2)
  const lines = wrapLinesByWidth(text, innerW, fontSize, maxLines || 2)
  const lineH = innerH / Math.max(lines.length, 1)
  for (let i = 0; i < lines.length; i++) {
    addText(LODOP, top + padY + i * lineH, left + padX, innerW, lineH, lines[i], {
      fontSize,
      align: align || 1
    })
  }
}

/**
 * 打印一页纯文本出库单
 */
function printOnePage(LODOP, ctx) {
  const {
    hospitalName,
    row,
    detailPage,
    pageIndex,
    pageCount,
    isLastPage,
    fontTable,
    fmt
  } = ctx

  const left0 = MARGIN_L
  const widths = buildColWidths(CONTENT_W)
  const lefts = buildColLefts(left0, widths)

  // —— 标题区（对齐屏上 doc-header：左右 92px≈24mm 占位）——
  const titleTop = MARGIN_T
  const titleH = 7
  const sideW = 24
  addText(LODOP, titleTop, left0 + sideW, CONTENT_W - sideW * 2, titleH, str(hospitalName) + '物资出库单', {
    fontSize: 12,
    align: 2,
    bold: 0
  })
  addText(LODOP, titleTop + 1, left0 + CONTENT_W - sideW, sideW, 5, pageIndex + 1 + '/' + pageCount, {
    fontSize: 9,
    align: 3
  })

  // —— 表头信息（两行，列宽 52/19/29）——
  const headTop = titleTop + titleH + 1
  const headRowH = 5
  const headFs = 9
  const wA = CONTENT_W * 0.52
  const wB = CONTENT_W * 0.19
  const wC = CONTENT_W * 0.29
  const xA = left0
  const xB = left0 + wA
  const xC = left0 + wA + wB

  addText(LODOP, headTop, xA, wA, headRowH, '发往科:' + str(row.departmentName), { fontSize: headFs, align: 1 })
  addText(LODOP, headTop, xB, wB, headRowH, '仓库:' + str(row.warehouseName), { fontSize: headFs, align: 1 })
  addText(LODOP, headTop, xC, wC, headRowH, '单据号:' + str(row.billNo), { fontSize: headFs, align: 1 })

  addText(
    LODOP,
    headTop + headRowH,
    xA,
    wA,
    headRowH,
    '出库日期（审核）:' + str(fmt.date(row.auditDate || row.billDate)),
    { fontSize: headFs, align: 1 }
  )
  addText(
    LODOP,
    headTop + headRowH,
    xB,
    wB + wC,
    headRowH,
    '资金来源:' + str(row.fundSource),
    { fontSize: headFs, align: 1 }
  )

  // —— 明细表 ——
  const tableTop = headTop + headRowH * 2 + 2
  const signReserve = 10 // 底部签字区
  const tableMaxH = PAGE_H - tableTop - signReserve
  const headRowHeight = 6.2
  const dataRows = Array.isArray(detailPage) ? detailPage : []
  const extraTotal = isLastPage ? 1 : 0
  const bodyRowCount = dataRows.length + extraTotal
  // 在剩余高度内均分数据行，保证不超出 140mm，又尽量接近屏上疏密
  let dataRowHeight = 8.5
  let totalRowHeight = 6.2
  if (bodyRowCount > 0) {
    const remain = tableMaxH - headRowHeight
    const per = remain / bodyRowCount
    dataRowHeight = Math.max(6.2, Math.min(9, per))
    totalRowHeight = isLastPage ? Math.max(5.8, Math.min(6.5, per)) : 0
  }
  const rowHeights = [headRowHeight]
  for (let i = 0; i < dataRows.length; i++) rowHeights.push(dataRowHeight)
  if (isLastPage) rowHeights.push(totalRowHeight)

  drawTableGrid(
    LODOP,
    tableTop,
    left0,
    widths,
    rowHeights,
    isLastPage ? { labelCols: 4, amtCols: 2 } : null
  )

  // 表头文字
  let y = tableTop
  for (let c = 0; c < COL_HEADERS.length; c++) {
    addCellText(LODOP, y, lefts[c], widths[c], headRowHeight, COL_HEADERS[c], fontTable, 2, 1)
  }
  y += headRowHeight

  // 数据行：文本左、数量/价格/金额右、单位居中；批号/效期单行完整显示
  const alignOf = [1, 1, 3, 2, 3, 3, 1, 1, 1]
  const maxLinesOf = [2, 2, 1, 1, 1, 1, 2, 1, 1]
  for (let r = 0; r < dataRows.length; r++) {
    const it = dataRows[r] || {}
    const cells = [
      str(it.materialName),
      str(fmt.spec(it)),
      str(fmt.num(it.qty)),
      str(it.unitName),
      str(fmt.price(it.unitPrice != null ? it.unitPrice : it.price)),
      str(fmt.amt(it.amt)),
      str(it.factoryName),
      str(it.batchNumber),
      str(fmt.valid(it.endTime || it.periodDate))
    ]
    for (let c = 0; c < cells.length; c++) {
      addCellText(LODOP, y, lefts[c], widths[c], dataRowHeight, cells[c], fontTable, alignOf[c], maxLinesOf[c])
    }
    y += dataRowHeight
  }

  // 合计行：与浏览器预览一致 — 前4列合并「合计：大写」，采购价+采购金额合并小写金额，后3列空
  if (isLastPage) {
    const totalLabelW = widths[0] + widths[1] + widths[2] + widths[3]
    const totalAmtW = widths[4] + widths[5]
    addText(LODOP, y + 0.8, lefts[0] + 1, totalLabelW - 2, totalRowHeight - 1.2, '合计：' + str(row.totalAmtConverter), {
      fontSize: fontTable,
      align: 1
    })
    addText(
      LODOP,
      y + 0.8,
      lefts[4] + 0.5,
      totalAmtW - 1,
      totalRowHeight - 1.2,
      row.totalAmt != null ? str(fmt.amt(row.totalAmt)) : '',
      {
        fontSize: fontTable,
        align: 3
      }
    )
    y += totalRowHeight
  }

  // —— 签字区（三等分，表下 2mm）——
  const signTop = Math.min(y + 2.5, PAGE_H - 8)
  const signW = CONTENT_W / 3
  const signFs = 9
  addText(LODOP, signTop, left0, signW, 5, '领用人：', { fontSize: signFs, align: 1 })
  addText(LODOP, signTop, left0 + signW, signW, 5, '保管：', { fontSize: signFs, align: 1 })
  addText(
    LODOP,
    signTop,
    left0 + signW * 2,
    signW,
    5,
    '出库操作员：' + str(row.outboundOperator || row.createBy),
    { fontSize: signFs, align: 1 }
  )
}

/**
 * @param {object} options
 * @returns {Promise<object>} LODOP
 */
export async function printHsOutboundLodopText(options) {
  const opts = options || {}
  const LODOP = await loadCLodop()
  const row = opts.row || {}
  const pages = Array.isArray(opts.detailPages) && opts.detailPages.length ? opts.detailPages : [[]]
  const preview = opts.preview !== false
  const fontTable = Math.min(11, Math.max(8, Math.round(Number(opts.tableFontSize) || 10)))

  const fmt = {
    date: typeof opts.formatOutboundDate === 'function' ? opts.formatOutboundDate : (v) => str(v),
    spec: typeof opts.formatSpecModel === 'function' ? opts.formatSpecModel : () => '',
    num: typeof opts.formatNum === 'function' ? opts.formatNum : (v) => str(v),
    price: typeof opts.formatPrice === 'function' ? opts.formatPrice : (v) => str(v),
    amt: typeof opts.formatAmt === 'function' ? opts.formatAmt : (v) => str(v),
    valid: typeof opts.formatValidDate === 'function' ? opts.formatValidDate : (v) => str(v)
  }

  LODOP.PRINT_INIT('物资出库单-文本')
  // 自定义联单 210×140（0.1mm）
  LODOP.SET_PRINT_PAGESIZE(1, PAGE_W * 10, PAGE_H * 10, 'LodopCustomPage')

  if (opts.printerName) {
    try {
      LODOP.SET_PRINTER_INDEXA(opts.printerName)
    } catch (e) {
      /* 预览里可手选 */
    }
  }

  // 优先打印机内置字体，利于针式
  try {
    LODOP.SET_PRINT_MODE('TRY_SETUP_IF_EXCEPT', true)
  } catch (e) {
    /* ignore */
  }

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) LODOP.NewPage()
    printOnePage(LODOP, {
      hospitalName: opts.hospitalName || '',
      row,
      detailPage: pages[i],
      pageIndex: i,
      pageCount: pages.length,
      isLastPage: i === pages.length - 1,
      fontTable,
      fmt
    })
  }

  if (preview) LODOP.PREVIEW()
  else LODOP.PRINT()
  return LODOP
}
