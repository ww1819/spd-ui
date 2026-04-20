<template>
  <div
    class="refund-depot-order-print receipt-print print-root-offscreen"
    ref="receiptRefundDepotOrderPrintRef"
    :class="rootOrientationClass"
  >
    <div
      v-for="(detailPage, pageIndex) in detailPages"
      :key="`page-${pageIndex}`"
      class="print-copy-block"
      :class="{ 'is-third-split-copy': isThirdSplitPaper, 'print-page-break': pageIndex < detailPages.length - 1 }"
    >
      <div class="doc-header">
        <div class="doc-header-spacer" aria-hidden="true"></div>
        <div class="doc-title">
          <span v-if="hospitalName">{{ hospitalName }}</span>科室退库单
        </div>
        <div class="page-meta">
          <span class="page-index">{{ pageIndex + 1 }}/{{ detailPages.length }}</span>
        </div>
      </div>

      <div class="info-row print-head-info">
        <span class="info-label info-label--w1">科室</span>
        <span class="info-value">{{ row.departmentName || '' }}</span>
        <span class="info-label info-label--w2 info-gap">单据号</span>
        <span class="info-value">{{ row.billNo || '' }}</span>
        <span class="info-label info-label--w3 info-gap">退库日期（审核）</span>
        <span class="info-value">{{ formatDateTime(row.auditDate || row.billDate) }}</span>
      </div>
      <div class="info-row print-head-info">
        <span class="info-label info-label--w1">仓库</span>
        <span class="info-value">{{ row.warehouseName || '' }}</span>
        <span class="info-label info-label--w2 info-gap">申请时间</span>
        <span class="info-value">{{ formatDateTime(row.billDate) }}</span>
        <span class="info-label info-label--w4 info-gap">单位</span>
        <span class="info-value">元</span>
      </div>

      <table class="detail-table">
          <colgroup>
            <col class="col-name" />
            <col class="col-spec" />
            <col class="col-batch" />
            <col class="col-qty" />
            <col class="col-price" />
            <col class="col-amt" />
          </colgroup>
          <thead>
            <tr>
              <th><span class="th-text">消耗品名称</span></th>
              <th><span class="th-text">规格型号</span></th>
              <th><span class="th-text">批号</span></th>
              <th><span class="th-text">数量</span></th>
              <th><span class="th-text">退库单价</span></th>
              <th><span class="th-text">金额</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in detailPage" :key="`${pageIndex}-${idx}`">
              <td class="cell-textual"><span class="cell-text print-line-clamp-2">{{ item.materialName || '' }}</span></td>
              <td class="cell-textual"><span class="cell-text print-line-clamp-2">{{ item.materialSpeci || '' }}</span></td>
              <td class="cell-textual"><span class="cell-text print-line-clamp-2">{{ item.batchNumber || '' }}</span></td>
              <td class="num-cell">{{ formatQty(item.qty) }}</td>
              <td class="num-cell">{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
              <td class="num-cell">{{ formatAmt(item.amt) }}</td>
            </tr>
            <tr v-if="pageIndex === detailPages.length - 1" class="print-total-row">
              <td colspan="3" class="total-label-cell">
                <span class="total-label">合计</span><span class="total-value">{{ row.totalAmtConverter || '' }}</span>
              </td>
              <td class="num-cell">{{ formatQty(row.totalQty) }}</td>
              <td></td>
              <td class="num-cell total-amt-span">{{ formatAmt(row.totalAmt) }}</td>
            </tr>
          </tbody>
        </table>

      <div class="print-sign-footer-fixed">
        <div class="sign-block">
          <span class="sign-item"><span class="sign-label">退库操作员</span><span class="sign-value sign-value--blank"></span></span>
          <span class="sign-item"><span class="sign-label">退款人员</span><span class="sign-value sign-value--blank"></span></span>
          <span class="sign-item sign-item--wide">
            <span class="sign-label">打印日期</span>
            <span class="sign-value">{{ formatDateTime(row.printDate || new Date()) }}</span>
          </span>
        </div>
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
    renderCopies() {
      return 1
    },
    pageSizeForPrint() {
      return this.isA4Paper ? 'A4' : '210mm 140mm'
    }
  },
  methods: {
    /** 表头日期时间：yyyy-MM-dd HH:mm:ss */
    formatDateTime(v) {
      if (!v) return ''
      const d = new Date(v)
      if (isNaN(d.getTime())) return v
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      const s = String(d.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${day} ${h}:${mm}:${s}`
    },
    formatQty(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(2)
    },
    formatPrice(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(4)
    },
    formatAmt(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(2)
    },
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
      if (!tr) return Math.max(120, pagePx * 0.26)

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
      mirror.style.wordBreak = 'break-all'
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
      const root = this.$refs.receiptRefundDepotOrderPrintRef || this.$el
      if (!root || typeof document === 'undefined') return

      const cells = root.querySelectorAll('td.cell-textual .cell-text')
      if (!cells || !cells.length) return

      const colRatios = [0.26, 0.18, 0.14, 0.12, 0.14, 0.16]

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
      // 确保医院名称已加载完成后再打印
      this.ensureHospitalNameLoaded().then(() => {
        // 等待Vue更新DOM并让浏览器完成一次布局后再触发打印
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.applyPrintCellAutoFont()
            this.$print(
              this.$refs.receiptRefundDepotOrderPrintRef,
              { injectPageSize: true, pageMargin: '0 4mm', waitForAssets: true, beforePrintDelay: 320 },
              this.pageSizeForPrint
            )
          })
        })
      }).catch(() => {
        // 即使加载失败也继续打印
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.applyPrintCellAutoFont()
            this.$print(
              this.$refs.receiptRefundDepotOrderPrintRef,
              { injectPageSize: true, pageMargin: '0 4mm', waitForAssets: true, beforePrintDelay: 320 },
              this.pageSizeForPrint
            )
          })
        })
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
$font-song = SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.print-root-offscreen
  position fixed
  left -9999px
  top 0
  width 210mm
  max-width 900px
  z-index -1
  visibility visible

.refund-depot-order-print.page-slip-landscape.print-root-offscreen
  width 297mm
  max-width 1100px

.receipt-print
  line-height 1.35
  max-width 900px
  margin 0 auto
  font-family $font-song
  min-height 99mm
  box-sizing border-box
  padding-left 1ch
  padding-right 1ch
  break-inside avoid
  page-break-inside avoid

.print-copy-block
  position relative
  min-height 140mm
  box-sizing border-box
  display flex
  flex-direction column
  justify-content flex-start
  break-inside avoid
  page-break-inside avoid

.print-copy-block.is-third-split-copy
  height 140mm
  overflow hidden

.doc-header
  display grid
  grid-template-columns 92px 1fr 92px
  align-items center
  column-gap 6px
  margin-bottom 3px

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
  font-size 15px
  font-weight bold
  text-align center
  margin 0
  line-height 1.25

.info-row
  display flex
  align-items center
  flex-wrap wrap
  margin-bottom 1px
  font-size 10px

.print-head-info
  width 94%
  margin 0 auto 3px
  padding 0

.info-label
  flex 0 0 auto
  flex-shrink 0
  box-sizing border-box
  text-align right
  white-space nowrap
  &::after
    content '：'

.info-label--w1
  flex-basis 4.2em
  max-width 4.2em

.info-label--w2
  flex-basis 4.0em
  max-width 4.0em

.info-label--w3
  flex-basis 9.2em
  max-width 9.2em

.info-label--w4
  flex-basis 5.2em
  max-width 5.2em

.info-value
  flex 1 1 auto
  min-width 0
  margin-right 10px

.info-gap
  margin-left 10px

.detail-table
  width 94%
  table-layout fixed
  border-collapse collapse
  border 1px solid #000
  margin 0 auto 0
  font-family $font-song

.detail-table .col-name
  width 26%
.detail-table .col-spec
  width 18%
.detail-table .col-batch
  width 14%
.detail-table .col-qty
  width 12%
.detail-table .col-price
  width 14%
.detail-table .col-amt
  width 16%

.detail-table th,
.detail-table td
  border 1px solid #000
  padding 1px 3px
  vertical-align middle
  font-size inherit

.detail-table th
  font-weight bold
  background #f5f5f5
  text-align center

.detail-table th .th-text
  display inline-flex
  align-items center
  justify-content center
  max-width 100%
  white-space nowrap

.detail-table tbody td:nth-child(4),
.detail-table tbody td:nth-child(5),
.detail-table tbody td:nth-child(6)
  text-align right

.detail-table td.cell-textual
  text-align left
  vertical-align top
  white-space normal
  word-break break-all

.detail-table td.cell-textual .cell-text
  display -webkit-box
  -webkit-box-orient vertical
  -webkit-line-clamp 2
  line-clamp 2
  overflow hidden
  word-break break-all
  white-space normal
  line-height 1.35

.print-line-clamp-2
  display -webkit-box
  -webkit-box-orient vertical
  -webkit-line-clamp 2
  line-clamp 2
  overflow hidden
  word-break break-all
  white-space normal

.detail-table tbody tr.print-total-row td
  border 1px solid #000
  padding 4px 4px 6px
  font-size 11px
  vertical-align middle

.detail-table tbody tr.print-total-row td.total-label-cell
  text-align left
  font-weight normal

.detail-table tbody tr.print-total-row .total-label
  display inline-block
  text-align right
  white-space nowrap
  &::after
    content '：'

.detail-table tbody tr.print-total-row .total-value
  display inline
  margin-left 6px
  white-space normal
  word-break break-all

.detail-table tbody tr.print-total-row td.total-amt-span
  text-align right
  font-weight normal
  white-space nowrap

.print-sign-footer-fixed
  display none
  width 94%
  margin 0 auto

.sign-block
  display flex
  justify-content space-between
  padding-right 10%
  font-size 11px
  font-family $font-song

.sign-item
  display inline-flex
  align-items center
  flex 0 0 22%
  min-width 0

.sign-item--wide
  flex 0 0 50%

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
  margin 0 4mm !important

@media print
  *
    color #000 !important

  .print-root-offscreen
    position relative !important
    left auto !important
    top auto !important
    z-index auto !important
    width 100% !important
    padding-bottom 0 !important

  .refund-depot-order-print.receipt-print
    width 100% !important
    max-width none !important
    padding 6px 0 0 !important
    box-sizing border-box !important
    padding-left 0 !important
    padding-right 0 !important
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 16px !important

  .print-copy-block
    min-height 140mm !important
    box-sizing border-box
    padding 6mm 0 0 0 !important
    justify-content flex-start !important

  .print-copy-block.is-third-split-copy
    height 140mm !important
    overflow hidden !important

  .print-page-break
    break-after page !important
    page-break-after always !important

  .doc-header
    display grid !important
    grid-template-columns 92px 1fr 92px !important
    align-items center !important
    column-gap 6px !important
    margin-bottom 3px !important

  .doc-header-spacer
    width 92px !important

  .page-meta
    justify-self end !important
    align-self center !important

  .page-index
    font-size 12px !important
    line-height 1 !important
    letter-spacing 0.5px !important

  .doc-title
    font-size 19px !important
    font-weight normal !important
    padding 0 !important
    margin 0 !important
    line-height 1.65 !important
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    page-break-inside avoid !important

  .print-head-info
    width 94% !important
    margin 0 auto 1px !important
    padding 0 !important
    font-size 16px !important
    line-height 1.55 !important

  .info-label--w1
    flex-basis 4.6em !important
    max-width 4.6em !important

  .info-label--w2
    flex-basis 4.4em !important
    max-width 4.4em !important

  .info-label--w3
    flex-basis 10.0em !important
    max-width 10.0em !important

  .info-label--w4
    flex-basis 5.6em !important
    max-width 5.6em !important

  .detail-table
    width 94% !important
    margin-left auto !important
    margin-right auto !important
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 14px !important

  .detail-table th,
  .detail-table td
    border 1px solid #000
    padding 3px 5px !important
    overflow hidden
    text-overflow clip !important
    line-height 1.45 !important

  .detail-table th
    line-height 1.35 !important
    white-space nowrap !important
    padding-top 2px !important
    padding-bottom 2px !important
    background transparent !important
    font-weight normal !important
    -webkit-print-color-adjust economy
    print-color-adjust economy

  .detail-table th .th-text
    display inline-flex !important
    align-items center !important
    justify-content center !important
    max-width 100% !important
    white-space nowrap !important

  .detail-table tbody tr:not(.print-total-row) td:nth-child(4),
  .detail-table tbody tr:not(.print-total-row) td:nth-child(5),
  .detail-table tbody tr:not(.print-total-row) td:nth-child(6)
    font-size 13px !important

  .detail-table tbody tr:not(.print-total-row) td:nth-child(1),
  .detail-table tbody tr:not(.print-total-row) td:nth-child(2),
  .detail-table tbody tr:not(.print-total-row) td:nth-child(3)
    font-size 15px !important

  .detail-table td.cell-textual
    text-align left !important
    vertical-align top !important
    white-space normal !important
    word-break break-all !important

  .detail-table td.cell-textual .cell-text
    display -webkit-box !important
    -webkit-box-orient vertical !important
    -webkit-line-clamp 2 !important
    line-clamp 2 !important
    overflow hidden !important
    white-space normal !important
    word-break break-all !important
    line-height 1.35 !important

  .detail-table tbody tr.print-total-row td
    border 1px solid #000 !important
    font-size 14px !important
    line-height 1.45 !important

  .detail-table tbody tr.print-total-row td.total-amt-span
    text-align right !important
    font-weight normal !important
    white-space nowrap !important

  .detail-table tbody tr.print-total-row .total-label
    &::after
      content '：' !important

  .print-sign-footer-fixed
    display block !important
    position absolute !important
    left 2% !important
    right 2% !important
    bottom 3mm !important
    box-sizing border-box !important
    padding 0
    border-top none
    background transparent
    font-size 17px
    line-height 1.55 !important
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important

  .print-sign-footer-fixed .sign-block
    padding-right 8%
</style>
