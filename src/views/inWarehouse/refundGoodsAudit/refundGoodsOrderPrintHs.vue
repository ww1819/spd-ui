<template>
  <div
    class="refund-goods-print order-print receipt-print browser-print-root"
    ref="receiptRefundGoodsPrintRef"
    :class="[rootOrientationClass, { 'is-a4-print': isA4Paper }, { 'print-root-offscreen': !embedPreview }]"
  >
    <div
      v-for="(detailPage, pageIndex) in detailPages"
      :key="`print-page-${pageIndex}`"
      class="print-page"
      :class="{
        'is-third-split-copy': isThirdSplitPaper,
        'print-page-break': pageIndex < detailPages.length - 1
      }"
    >
      <div class="doc-header">
        <div class="doc-header-spacer" aria-hidden="true"></div>
        <div class="doc-title">
          <span v-if="hospitalName">{{ hospitalName }}</span>采购退货单
        </div>
        <div class="page-meta">
          <span class="page-index">{{ pageIndex + 1 }}/{{ detailPages.length }}</span>
        </div>
      </div>

      <div class="info-block print-head-grid">
        <div class="print-head-cell">
          <span class="info-label">单据号</span>
          <span class="info-value">{{ row.billNo || '' }}</span>
        </div>
        <div class="print-head-cell">
          <span class="info-label">供应商</span>
          <span class="info-value">{{ row.supplierName || '' }}</span>
        </div>
        <div class="print-head-cell">
          <span class="info-label">仓库</span>
          <span class="info-value">{{ row.warehouseName || '' }}</span>
        </div>
        <div class="print-head-cell">
          <span class="info-label">审核时间</span>
          <span class="info-value">{{ formatPrintDateTime(row.auditDate) }}</span>
        </div>
      </div>

      <table class="detail-table">
        <colgroup>
          <col class="col-name" />
          <col class="col-unit" />
          <col class="col-spec" />
          <col class="col-qty" />
          <col class="col-price" />
          <col class="col-amt" />
          <col class="col-batch" />
        </colgroup>
        <thead>
          <tr>
            <th><span class="th-text">名称</span></th>
            <th><span class="th-text">单位</span></th>
            <th><span class="th-text">规格</span></th>
            <th><span class="th-text">数量</span></th>
            <th><span class="th-text">退货价</span></th>
            <th><span class="th-text">退货金额</span></th>
            <th><span class="th-text">批号</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in detailPage" :key="`${pageIndex}-${idx}`">
            <td class="cell-textual">
              <span class="cell-text">{{ item.materialName || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.unitName || (item.fdUnit && item.fdUnit.unitName) || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.materialSpeci || '' }}</span>
            </td>
            <td>{{ formatQty(item.qty) }}</td>
            <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td>{{ formatAmt(item.amt) }}</td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.batchNumber || '' }}</span>
            </td>
          </tr>
          <tr v-if="pageIndex === detailPages.length - 1" class="print-total-row">
            <td colspan="5" class="total-label-cell">
              <span class="total-label">合计</span><span class="total-value">{{ row.totalAmtConverter || '' }}</span>
            </td>
            <td class="total-amt-cell">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="sign-block">
        <div class="sign-item"><span class="sign-label">操作员</span><span class="sign-value sign-value--blank"></span></div>
        <div class="sign-item"><span class="sign-label">保管</span><span class="sign-value sign-value--blank"></span></div>
        <div class="sign-item">
          <span class="sign-label">打印日期</span>
          <span class="sign-value">{{ formatPrintDateTime(row.printDate || new Date()) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'
import { formatQuantity } from '@/utils/format-quantity'

export default {
  name: 'RefundGoodsOrderPrintHs',
  mixins: [hospitalNameMixin],
  props: {
    row: {
      type: Object,
      default: () => ({})
    },
    rowsPerPage: {
      type: Number,
      default: undefined
    },
    printOrientation: {
      type: String,
      default: 'landscape'
    },
    paperType: {
      type: String,
      default: 'third-split'
    },
    embedPreview: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    effectiveOrientation() {
      return this.printOrientation === 'portrait' ? 'portrait' : 'landscape'
    },
    rootOrientationClass() {
      return this.effectiveOrientation === 'portrait' ? 'page-slip-portrait' : 'page-slip-landscape'
    },
    isA4Paper() {
      return this.paperType === 'a4'
    },
    isThirdSplitPaper() {
      return this.paperType === 'third-split'
    },
    effectiveRowsPerPage() {
      const n = Number(this.rowsPerPage)
      if (Number.isFinite(n) && n >= 1) {
        return Math.min(100, Math.max(1, Math.round(n)))
      }
      return 7
    },
    detailPages() {
      const list = (this.row && Array.isArray(this.row.detailList)) ? this.row.detailList : []
      if (!list.length) return [[]]
      const pageSize = this.effectiveRowsPerPage
      const pages = []
      for (let i = 0; i < list.length; i += pageSize) {
        pages.push(list.slice(i, i + pageSize))
      }
      return pages
    },
    pageSizeForPrint() {
      return this.isA4Paper ? 'A4' : '210mm 140mm'
    }
  },
  methods: {
    removeMirrorNode(m) {
      try {
        if (m && m.parentNode) m.parentNode.removeChild(m)
      } catch (e) {
        // ignore
      }
    },
    mmToPx(mm) {
      const probe = document.createElement('div')
      probe.style.position = 'absolute'
      probe.style.left = '-100000px'
      probe.style.top = '0'
      probe.style.visibility = 'hidden'
      probe.style.height = '0'
      probe.style.width = `${mm}mm`
      document.body.appendChild(probe)
      const w = probe.getBoundingClientRect().width || 0
      this.removeMirrorNode(probe)
      return w
    },
    estimateTdInnerWidthPx(td, colRatios) {
      const tdCs = window.getComputedStyle(td)
      const padL = parseFloat(tdCs.paddingLeft || '0') || 0
      const padR = parseFloat(tdCs.paddingRight || '0') || 0
      const measured = Math.max(0, (td.clientWidth || td.getBoundingClientRect().width || 0) - padL - padR)
      if (measured > 10) return measured
      const pagePx = this.mmToPx(210) || 794
      const tr = td.parentElement
      if (!tr) return Math.max(120, pagePx * 0.2)
      const tds = Array.from(tr.children || []).filter(n => n && n.tagName === 'TD')
      const idx = tds.indexOf(td)
      const ratios = colRatios && colRatios.length ? colRatios : tds.map(() => 1 / Math.max(1, tds.length))
      const r = ratios[idx] != null ? ratios[idx] : (1 / Math.max(1, tds.length))
      return Math.max(80, pagePx * r - padL - padR)
    },
    measureUnclampedTextHeightPx(el, fontPx, innerW) {
      const cs = window.getComputedStyle(el)
      const mirror = document.createElement('div')
      mirror.textContent = el.textContent || ''
      mirror.style.position = 'absolute'
      mirror.style.left = '-100000px'
      mirror.style.top = '0'
      mirror.style.visibility = 'hidden'
      mirror.style.pointerEvents = 'none'
      mirror.style.boxSizing = 'border-box'
      mirror.style.width = `${innerW}px`
      mirror.style.whiteSpace = 'normal'
      mirror.style.wordBreak = 'break-word'
      mirror.style.overflow = 'visible'
      mirror.style.lineHeight = '1.35'
      mirror.style.fontFamily = cs.fontFamily
      mirror.style.fontWeight = cs.fontWeight
      mirror.style.fontStyle = cs.fontStyle
      mirror.style.letterSpacing = cs.letterSpacing
      mirror.style.fontSize = `${fontPx}px`
      document.body.appendChild(mirror)
      const h = mirror.scrollHeight
      this.removeMirrorNode(mirror)
      return h
    },
    /** 明细文本列：超过一行则缩小字号，直至单行或字号下限 */
    applyPrintCellAutoFont() {
      const root = this.$refs.receiptRefundGoodsPrintRef || this.$el
      if (!root || typeof document === 'undefined') return
      const cells = root.querySelectorAll('td.cell-textual .cell-text')
      if (!cells || !cells.length) return
      const colRatios = [0.24, 0.06, 0.16, 0.12, 0.15, 0.15, 0.12]
      const minPx = 10
      const maxSteps = 64
      Array.prototype.forEach.call(cells, (el) => {
        if (!el || el.nodeType !== 1) return
        const text = (el.textContent || '').trim()
        if (!text) return
        const td = el.closest('td')
        if (!td) return
        el.style.fontSize = ''
        el.style.lineHeight = ''
        const cs0 = window.getComputedStyle(el)
        let fontPx = parseFloat(cs0.fontSize || '12') || 12
        const innerW = this.estimateTdInnerWidthPx(td, colRatios)
        let step = 0
        while (step < maxSteps) {
          const lineHeightPx = Math.max(10, Math.round(fontPx * 1.35))
          const oneLineMaxH = lineHeightPx + 1
          const h = this.measureUnclampedTextHeightPx(el, fontPx, innerW)
          if (h <= oneLineMaxH + 0.5 || fontPx <= minPx) {
            el.style.fontSize = `${fontPx}px`
            el.style.lineHeight = '1.35'
            return
          }
          fontPx -= 0.5
          step++
        }
        el.style.fontSize = `${Math.max(minPx, fontPx)}px`
        el.style.lineHeight = '1.35'
      })
    },
    start() {
      const run = () => {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.applyPrintCellAutoFont()
            this.$print(
              this.$refs.receiptRefundGoodsPrintRef,
              { injectPageSize: true, pageMargin: '0 4mm', waitForAssets: true, beforePrintDelay: 320 },
              this.pageSizeForPrint
            )
          })
        })
      }
      this.ensureHospitalNameLoaded().then(run).catch(run)
    },
    formatQty(value) {
      return formatQuantity(value, 2)
    },
    formatPrice(value) {
      if (value === null || value === undefined || value === '') return ''
      const num = parseFloat(value)
      if (isNaN(num)) return ''
      return num.toFixed(4)
    },
    formatAmt(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(2)
    },
    /** 申请/审核/打印日期：yyyy-MM-dd */
    formatPrintDateTime(v) {
      if (!v) return ''
      const d = new Date(v)
      if (isNaN(d.getTime())) return v
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
  }
}
</script>

