<template>
  <div
    class="refund-goods-print order-print receipt-print print-root-offscreen"
    ref="receiptRefundGoodsPrintRef"
    :class="[rootOrientationClass, { 'is-a4-print': isA4Paper }]"
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

      <div class="info-block">
        <div class="info-row">
          <span class="info-label info-label--l1">单据号</span>
          <span class="info-value">{{ row.billNo || '' }}</span>
          <span class="info-label info-label--l2 info-gap">供应商</span>
          <span class="info-value info-value-wide">{{ row.supplierName || '' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label info-label--l1">仓库</span>
          <span class="info-value">{{ row.warehouseName || '' }}</span>
          <span class="info-label info-label--l2 info-gap">申请时间</span>
          <span class="info-value">{{ formatPrintDateTime(row.billDate) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label info-label--l1">审核时间</span>
          <span class="info-value">{{ formatPrintDateTime(row.auditDate) }}</span>
          <span class="info-label info-label--l2 info-gap">单位</span>
          <span class="info-value">元</span>
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
        </tbody>
      </table>

      <div v-if="pageIndex === detailPages.length - 1" class="total-row">
        <span class="total-left">
          <span class="total-label">合计</span><span class="total-value">{{ row.totalAmtConverter || '' }}</span>
        </span>
        <span class="total-num">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</span>
      </div>

      <div class="sign-block">
        <span class="sign-item"><span class="sign-label">操作员</span><span class="sign-value sign-value--blank"></span></span>
        <span class="sign-item"><span class="sign-label">保管</span><span class="sign-value sign-value--blank"></span></span>
        <span class="sign-item sign-item--wide">
          <span class="sign-label">打印日期</span>
          <span class="sign-value">{{ formatPrintDateTime(row.printDate || new Date()) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'

export default {
  mixins: [hospitalNameMixin],
  props: {
    row: {
      type: Object,
      default: () => ({})
    },
    printOrientation: {
      type: String,
      default: 'landscape'
    },
    paperType: {
      type: String,
      default: 'third-split'
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
    detailPages() {
      const list = (this.row && Array.isArray(this.row.detailList)) ? this.row.detailList : []
      if (!list.length) return [[]]
      const pageSize = 7
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
    applyPrintCellAutoFont() {
      const root = this.$refs.receiptRefundGoodsPrintRef || this.$el
      if (!root || typeof document === 'undefined') return
      const cells = root.querySelectorAll('td.cell-textual .cell-text')
      if (!cells || !cells.length) return
      const colRatios = [0.24, 0.06, 0.16, 0.12, 0.15, 0.15, 0.12]
      const minPx = 8
      const maxSteps = 48
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
        const lineHeightPx = Math.max(10, Math.round(fontPx * 1.35))
        const maxH = lineHeightPx * 2 + 1
        const innerW = this.estimateTdInnerWidthPx(td, colRatios)
        let step = 0
        while (step < maxSteps) {
          const h = this.measureUnclampedTextHeightPx(el, fontPx, innerW)
          if (h <= maxH + 0.5 || fontPx <= minPx) {
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
      if (value === null || value === undefined || value === '') return ''
      const num = parseFloat(value)
      if (isNaN(num)) return ''
      return num.toFixed(2)
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
    formatPrintDateTime(v) {
      if (!v) return ''
      const d = new Date(v)
      if (isNaN(d.getTime())) return v
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const mi = String(d.getMinutes()).padStart(2, '0')
      const s = String(d.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${day} ${h}:${mi}:${s}`
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
  height 140mm
  overflow hidden

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
  margin-bottom 6px

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
  margin-bottom 6px

.info-row
  display flex
  align-items center
  flex-wrap wrap
  margin-bottom 2px

.info-label
  flex 0 0 auto
  flex-shrink 0
  box-sizing border-box
  text-align right
  white-space nowrap
  &::after
    content '：'

.info-label--l1
  flex-basis 5.6em
  max-width 5.6em

.info-label--l2
  flex-basis 9.6em
  max-width 9.6em

.info-value
  flex 1 1 auto
  min-width 0
  margin-right 18px

.info-value-wide
  flex 2 1 0
  min-width 0

.info-gap
  margin-left 18px

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
  overflow hidden

.detail-table td.cell-textual
  text-align left
  vertical-align top
  white-space normal
  word-break break-word

.detail-table td.cell-textual .cell-text
  display -webkit-box
  -webkit-box-orient vertical
  -webkit-line-clamp 2
  overflow hidden
  word-break break-word
  line-height 1.35

.detail-table td:nth-child(4),
.detail-table td:nth-child(5),
.detail-table td:nth-child(6)
  text-align right

.total-row
  display flex
  justify-content space-between
  align-items center
  margin-bottom 14px

.total-left
  flex-shrink 0
  display inline-flex
  align-items baseline
  max-width 72%

.total-label
  flex 0 0 auto
  text-align right
  white-space nowrap
  &::after
    content '：'

.total-value
  flex 1 1 auto
  min-width 0
  margin-left 6px
  white-space normal
  word-break break-word

.total-num
  min-width 80px
  text-align right

.sign-block
  display flex
  justify-content space-between
  padding-right 12%
  margin-top auto

.sign-item
  display inline-flex
  align-items center
  flex 0 0 18%
  min-width 0

.sign-item--wide
  flex 0 0 44%

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

  .print-root-offscreen
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

  .is-a4-print .print-page
    min-height 0 !important
    height auto !important
    padding-top 0 !important

  .doc-header
    display grid !important
    grid-template-columns 92px 1fr 92px !important
    align-items center !important
    column-gap 6px !important
    margin-bottom 6px !important

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

  .info-row
    font-size 17px !important

  .info-label--l1
    flex-basis 6.0em !important
    max-width 6.0em !important

  .info-label--l2
    flex-basis 10.2em !important
    max-width 10.2em !important

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
    overflow hidden
    word-wrap normal
    word-break normal
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
    display -webkit-box !important
    -webkit-box-orient vertical !important
    -webkit-line-clamp 2 !important
    overflow hidden !important
    word-break break-word !important
    line-height 1.35 !important

  .detail-table td:nth-child(4),
  .detail-table td:nth-child(5),
  .detail-table td:nth-child(6)
    text-align right !important

  .total-row
    margin-bottom 8px !important
    font-size 17px !important

  .sign-block
    margin-top auto !important
    padding-bottom 3mm !important
    font-size 17px !important
    padding-right 10% !important

  .sign-item
    flex-basis 20% !important

  .sign-item--wide
    flex-basis 46% !important
</style>
