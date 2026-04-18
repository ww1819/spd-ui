<template>
  <div
    class="out-order-print receipt-print print-root-offscreen"
    ref="receiptOrderPrintRef"
    :class="rootOrientationClass"
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
      <div class="info-row print-head-info">
        <span class="info-label info-label--w1">发往科</span>
        <span class="info-value">{{ row.departmentName || '' }}</span>
        <span class="info-label info-label--w2 info-gap">单据号</span>
        <span class="info-value">{{ row.billNo || '' }}</span>
        <span class="info-label info-label--w3 info-gap">出库日期（审核）</span>
        <span class="info-value">{{ formatOutboundDate(row.auditDate || row.billDate) }}</span>
        <span class="info-label info-label--w4 info-gap">资金来源</span>
        <span class="info-value">{{ row.fundSource || '' }}</span>
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
            <td class="cell-textual cell-name-batch"><span class="cell-text print-line-clamp-2">{{ item.materialName || '' }}</span></td>
            <td class="cell-textual"><span class="cell-text print-line-clamp-2">{{ formatSpecModel(item) }}</span></td>
            <td>{{ formatNum(item.qty) }}</td>
            <td class="cell-textual"><span class="cell-text print-line-clamp-2">{{ item.unitName || '' }}</span></td>
            <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td>{{ formatAmt(item.amt) }}</td>
            <td class="cell-textual"><span class="cell-text print-line-clamp-2">{{ item.factoryName || '' }}</span></td>
            <td class="cell-textual cell-name-batch"><span class="cell-text print-line-clamp-2">{{ item.batchNumber || '' }}</span></td>
            <td class="cell-textual"><span class="cell-text print-line-clamp-2">{{ formatValidDate(item.endTime || item.periodDate) }}</span></td>
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
          <span class="sign-item"><span class="sign-label">领用人</span><span class="sign-value sign-value--blank"></span></span>
          <span class="sign-item"><span class="sign-label">保管</span><span class="sign-value sign-value--blank"></span></span>
          <span class="sign-item sign-item--wide">
            <span class="sign-label">出库操作员</span>
            <span class="sign-value">{{ row.outboundOperator || row.createBy || '' }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'
import { getDefaultTemplate } from '@/api/system/printSetting'

export default {
  mixins: [hospitalNameMixin],
  props: {
    row: Object,
    billType: [String, Number],
    /** 预览/打印方向：landscape 横向 | portrait 纵向；空则读打印模板或默认横向 */
    printOrientation: {
      type: String,
      default: ''
    },
    /** third-split: 三等分纸；a4: A4 单页三联 */
    paperType: {
      type: String,
      default: 'third-split'
    }
  },
  data() {
    return {
      /** 与耗材出库默认模板（bill_type=201）一致：正文略小、表体统一字号 */
      printSetting: {
        orientation: 'landscape',
        fontSize: 16,
        tableFontSize: 11,
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
    detailPages() {
      const list = (this.row && Array.isArray(this.row.detailList)) ? this.row.detailList : []
      if (!list.length) return [[]]
      const pageSize = 6
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
        fontSize: (m.fontSize || 16) + 'px',
        // 点阵机更适合等宽字体，减少字形/宽度差异导致的糊边
        fontFamily: '"Courier New", "Consolas", "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif',
        width: wide ? '297mm' : '210mm',
        maxWidth: wide ? '297mm' : '210mm'
      }
    },
    tableStyle() {
      const px = this.printSetting.tableFontSize || 11
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
          if (data.fontSize != null) this.printSetting.fontSize = data.fontSize
          if (data.tableFontSize != null) this.printSetting.tableFontSize = data.tableFontSize
          if (data.orientation) this.printSetting.orientation = data.orientation
          if (data.marginTop != null) this.printSetting.marginTop = data.marginTop
          if (data.marginBottom != null) this.printSetting.marginBottom = data.marginBottom
          if (data.marginLeft != null) this.printSetting.marginLeft = data.marginLeft
          if (data.marginRight != null) this.printSetting.marginRight = data.marginRight
        }
      }).catch(() => {})
    },
    formatOutboundDate(val) {
      if (!val) return ''
      const d = new Date(val)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      const s = String(d.getSeconds()).padStart(2, '0')
      return `${y}${m}${day}${h}:${min}:${s}`
    },
    formatNum(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(2)
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
    /** 明细“文本列”最多两行；两行仍装不下则缩小字号（与入库打印一致） */
    applyPrintCellAutoFont() {
      const root = this.$refs.receiptOrderPrintRef || this.$el
      if (!root || typeof document === 'undefined') return

      const cells = root.querySelectorAll('td.cell-textual .cell-text')
      if (!cells || !cells.length) return

      // 与 colgroup 宽度比例一致（总和不必为 1，这里用相对比例即可）
      const colRatios = [0.14, 0.12, 0.07, 0.04, 0.13, 0.13, 0.08, 0.13, 0.08]

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
                  pageMargin: '0',
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
  max-width 900px
  z-index -1
  visibility visible

.out-order-print.page-slip-landscape.print-root-offscreen
  width 297mm
  max-width 1100px

.receipt-print
  line-height 1.35
  max-width 900px
  margin 0 auto
  font-family $font-song
  min-height 99mm
  box-sizing border-box
  /* 左右各缩进约 1 个汉字宽度 */
  padding-left 1ch
  padding-right 1ch
  break-inside avoid
  page-break-inside avoid

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

.header-cell
  padding 4px 2px 6px
  border none
  vertical-align top

.print-doc-header + tr th
  border-top 1px solid #000

.info-row
  display flex
  align-items center
  flex-wrap wrap
  margin-bottom 1px
  font-size 10px

.print-head-info
  width 96%
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

/* 出库抬头字段较多：用固定宽度列保证冒号竖线对齐 */
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
  width 96%
  table-layout fixed
  border-collapse collapse
  border 1px solid #000
  margin-bottom 0
  margin-left auto
  margin-right auto
  font-family $font-song

/* 消耗品名称 14%（最多两行截断）；产地 8% */
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
  padding 1px 3px
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
  display -webkit-box
  -webkit-box-orient vertical
  -webkit-line-clamp 2
  line-clamp 2
  overflow hidden
  word-break break-all
  white-space normal
  line-height 1.35

/* 名称、批号：td 保持 table-cell 以与整行底边对齐；两行截断在内层 span */
.print-line-clamp-2
  display -webkit-box
  -webkit-box-orient vertical
  -webkit-line-clamp 2
  line-clamp 2
  overflow hidden
  word-break break-all
  white-space normal

.detail-table tbody tr:not(.print-total-row) td.cell-name-batch
  vertical-align top
  overflow hidden

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

/* 屏上不占用视口；打印时在复制块内展示 */
.print-sign-footer-fixed
  display none
  width 96%
  margin 0 auto
</style>

<style lang="stylus" media="print">
/* @page 的纸张尺寸由 $print(injectPageSize) 注入（三等分 210×140；A4 为 A4），这里只统一边距 */
@page
  margin 0

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

  .receipt-print
    width 100% !important
    max-width none
    padding 0
    box-sizing border-box !important
    padding-left 1ch !important
    padding-right 1ch !important
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

  /* 点阵打印：标题区下移，保证在可打印区域 */
  .header-cell
    padding 2px 2px 2px !important

  .print-head-info
    width 96% !important
    margin 0 auto 1px !important
    padding 0 !important
    font-size 16px !important
    line-height 1.55 !important

  /* 打印字号更大：略加宽标签列，保证冒号竖线仍对齐 */
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
    width 96% !important
    margin-left auto !important
    margin-right auto !important
    /* 点阵打印：固定字号/等宽，降低模糊 */
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

  /* 表格列标题不加冒号 */
  .detail-table th .th-text
    display inline-flex !important
    align-items center !important
    justify-content center !important
    max-width 100% !important
    white-space nowrap !important

  .detail-table tbody tr:not(.print-total-row) td:nth-child(2)
    vertical-align top !important

  /* 名称、批号：内层两行截断，td 仍为单元格以便与整行底边框对齐 */
  .detail-table tbody tr:not(.print-total-row) td.cell-name-batch
    vertical-align top !important

  .detail-table tbody tr:not(.print-total-row) .print-line-clamp-2
    display -webkit-box !important
    -webkit-box-orient vertical !important
    -webkit-line-clamp 2 !important
    line-clamp 2 !important
    white-space normal !important
    word-break break-all !important
    overflow hidden !important

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
    display -webkit-box !important
    -webkit-box-orient vertical !important
    -webkit-line-clamp 2 !important
    line-clamp 2 !important
    overflow hidden !important
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