<style lang="stylus" scoped>
/* 与入库单 orderPrint：屏上预览离屏 + 版心 */
.print-root-offscreen
  position fixed
  left -9999px
  top 0
  width 210mm
  max-width 900px
  z-index -1
  visibility visible

.refund-goods-print.page-slip-landscape.print-root-offscreen
  width 297mm
  max-width 1100px

.receipt-print
  line-height 1.5
  width 210mm
  max-width 210mm
  margin 0 auto
  box-sizing border-box
  padding-left 1ch
  padding-right 1ch
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.print-page
  position relative
  width 100%
  max-width 100%
  min-height 140mm
  box-sizing border-box
  display flex
  flex-direction column
  break-inside avoid
  page-break-inside avoid
  page-break-after always
  overflow-x visible
  overflow-y visible

.print-page.is-third-split-copy
  height auto
  min-height 140mm
  overflow visible

.print-page:last-child
  page-break-after auto

.print-page.print-page-break
  page-break-after always

.is-a4-print .print-page
  min-height 0
  height auto
  overflow visible

.doc-header
  display grid
  grid-template-columns 92px 1fr 92px
  align-items center
  column-gap 6px
  margin-bottom 2px

.doc-header-spacer
  width 92px

.page-meta
  justify-self end
  align-self center

