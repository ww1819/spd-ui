<template>
  <div class="out-order-print receipt-print" ref="receiptOrderPrintRef">
    <div
      v-for="(pageRows, pageIndex) in pagedDetailList"
      :key="`print-page-${pageIndex}`"
      class="print-page"
      :class="{ 'print-page-break': pageIndex < pagedDetailList.length - 1 }"
      :style="printStyle"
    >
      <div class="doc-header">
        <div class="doc-header-spacer" aria-hidden="true"></div>
        <div class="doc-title">
          <span v-if="hospitalName">{{ hospitalName }}</span>出库单
        </div>
        <div class="page-meta">
          <span class="page-index">第{{ pageIndex + 1 }}/共{{ pagedDetailList.length }}页</span>
        </div>
      </div>

      <div class="info-block" :style="tableStyle">
        <div class="info-grid">
          <div class="info-cell">
            <span class="info-label info-label--col1">仓库</span>
            <span class="info-value">{{ row.warehouseName || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--col2">科室</span>
            <span class="info-value">{{ row.departmentName || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--col3">供应商</span>
            <span class="info-value">{{ row.supplierName || '' }}</span>
          </div>
          <div class="info-cell info-cell--bill-no">
            <span class="info-label info-label--col1">单号</span>
            <span class="info-value">{{ row.billNo || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--col2">打印日期</span>
            <span class="info-value">{{ printDateTime }}</span>
          </div>
          <div class="info-cell info-cell--placeholder" aria-hidden="true"></div>
        </div>
      </div>

      <table class="detail-table" :style="tableStyle">
        <colgroup>
          <col style="width: 9%;" />
          <col style="width: 14%;" />
          <col style="width: 11%;" />
          <col style="width: 12%;" />
          <col style="width: 10%;" />
          <col style="width: 6%;" />
          <col style="width: 8%;" />
          <col style="width: 10%;" />
          <col style="width: 8%;" />
          <col style="width: 12%;" />
        </colgroup>
        <thead>
          <tr>
            <th>财务分类</th>
            <th>名称</th>
            <th>规格</th>
            <th>厂家</th>
            <th>批号</th>
            <th>单位</th>
            <th>数量</th>
            <th>有效期</th>
            <th>单价</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in pageRows" :key="`${pageIndex}-${idx}`">
            <td class="cell-textual">
              <span class="cell-text">{{ item.financeCategoryName || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.materialName || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.materialSpeci || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.factoryName || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.batchNumber || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.unitName || '' }}</span>
            </td>
            <td class="cell-num">{{ formatNum(item.qty) }}</td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.endTime || '' }}</span>
            </td>
            <td class="cell-num">{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td class="cell-num">{{ formatAmt(item.amt) }}</td>
          </tr>
          <tr class="print-subtotal-row">
            <td colspan="8" class="subtotal-label-cell">小计</td>
            <td></td>
            <td class="cell-num">{{ formatAmt(pageSubtotalAmt(pageRows)) }}</td>
          </tr>
          <template v-if="pageIndex === pagedDetailList.length - 1">
            <tr class="summary-row">
              <td colspan="2" class="summary-label-cell">合计：大写</td>
              <td colspan="7" class="summary-text-cell">{{ row.totalAmtConverter || '' }}</td>
              <td></td>
            </tr>
            <tr class="summary-row">
              <td colspan="2" class="summary-label-cell">合计：小写</td>
              <td colspan="7"></td>
              <td class="cell-num">{{ formatAmt(row.totalAmt) }}</td>
            </tr>
          </template>
        </tbody>
      </table>

      <div class="sign-block" :style="tableStyle">
        <div class="sign-item">
          <span class="sign-label">打印日期</span>
          <span class="sign-value">{{ printDateTime }}</span>
        </div>
        <div class="sign-item">
          <span class="sign-label">审核人</span>
          <span class="sign-value">{{ row.auditorName || '' }}</span>
        </div>
        <div class="sign-item">
          <span class="sign-label">制单人</span>
          <span class="sign-value">{{ row.createBy || '' }}</span>
        </div>
        <div class="sign-item">
          <span class="sign-label">领用人</span>
          <span class="sign-value">{{ row.recipientName || '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'
import { getDefaultTemplate } from '@/api/system/printSetting'
import { formatQuantity } from '@/utils/format-quantity'

export default {
  name: 'OutOrderPrintZq',
  mixins: [hospitalNameMixin],
  props: {
    row: Object,
    billType: [String, Number],
    rowsPerPage: {
      type: Number,
      default: undefined
    },
    printOrientation: {
      type: String,
      default: ''
    },
    embedPreview: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      pagePaperSize: '210mm 140mm',
      printDateTime: '',
      printSetting: {
        orientation: 'portrait',
        fontSize: 21,
        tableFontSize: 12,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0
      }
    }
  },
  computed: {
    pagedDetailList() {
      const details = (this.row && this.row.detailList) || []
      const pageRows = this.effectiveRowsPerPage
      if (!details.length) return [[]]
      const result = []
      for (let i = 0; i < details.length; i += pageRows) {
        result.push(details.slice(i, i + pageRows))
      }
      return result
    },
    effectiveRowsPerPage() {
      const n = Number(this.rowsPerPage)
      if (Number.isFinite(n) && n >= 1) {
        return Math.min(100, Math.max(1, Math.round(n)))
      }
      return 5
    },
    printStyle() {
      const m = this.printSetting
      const clampNonNegativeMm = (v) => {
        const n = Number(v)
        if (isNaN(n)) return 0
        return Math.max(0, n)
      }
      const safeTopMm = Math.min(2, clampNonNegativeMm(m.marginTop))
      const margin = `${safeTopMm}mm ${clampNonNegativeMm(m.marginRight)}mm ${clampNonNegativeMm(m.marginBottom)}mm ${clampNonNegativeMm(m.marginLeft)}mm`
      return {
        padding: margin,
        fontSize: Math.round(m.fontSize || 14) + 'px',
        fontFamily: 'SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif'
      }
    },
    tableStyle() {
      return {
        fontSize: Math.round(this.printSetting.tableFontSize || 12) + 'px',
        fontFamily: 'SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif'
      }
    }
  },
  created() {
    this.printDateTime = this.formatPrintDateTime(new Date())
    this.loadPrintSetting()
  },
  methods: {
    formatPrintDateTime(date) {
      const d = date || new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      const s = String(d.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${day} ${h}:${min}:${s}`
    },
    formatNum(v) {
      return formatQuantity(v, 2)
    },
    formatPrice(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      if (isNaN(n)) return v
      const s = n.toFixed(4)
      return s.replace(/\.?0+$/, '') || '0'
    },
    formatAmt(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(2)
    },
    pageSubtotalAmt(pageRows) {
      if (!pageRows || !pageRows.length) return 0
      return pageRows.reduce((sum, item) => {
        const n = Number(item && item.amt)
        return sum + (isNaN(n) ? 0 : n)
      }, 0)
    },
    loadPrintSetting() {
      const billType = this.billType || (this.row && this.row.billType) || 201
      getDefaultTemplate(billType).then(response => {
        if (response.data) {
          const data = response.data
          if (data.fontSize != null) this.printSetting.fontSize = Math.round(Number(data.fontSize)) + 3
          if (data.tableFontSize != null) this.printSetting.tableFontSize = Math.round(Number(data.tableFontSize)) + 3
          if (data.orientation) this.printSetting.orientation = data.orientation
          if (data.marginTop != null) this.printSetting.marginTop = data.marginTop
          if (data.marginBottom != null) this.printSetting.marginBottom = data.marginBottom
          if (data.marginLeft != null) this.printSetting.marginLeft = data.marginLeft
          if (data.marginRight != null) this.printSetting.marginRight = data.marginRight
        }
      }).catch(() => {})
    },
    applyPrintCellAutoFont() {
      const root = this.$refs.receiptOrderPrintRef || this.$el
      if (!root || typeof document === 'undefined') return

      const cells = root.querySelectorAll('td.cell-textual .cell-text')
      if (!cells || !cells.length) return

      const minPx = 8
      const maxSteps = 48
      const ratios = [0.09, 0.14, 0.11, 0.12, 0.10, 0.06, 0.08, 0.10, 0.08, 0.12]

      const removeMirror = (m) => {
        try {
          if (m && m.parentNode) m.parentNode.removeChild(m)
        } catch (e) {
          // ignore
        }
      }

      const mmToPx = (mm) => {
        const probe = document.createElement('div')
        probe.style.position = 'absolute'
        probe.style.left = '-100000px'
        probe.style.width = `${mm}mm`
        document.body.appendChild(probe)
        const w = probe.getBoundingClientRect().width || 0
        removeMirror(probe)
        return w
      }

      const estimateInnerWidthPx = (td) => {
        const tdCs = window.getComputedStyle(td)
        const padL = parseFloat(tdCs.paddingLeft || '0') || 0
        const padR = parseFloat(tdCs.paddingRight || '0') || 0
        const measured = Math.max(0, (td.clientWidth || td.getBoundingClientRect().width || 0) - padL - padR)
        if (measured > 10) return measured

        const pagePx = mmToPx(210) || 794
        const tr = td.parentElement
        if (!tr) return Math.max(80, pagePx * 0.1)
        const tds = Array.from(tr.children || []).filter(n => n && n.tagName === 'TD')
        const idx = tds.indexOf(td)
        const r = ratios[idx] != null ? ratios[idx] : (1 / Math.max(1, tds.length))
        return Math.max(60, pagePx * r - padL - padR)
      }

      const measureUnclampedHeightPx = (el, fontPx) => {
        const td = el.closest('td')
        if (!td) return 0
        const cs = window.getComputedStyle(el)
        const mirror = document.createElement('div')
        mirror.textContent = el.textContent || ''
        const innerW = estimateInnerWidthPx(td)
        mirror.style.cssText = `position:absolute;left:-100000px;visibility:hidden;width:${innerW}px;white-space:normal;word-break:break-word;line-height:1.35;font-family:${cs.fontFamily};font-size:${fontPx}px`
        document.body.appendChild(mirror)
        const h = mirror.scrollHeight
        removeMirror(mirror)
        return h
      }

      cells.forEach((el) => {
        if (!el || el.nodeType !== 1) return
        const text = (el.textContent || '').trim()
        if (!text) return
        el.style.fontSize = ''
        el.style.lineHeight = ''
        const cs0 = window.getComputedStyle(el)
        let fontPx = parseFloat(cs0.fontSize || '12') || 12
        let step = 0
        while (step < maxSteps) {
          const oneLineMaxH = Math.max(10, Math.round(fontPx * 1.35)) + 1
          const h = measureUnclampedHeightPx(el, fontPx)
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
      this.printDateTime = this.formatPrintDateTime(new Date())
      const doPrint = () => {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            const el = this.$refs.receiptOrderPrintRef || this.$el
            if (!el) return
            const pageSize = this.pagePaperSize || '210mm 140mm'
            this.applyPrintCellAutoFont()
            if (typeof this.$print === 'function') {
              this.$print(el, {
                injectPageSize: true,
                pageMargin: '0 4mm',
                waitForAssets: true,
                beforePrintDelay: 320
              }, pageSize)
            } else {
              try {
                window.print()
              } catch (e) {
                console.error('打印失败:', e)
              }
            }
          })
        })
      }
      Promise.all([
        this.ensureHospitalNameLoaded ? this.ensureHospitalNameLoaded() : Promise.resolve(),
        Promise.resolve()
      ]).then(doPrint).catch(doPrint)
    }
  }
}
</script>

<style lang="stylus" scoped>
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
  page-break-after auto

.print-page.print-page-break
  page-break-after always

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

.info-grid
  display grid
  grid-template-columns 1.1fr 1.9fr 1.2fr
  column-gap 10px
  row-gap 2px
  overflow visible

.info-cell
  display flex
  align-items center
  min-width 0
  overflow visible

.info-cell--placeholder
  visibility hidden
  min-height 0

.info-label
  flex 0 0 auto
  white-space nowrap
  text-align left
  &::after
    content '：'

.info-label--col1
  width 2.5em

.info-label--col2
  width 4.5em

.info-label--col3
  width 2.5em

.info-cell--bill-no .info-label--col1
  width 2.5em
  flex-shrink 0

.info-cell--bill-no .info-value
  white-space nowrap
  min-width 0

.info-value
  flex 1 1 auto
  min-width 0
  word-break break-word

.detail-table
  width 100%
  table-layout fixed
  border-collapse collapse
  border 1px solid #000
  margin-bottom 8px

.detail-table th,
.detail-table td
  border 1px solid #000
  padding 3px 4px
  text-align center
  vertical-align middle

.detail-table th
  font-weight normal
  background #f5f5f5

.detail-table td.cell-textual
  text-align left
  vertical-align top
  white-space normal
  word-break break-word

.detail-table td.cell-textual .cell-text
  display block
  line-height 1.35

.detail-table td.cell-num
  text-align right
  white-space nowrap

.detail-table tbody tr.print-subtotal-row td,
.detail-table tbody tr.summary-row td
  border 1px solid #000
  padding 4px 6px
  vertical-align middle

.detail-table tbody tr.print-subtotal-row td.subtotal-label-cell
  text-align left
  white-space nowrap

.summary-label-cell
  text-align left
  white-space nowrap

.summary-text-cell
  text-align left
  word-break break-word

.sign-block
  display grid
  grid-template-columns 1.2fr 1fr 1fr 1fr
  column-gap 12px
  margin-top 4px

.sign-item
  display flex
  align-items center
  min-width 0

.sign-label
  flex 0 0 auto
  white-space nowrap
  &::after
    content '：'

.sign-value
  flex 1 1 auto
  min-width 0
  margin-left 4px
  word-break break-word
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

  .receipt-print
    width 100% !important
    max-width none !important
    box-sizing border-box !important
    padding-left 0 !important
    padding-right 0 !important
    font-size 14px !important
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important

  .print-page
    width 100% !important
    min-height auto !important
    height auto !important
    padding-top 4mm !important
    page-break-after auto !important

  .print-page.print-page-break
    page-break-after always !important

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
    line-height 1.7 !important
    margin 0 !important
    padding 0 !important

  .detail-table
    font-size 11px !important

  .detail-table th,
  .detail-table td
    padding 2px 3px !important

  .sign-block
    font-size 12px !important
</style>
