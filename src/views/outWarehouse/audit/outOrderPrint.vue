<template>
  <div
    class="out-order-print receipt-print browser-print-root"
    ref="receiptOrderPrintRef"
    :class="[rootOrientationClass, { 'print-root-offscreen': !embedPreview }]"
    :style="printStyle"
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
          <span v-if="hospitalName">{{ hospitalName }}</span>物资出库单
        </div>
        <div class="page-meta">
          <span class="page-index">{{ pageIndex + 1 }}/{{ detailPages.length }}</span>
        </div>
      </div>
      <div class="print-head-info print-head-grid">
        <div class="print-head-cell">
          <span class="info-label">发往科</span>
          <span class="info-value">{{ row.departmentName || '' }}</span>
        </div>
        <div class="print-head-cell">
          <span class="info-label">仓库</span>
          <span class="info-value">{{ row.warehouseName || '' }}</span>
        </div>
        <div class="print-head-cell">
          <span class="info-label">单据号</span>
          <span class="info-value">{{ row.billNo || '' }}</span>
        </div>
        <div class="print-head-cell print-head-cell--audit-date">
          <span class="info-label">出库日期（审核）</span>
          <span class="info-value">{{ formatOutboundDate(row.auditDate || row.billDate) }}</span>
        </div>
        <div class="print-head-cell print-head-cell--span2">
          <span class="info-label">资金来源</span>
          <span class="info-value">{{ row.fundSource || '' }}</span>
        </div>
      </div>
      <table class="detail-table" :style="tableStyle">
        <colgroup>
          <col class="col-name" />
          <col class="col-spec" />
          <col class="col-qty" />
          <col class="col-unit" />
          <col class="col-price" />
          <col class="col-amt" />
          <col class="col-origin" />
          <col class="col-batch" />
          <col class="col-exp" />
        </colgroup>
        <!-- 页眉：标题 + 发往科室等（thead 在打印时每页重复） -->
        <thead>
          <tr>
            <th><span class="th-text">消耗品名称</span></th>
            <th><span class="th-text">规格型号</span></th>
            <th><span class="th-text">数量</span></th>
            <th><span class="th-text">单位</span></th>
            <th><span class="th-text">采购价</span></th>
            <th><span class="th-text">采购金额</span></th>
            <th><span class="th-text">产地</span></th>
            <th><span class="th-text">批号</span></th>
            <th><span class="th-text">效期</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in detailPage" :key="`${pageIndex}-${idx}`">
            <td class="cell-textual cell-name-batch"><span class="cell-text">{{ item.materialName || '' }}</span></td>
            <td class="cell-textual"><span class="cell-text">{{ formatSpecModel(item) }}</span></td>
            <td>{{ formatNum(item.qty) }}</td>
            <td class="cell-textual"><span class="cell-text">{{ item.unitName || '' }}</span></td>
            <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td>{{ formatAmt(item.amt) }}</td>
            <td class="cell-textual"><span class="cell-text">{{ item.factoryName || '' }}</span></td>
            <td class="cell-textual cell-name-batch"><span class="cell-text">{{ item.batchNumber || '' }}</span></td>
            <td class="cell-textual"><span class="cell-text">{{ formatValidDate(item.endTime || item.periodDate) }}</span></td>
          </tr>
          <!-- 合计：大写占前四列；小写金额横跨采购价、采购金额两列 -->
          <tr v-if="pageIndex === detailPages.length - 1" class="print-total-row">
            <td colspan="4" class="total-label-cell">
              <span class="total-label">合计</span><span class="total-value">{{ row.totalAmtConverter || '' }}</span>
            </td>
            <td colspan="2" class="total-amt-span">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</td>
            <td colspan="3" class="total-tail-cells"></td>
          </tr>
        </tbody>
      </table>

      <div class="print-sign-footer-fixed">
        <div class="sign-block">
          <div class="sign-item"><span class="sign-label">领用人</span><span class="sign-value sign-value--blank"></span></div>
          <div class="sign-item"><span class="sign-label">保管</span><span class="sign-value sign-value--blank"></span></div>
          <div class="sign-item">
            <span class="sign-label">出库操作员</span>
            <span class="sign-value">{{ row.outboundOperator || row.createBy || '' }}</span>
          </div>
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
  mixins: [hospitalNameMixin],
  props: {
    row: Object,
    billType: [String, Number],
    /** 每页明细行数；未传时默认 6 */
    rowsPerPage: {
      type: Number,
      default: undefined
    },
    /** 预览/打印方向：landscape 横向 | portrait 纵向；空则读打印模板或默认横向 */
    printOrientation: {
      type: String,
      default: ''
    },
    /** third-split: 三等分纸；a4: A4 单页三联 */
    paperType: {
      type: String,
      default: 'third-split'
    },
    /** true：嵌入独立打印页时在视区内预览；false：列表内直打时屏外占位（默认） */
    embedPreview: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      /** 与耗材出库默认模板（bill_type=201）一致：正文略小、表体统一字号 */
      printSetting: {
        orientation: 'landscape',
        /** 与入库 orderPrint 一致：屏上预览默认可读；仍可由打印模板覆盖 */
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
    /** 最终打印方向：父组件传入 > 后台模板 > 默认横向 */
    effectiveOrientation() {
      const p = this.printOrientation
      if (p === 'landscape' || p === 'portrait') return p
      const o = this.printSetting && this.printSetting.orientation
      if (o === 'landscape' || o === 'portrait') return o
      return 'landscape'
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
      return 6
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
    renderCopies() {
      return 1
    },
    /** 纸张尺寸：三等分联默认 210×140；A4 走系统纸张关键字 */
    pageSizeForPrint() {
      return this.isA4Paper ? 'A4' : '210mm 140mm'
    },
    printStyle() {
      const m = this.printSetting
      // 点阵打印机对顶部裁切/留白也比较敏感：对 marginTop 做上限保护
      const safeTopMm = Math.min(2, m.marginTop || 0)
      const margin = `${safeTopMm}mm ${m.marginRight || 0}mm ${m.marginBottom || 0}mm ${m.marginLeft || 0}mm`
      const wide = this.effectiveOrientation === 'landscape'
      return {
        padding: margin,
        fontSize: Math.round(m.fontSize || 14) + 'px',
        // 点阵机更适合等宽字体，减少字形/宽度差异导致的糊边
        fontFamily: '"Courier New", "Consolas", "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif',
        width: wide ? '297mm' : '210mm',
        maxWidth: wide ? '297mm' : '210mm'
      }
    },
    tableStyle() {
      const px = this.printSetting.tableFontSize || 12
      return {
        fontSize: px + 'px',
        fontFamily: '"Courier New", "Consolas", "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif'
      }
    }
  },
  created() {
    this.loadPrintSetting()
  },
  methods: {
    loadPrintSetting() {
      const billType = this.billType || (this.row && this.row.billType) || 201
      getDefaultTemplate(billType).then(response => {
        if (response.data) {
          const data = response.data
          // 与入库 orderPrint 一致：相对后台模板整体放大三号，屏上预览与列表直打更统一
          if (data.fontSize != null) this.printSetting.fontSize = Math.round(Number(data.fontSize)) + 3
          if (data.tableFontSize != null) {
            this.printSetting.tableFontSize = Math.round(Number(data.tableFontSize)) + 3
          }
          if (data.orientation) this.printSetting.orientation = data.orientation
          if (data.marginTop != null) this.printSetting.marginTop = data.marginTop
          if (data.marginBottom != null) this.printSetting.marginBottom = data.marginBottom
          if (data.marginLeft != null) this.printSetting.marginLeft = data.marginLeft
          if (data.marginRight != null) this.printSetting.marginRight = data.marginRight
        }
      }).catch(() => {})
    },
    /** 出库日期（审核）：yyyy-MM-dd */
    formatOutboundDate(val) {
      if (!val) return ''
      const d = new Date(val)
      if (isNaN(d.getTime())) return val
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    formatNum(v) {
      return formatQuantity(v, 2)
    },
    formatPrice(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(4)
    },
    /** 金额四位小数（与采购价一致） */
    formatAmt(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(4)
    },
    /** 有效期显示：日期格式 yyyy-MM-dd */
    formatValidDate(v) {
      if (v == null || v === '') return ''
      const d = new Date(v)
      if (isNaN(d.getTime())) return v
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    /** 规格 + 型号（快照或档案合并后展示） */
    formatSpecModel(item) {
      if (!item) return ''
      const a = (item.materialSpeci || '').trim()
      const b = (item.materialModel || '').trim()
      if (!a && !b) return ''
      return [a, b].filter(Boolean).join(' ')
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
      if (!tr) return Math.max(120, pagePx * 0.14)

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
    /** 明细文本列：超过一行则缩小字号，直至单行或字号下限（与入库打印一致） */
    applyPrintCellAutoFont() {
      const root = this.$refs.receiptOrderPrintRef || this.$el
      if (!root || typeof document === 'undefined') return

      const cells = root.querySelectorAll('td.cell-textual .cell-text')
      if (!cells || !cells.length) return

      // 与 colgroup 宽度比例一致（总和不必为 1，这里用相对比例即可）
      const colRatios = [0.14, 0.12, 0.07, 0.04, 0.13, 0.13, 0.08, 0.13, 0.08]

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
    /**
     * 触发浏览器打印。三等分纸高度约 99mm（A4 纵向 297mm 的 1/3）。
     */
    start() {
      const printNow = () => {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            const el = this.$refs.receiptOrderPrintRef || this.$el
            if (!el) {
              console.warn('[outOrderPrint] 打印节点未就绪')
              return
            }
            const pageSize = this.pageSizeForPrint
            this.applyPrintCellAutoFont()
            try {
              if (typeof this.$print === 'function') {
                this.$print(el, {
                  injectPageSize: true,
                  pageMargin: '0 4mm',
                  waitForAssets: true,
                  beforePrintDelay: 320
                }, pageSize)
              } else {
                window.print()
              }
            } catch (e) {
              console.error('[outOrderPrint] 打印失败:', e)
            }
          })
        })
      }

      // 等待医院名称加载完成后再打印，避免标题/字段中间段渲染不完整
      if (typeof this.ensureHospitalNameLoaded === 'function') {
        this.ensureHospitalNameLoaded().then(printNow).catch(printNow)
      } else {
        printNow()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
$font-song = SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

/* 不用 hidden/display:none，避免打印 iframe 内页脚被裁掉；屏上挪到视区外 */
.print-root-offscreen
  position fixed
  left -9999px
  top 0
  width 210mm
  max-width 210mm
  z-index -1
  visibility visible

.out-order-print.page-slip-landscape.print-root-offscreen
  width 297mm
  max-width 297mm

.receipt-print
  line-height 1.35
  /* 与入库 orderPrint：按纸张宽度占满，避免屏上像“缩在一角” */
  width 210mm
  max-width 210mm
  margin 0 auto
  font-family $font-song
  min-height 99mm
  box-sizing border-box
  /* 左右各缩进约 1 个汉字宽度 */
  padding-left 1ch
  padding-right 1ch
  break-inside avoid
  page-break-inside avoid

.out-order-print.page-slip-landscape.receipt-print
  width 297mm
  max-width 297mm

.print-copy-block
  min-height 140mm
  position relative
  box-sizing border-box
  display flex
  flex-direction column
  justify-content flex-start
  break-inside avoid
  page-break-inside avoid

.print-copy-block.is-third-split-copy
  height auto
  min-height 140mm
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
  /* 与入库物资入库单标题一致，屏上更醒目 */
  font-size 20px
  font-weight normal
  text-align center
  margin 0
  line-height 1.1

.header-cell
  padding 4px 2px 6px
  border none
  vertical-align top

.print-doc-header + tr th
  border-top 1px solid #000

.print-head-info
  width 100%
  margin 0 auto 6px
  padding 0

/* 第一列放「发往科 + 出库日期（审核）」：首列再宽、中列再窄，中列整体更靠右 */
.print-head-grid
  display grid
  grid-template-columns 1.72fr 0.62fr 0.96fr
  column-gap 8px
  row-gap 1px
  font-size 12px

.print-head-cell
  display flex
  align-items center
  min-width 0

.print-head-cell--span2
  grid-column 2 / span 2

.print-head-cell--audit-date .info-value
  white-space nowrap

.info-label
  flex 0 0 auto
  flex-shrink 0
  box-sizing border-box
  text-align left
  margin-right 0
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
  margin-bottom 6px
  font-family $font-song

/* 消耗品名称 14%；产地 8% */
.detail-table .col-name
  width 14%
.detail-table .col-spec
  width 12%
.detail-table .col-qty
  width 7%
.detail-table .col-unit
  width 4%
.detail-table .col-price
  width 13%
.detail-table .col-amt
  width 13%
.detail-table .col-origin
  width 8%
.detail-table .col-batch
  width 13%
.detail-table .col-exp
  width 8%

.detail-table th,
.detail-table td
  border 1px solid #000
  padding 4px 6px
  vertical-align middle
  font-size inherit

.detail-table thead tr.print-doc-header td
  border none

.detail-table thead tr:not(.print-doc-header) th
  border-top 1px solid #000

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

.detail-table tbody td:nth-child(3),
.detail-table tbody td:nth-child(5),
.detail-table tbody td:nth-child(6)
  text-align right

.detail-table tbody td:nth-child(4)
  text-align center
  padding 2px 2px

.detail-table td.cell-textual
  text-align left
  vertical-align top
  white-space normal
  word-break break-all

.detail-table td.cell-textual .cell-text
  display block
  overflow visible
  word-break break-all
  white-space normal
  line-height 1.35

.detail-table tbody tr:not(.print-total-row) td.cell-name-batch
  vertical-align top
  overflow visible

.detail-table tbody tr:not(.print-total-row) td:nth-child(2)
  vertical-align top

/* 合计行：小写横跨采购价+采购金额两列 */
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

.sign-block
  display grid
  grid-template-columns 1fr 1fr 1fr
  column-gap 12px
  margin-top 2px
  font-size 11px
  font-family $font-song

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

/* 列表内直打：屏上不占用视口；独立打印页 embedPreview 时见下方修饰类 */
.print-sign-footer-fixed
  display none
  width 94%
  margin 0 auto

/* 非屏外直打（独立打印页、弹窗预览）：展示签字区 */
.out-order-print:not(.print-root-offscreen) .print-sign-footer-fixed
  display block
  width 100%
  margin-top 8px
  box-sizing border-box

.out-order-print:not(.print-root-offscreen) .print-sign-footer-fixed .sign-block
  font-size 12px
</style>

<style lang="stylus" media="print">
/* @page 的纸张尺寸由 $print(injectPageSize) 注入（三等分 210×140；A4 为 A4），这里只统一边距 */
@page
  margin 0 4mm !important

@media print
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
    max-width none
    padding 0
    box-sizing border-box !important
    padding-left 0 !important
    padding-right 0 !important
    min-height auto !important
    /* Epson LQ-690K：等宽+固定字号，减少模糊差异 */
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 16px !important
    -webkit-font-smoothing none !important
    -moz-osx-font-smoothing none !important
    text-rendering optimizeSpeed

  .print-copy-block
    min-height 140mm !important
    box-sizing border-box
    /* 针式机顶部可打印区域偏小：整体下移内容，避免标题/单据号上半截被裁切 */
    padding 6mm 0 0 0 !important
    justify-content flex-start !important

  .print-copy-block.is-third-split-copy
    height auto !important
    min-height 140mm !important
    overflow visible !important

  .print-page-break
    break-after page !important
    page-break-after always !important

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

  /* 点阵打印：标题区下移，保证在可打印区域 */
  .header-cell
    padding 2px 2px 2px !important

  .print-head-info
    width 94% !important
    margin 0 auto 1px !important
    padding 0 !important
    font-size 16px !important
    line-height 1.55 !important

  .print-head-grid
    display grid !important
    grid-template-columns 1.72fr 0.62fr 0.96fr !important
    column-gap 8px !important
    row-gap 1px !important

  .print-head-cell
    display flex !important
    align-items center !important
    min-width 0 !important

  .print-head-cell--span2
    grid-column 2 / span 2 !important

  .print-head-cell--audit-date .info-value
    white-space nowrap !important

  .print-head-info .info-label
    text-align left !important
    margin-right 0 !important

  .print-head-info .info-label::after
    content ':' !important
    margin-right 2px !important

  .print-head-info .info-value
    margin-right 8px !important

  .detail-table
    width 94% !important
    margin-left auto !important
    margin-right auto !important
    /* 点阵打印：固定字号/等宽，降低模糊 */
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 14px !important

  .detail-table th,
  .detail-table td
    border 1px solid #000
    padding 3px 5px !important
    overflow visible
    word-break break-word !important
    line-height 1.45 !important

  .detail-table th
    line-height 1.35 !important
    white-space nowrap !important
    padding-top 2px !important
    padding-bottom 2px !important

  /* 表格列标题不加冒号 */
  .detail-table th .th-text
    display inline-flex !important
    align-items center !important
    justify-content center !important
    max-width 100% !important
    white-space nowrap !important

  .detail-table tbody tr:not(.print-total-row) td:nth-child(2)
    vertical-align top !important

  .detail-table tbody tr:not(.print-total-row) td.cell-name-batch
    vertical-align top !important

  /* 有效期字号缩小 2 号 */
  .detail-table tbody td:nth-child(9)
    font-size 12px !important

  /* 数量、采购价、采购金额 字号缩小 1 号 */
  .detail-table tbody td:nth-child(3),
  .detail-table tbody td:nth-child(5),
  .detail-table tbody td:nth-child(6)
    font-size 13px !important

  .detail-table thead tr.print-doc-header td
    border none !important

  .detail-table td.cell-textual
    text-align left !important
    vertical-align top !important
    white-space normal !important
    word-break break-all !important

  .detail-table td.cell-textual .cell-text
    display block !important
    overflow visible !important
    white-space normal !important
    word-break break-all !important
    line-height 1.35 !important

  .detail-table th
    background transparent !important
    font-weight normal !important
    -webkit-print-color-adjust economy
    print-color-adjust economy

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

  /* 每联底部签字 */
  .print-sign-footer-fixed
    display block !important
    position static !important
    left auto !important
    right auto !important
    bottom auto !important
    box-sizing border-box !important
    padding 0
    border-top none
    background transparent
    font-size 17px
    line-height 1.55 !important
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important

  .print-sign-footer-fixed .sign-block
    display grid !important
    grid-template-columns 1fr 1fr 1fr !important
    column-gap 12px !important
    margin-top 2px !important
    padding-right 0 !important
</style>