.page-index
  font-size 12px
  line-height 1
  letter-spacing 0.5px
  color #333

.doc-title
  font-size 20px
  font-weight normal
  text-align center
  line-height 1.1
  margin 0

.info-block
  margin-bottom 3px

.print-head-grid
  display grid
  grid-template-columns 1fr 1fr
  column-gap 8px
  row-gap 1px

.print-head-cell
  display flex
  align-items center
  min-width 0

.info-label
  flex 0 0 auto
  flex-shrink 0
  box-sizing border-box
  text-align left
  white-space nowrap
  &::after
    content ':'
    margin-right 2px

.info-value
  flex 1 1 auto
  min-width 0
  margin-right 8px

.detail-table
  width 100%
  table-layout fixed
  border-collapse collapse
  border 1px solid #000
  margin-bottom 10px

.detail-table .col-name
  width 24%
.detail-table .col-unit
  width 6%
.detail-table .col-spec
  width 16%
.detail-table .col-qty
  width 12%
.detail-table .col-price
  width 15%
.detail-table .col-amt
  width 15%
.detail-table .col-batch
  width 12%

.detail-table th,
.detail-table td
  border 1px solid #000
  padding 4px 6px
  text-align center

.detail-table th
  font-weight normal
  background #f5f5f5

.detail-table th .th-text
  display inline-flex
  align-items center
  justify-content center
  max-width 100%
  white-space nowrap

.detail-table td
  word-break normal
  overflow visible

.detail-table td.cell-textual
  text-align left
  vertical-align top
  white-space normal
  word-break break-word

.detail-table td.cell-textual .cell-text
  display block
  overflow visible
  white-space normal
  word-break break-word
  line-height 1.35

.detail-table td:nth-child(4),
.detail-table td:nth-child(5),
.detail-table td:nth-child(6)
  text-align right

.detail-table tbody tr.print-total-row td
  border 1px solid #000
  padding 4px 6px
  vertical-align middle

.detail-table tbody tr.print-total-row td.total-label-cell
  text-align left

.detail-table tbody tr.print-total-row td.total-amt-cell
  text-align right
  white-space nowrap

.sign-block
  display grid
  grid-template-columns 1fr 1fr 1fr
  column-gap 12px
  margin-top 2px

.sign-item
  display flex
  align-items center
  min-width 0

.sign-label
  flex 0 0 auto
  text-align right
  white-space nowrap
  &::after
    content '：'

.sign-value
  flex 1 1 auto
  min-width 0
  margin-left 6px
  white-space nowrap
  overflow hidden
  text-overflow ellipsis

.sign-value--blank
  min-height 1em
</style>

<style lang="stylus" media="print">
@page
  size 210mm 140mm !important
  margin 0 4mm !important

@media print
  html,body
    margin 0 !important
    padding 0 !important

  *
    color #000 !important

  .print-root-offscreen,
  .browser-print-root
    position relative !important
    left auto !important
    top auto !important
    z-index auto !important
    width 100% !important
    padding-bottom 0 !important

  .receipt-print
    width 100% !important
    max-width none !important
    box-sizing border-box !important
    padding-left 0 !important
    padding-right 0 !important
    font-size 16px !important
    font-family "Courier New", Consolas, "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-weight normal
    -webkit-font-smoothing none !important
    -moz-osx-font-smoothing none !important
    text-rendering optimizeSpeed
    -webkit-print-color-adjust exact
    print-color-adjust exact

  .print-page
    width 100% !important
    max-width 100% !important
    min-height 140mm !important
    max-height none !important
    padding-top 6mm !important
    overflow-x visible
    overflow-y visible
    break-inside avoid
    page-break-inside avoid
    page-break-after always

  .print-page:last-child
    page-break-after auto

  .print-page.print-page-break
    page-break-after always

  .refund-goods-print .print-page.is-third-split-copy
    height auto !important
    min-height 140mm !important
    overflow visible !important

  .is-a4-print .print-page
    min-height 0 !important
    height auto !important
    padding-top 0 !important

  .doc-header
    display grid !important
    grid-template-columns 92px 1fr 92px !important
    align-items center !important
    column-gap 6px !important
    margin-bottom 2px !important

  .doc-header-spacer
    width 92px !important

  .page-meta
    justify-self end !important
    align-self center !important

  .doc-title
    display block !important
    font-size 18px !important
    font-weight normal !important
    padding 0 !important
    margin 0 !important
    line-height 1.7 !important
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    overflow visible !important
    page-break-inside avoid !important

  .info-block
    margin-bottom 3px !important
    font-size 17px !important

  .print-head-grid
    display grid !important
    grid-template-columns 1fr 1fr !important
    column-gap 8px !important
    row-gap 1px !important
    font-size 17px !important

  .print-head-cell
    display flex !important
    align-items center !important
    min-width 0 !important

  .info-label
    text-align left !important
    margin-right 0 !important
  .info-label::after
    content ':' !important
    margin-right 2px !important

  .info-value
    margin-right 8px !important

  .detail-table
    margin-bottom 6px !important
    width 100% !important
    table-layout fixed
    border-collapse collapse
    font-family "Courier New", Consolas, "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 14px !important

  .detail-table th,
  .detail-table td
    padding 4px 6px !important
    border 1px solid #000
    overflow visible
    word-wrap break-word
    word-break break-word
    line-height 1.45 !important

  .detail-table th
    font-weight normal !important
    background transparent !important
    -webkit-print-color-adjust economy
    print-color-adjust economy
    text-align center !important

  .detail-table th .th-text
    display inline-flex !important
    align-items center !important
    justify-content center !important
    max-width 100% !important
    white-space nowrap !important

  .detail-table td.cell-textual
    text-align left !important
    vertical-align top !important
    white-space normal !important
    word-break break-word !important

  .detail-table td.cell-textual .cell-text
    display block !important
    overflow visible !important
    white-space normal !important
    word-break break-word !important
    line-height 1.35 !important

  .detail-table td:nth-child(4),
  .detail-table td:nth-child(5),
  .detail-table td:nth-child(6)
    text-align right !important

  .sign-block
    margin-top 2px !important
    padding-bottom 3mm !important
    font-size 17px !important
    display grid !important
    grid-template-columns 1fr 1fr 1fr !important
    column-gap 12px !important
</style>
