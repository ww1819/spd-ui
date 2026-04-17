<template>
  <div class="order-print receipt-print" ref="receiptOrderPrintRef">
    <div
      v-for="(pageRows, pageIndex) in pagedDetailList"
      :key="`print-page-${pageIndex}`"
      class="print-page"
      :style="printStyle"
    >
      <div class="page-meta">
        <span class="page-index">{{ pageIndex + 1 }}/{{ pagedDetailList.length }}</span>
      </div>

      <!-- 标题：医院名称 + 物资入库单 -->
      <div class="doc-title">
        <span v-if="hospitalName">{{ hospitalName }}</span>物资入库单
      </div>

      <!-- 基本信息区：单据号、供货商、入库日期、资金来源账户 -->
      <div class="info-block" :style="tableStyle">
        <div class="info-row">
          <span class="info-label info-label--l1">单据号</span>
          <span class="info-value">{{ row.billNo || '' }}</span>
          <span class="info-label info-label--l2 info-gap">供货商</span>
          <span class="info-value info-value-wide">{{ row.supplierName || '' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label info-label--l1">入库日期</span>
          <span class="info-value">{{ formatInboundDate(row.billDate) }}</span>
          <span class="info-label info-label--l2 info-gap">资金来源账户</span>
          <span class="info-value">{{ row.fundSourceAccount || '' }}</span>
        </div>
      </div>

      <!-- 耗材明细表：消耗品名称、规格、单位、数量、采购价、采购金额、产地 -->
      <table class="detail-table" :style="tableStyle">
        <colgroup>
          <col style="width: 23%;" />
          <col style="width: 15%;" />
          <col style="width: 6%;" />
          <col style="width: 10%;" />
          <col style="width: 15%;" />
          <col style="width: 14%;" />
          <col style="width: 17%;" />
        </colgroup>
        <thead>
          <tr>
            <th><span class="th-text">消耗品名称</span></th>
            <th><span class="th-text">规格</span></th>
            <th><span class="th-text">单位</span></th>
            <th><span class="th-text">数量</span></th>
            <th><span class="th-text">采购价</span></th>
            <th><span class="th-text">采购金额</span></th>
            <th><span class="th-text">产地</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in pageRows" :key="`${pageIndex}-${idx}`">
            <td class="cell-textual">
              <span class="cell-text">{{ item.materialName || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.materialSpeci || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.unitName || '' }}</span>
            </td>
            <td>{{ formatNum(item.qty) }}</td>
            <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td>{{ formatAmt(item.amt) }}</td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.factoryName || '' }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 合计：仅最后一页显示 -->
      <div v-if="pageIndex === pagedDetailList.length - 1" class="total-row" :style="tableStyle">
        <span class="total-left">
          <span class="total-label">合计</span><span class="total-value">{{ row.totalAmtConverter || '' }}</span>
        </span>
        <span class="total-num">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</span>
      </div>

      <!-- 签字区：每一页都显示，固定在页尾 -->
      <div class="sign-block" :style="tableStyle">
        <span class="sign-item"><span class="sign-label">采购</span><span class="sign-value sign-value--blank"></span></span>
        <span class="sign-item"><span class="sign-label">保管</span><span class="sign-value sign-value--blank"></span></span>
        <span class="sign-item sign-item--wide">
          <span class="sign-label">入库操作员</span>
          <span class="sign-value">{{ row.inboundOperator || row.createBy || '' }}</span>
        </span>
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
    printOrientation: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      /** 打印纸张（与业务纸张一致：210mm × 140mm） */
      pagePaperSize: '210mm 140mm',
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
      const pageRows = this.maxRowsPerPage
      if (!details.length) return [[]]
      const result = []
      for (let i = 0; i < details.length; i += pageRows) {
        result.push(details.slice(i, i + pageRows))
      }
      return result
    },
    maxRowsPerPage() {
      // 业务要求：入库单明细固定每页 9 行
      return 9
    },
    effectiveOrientation() {
      const p = this.printOrientation
      if (p === 'landscape' || p === 'portrait') return p
      const o = this.printSetting && this.printSetting.orientation
      if (o === 'landscape' || o === 'portrait') return o
      return 'portrait'
    },
    printStyle() {
      const m = this.printSetting
      const clampNonNegativeMm = (v) => {
        const n = Number(v)
        if (isNaN(n)) return 0
        return Math.max(0, n)
      }
      // 点阵打印机对顶部裁切很敏感：对 marginTop 做上限保护，既避免裁切又避免标题下移过多。
      const safeTopMm = Math.min(2, clampNonNegativeMm(m.marginTop))
      const margin = `${safeTopMm}mm ${clampNonNegativeMm(m.marginRight)}mm ${clampNonNegativeMm(m.marginBottom)}mm ${clampNonNegativeMm(m.marginLeft)}mm`
      return {
        padding: margin,
        fontSize: Math.round(m.fontSize || 14) + 'px',
        // 点阵机更适合等宽字体，减少字符挤压/模糊差异
        fontFamily: '"Courier New", "Consolas", "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif'
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
    this.loadPrintSetting()
  },
  methods: {
    mmValue(v) {
      const n = Number(v)
      return isNaN(n) ? 0 : n
    },
    /** 入库日期格式：yyyyMMddHH:mm:ss，与样张一致 */
    formatInboundDate(val) {
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
    formatAmt(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(4)
    },
    loadPrintSetting() {
      const billType = this.billType || (this.row && this.row.billType) || 101
      getDefaultTemplate(billType).then(response => {
        if (response.data) {
          const data = response.data
          // 打印字体整体放大三号
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
    /** 明细单元格：最多两行；若两行仍装不下，则逐步缩小字号直到装下（或到达下限） */
    applyPrintCellAutoFont() {
      const root = this.$refs.receiptOrderPrintRef || this.$el
      if (!root || typeof document === 'undefined') return

      const cells = root.querySelectorAll('td.cell-textual .cell-text')
      if (!cells || !cells.length) return

      const minPx = 8
      const maxSteps = 40

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
        probe.style.top = '0'
        probe.style.visibility = 'hidden'
        probe.style.height = '0'
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

        // 组件处于 display:none（例如 v-show=false 的直接打印）时，clientWidth 可能为 0：
        // 用纸张宽度（210mm）按列 colgroup 比例估算单元格内容宽度。
        const pagePx = mmToPx(210) || 794
        const tr = td.parentElement
        if (!tr) return Math.max(120, pagePx * 0.2)

        const tds = Array.from(tr.children || []).filter(n => n && n.tagName === 'TD')
        const idx = tds.indexOf(td)
        const ratios = [0.23, 0.15, 0.06, 0.10, 0.15, 0.14, 0.17]
        const r = ratios[idx] != null ? ratios[idx] : (1 / Math.max(1, tds.length))
        return Math.max(80, pagePx * r - padL - padR)
      }

      const measureUnclampedHeightPx = (el, fontPx) => {
        const td = el.closest('td')
        if (!td) return 0

        const cs = window.getComputedStyle(el)

        const mirror = document.createElement('div')
        mirror.textContent = el.textContent || ''

        const innerW = estimateInnerWidthPx(td)

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
        removeMirror(mirror)
        return h
      }

      cells.forEach((el) => {
        if (!el || el.nodeType !== 1) return
        const text = (el.textContent || '').trim()
        if (!text) return

        // 先恢复为表格默认字号，再按需缩小，避免重复打印越缩越小
        el.style.fontSize = ''
        el.style.lineHeight = ''

        const cs0 = window.getComputedStyle(el)
        let fontPx = parseFloat(cs0.fontSize || '12') || 12
        const lineHeightPx = Math.max(10, Math.round(fontPx * 1.35))
        const maxH = lineHeightPx * 2 + 1

        let step = 0
        while (step < maxSteps) {
          const h = measureUnclampedHeightPx(el, fontPx)
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
      const doPrint = () => {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            const el = this.$refs.receiptOrderPrintRef || this.$el
            if (!el) return
            const pageSize = this.pagePaperSize || '210mm 140mm'
            // 让浏览器先完成布局，再测量/调整字号，最后进入打印 iframe
            this.applyPrintCellAutoFont()
            if (typeof this.$print === 'function') {
              this.$print(el, {
                injectPageSize: true,
                // 保持与页面高度一致，避免可打印区被压缩后从一页变两页
                pageMargin: '0',
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
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.print-page
  position relative
  width 210mm
  min-height 140mm
  box-sizing border-box
  display flex
  flex-direction column
  break-inside avoid
  page-break-inside avoid
  page-break-after always
  overflow-x: visible
  overflow-y: visible

.print-page:last-child
  page-break-after auto

.page-meta
  position absolute
  top 2mm
  right 3mm
  z-index 2

.page-index
  font-size 12px
  line-height 1
  letter-spacing 0.5px
  color #333

.doc-title
  font-size 20px
  font-weight normal
  text-align center
  /* 预留右上角页码空间，避免与标题挤在一起 */
  padding-top 8mm
  line-height 1.1
  margin-bottom 6px

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

/* 左列标签（单据号/入库日期）宽度一致，冒号竖线对齐 */
.info-label--l1
  flex-basis 5.6em
  max-width 5.6em

/* 右列标签（供货商/资金来源账户）宽度一致，冒号竖线对齐 */
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

.detail-table th,
.detail-table td
  border 1px solid #000
  padding 4px 6px
  text-align center

.detail-table th
  font-weight normal
  background #f5f5f5

/* 表格列标题不加冒号 */
.detail-table th .th-text
  display inline-flex
  align-items center
  justify-content center
  max-width 100%
  white-space nowrap

.detail-table td
  word-break normal
  overflow hidden

/* 名称、规格、单位、产地：左对齐，最多两行（超出由脚本在打印前自动缩小字号） */
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

/* 数量、采购价、采购金额：内容右对齐 */
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
  size 210mm 140mm
  margin 0

@media print
  html,body
    margin 0 !important
    padding 0 !important

  *
    color #000 !important

  .receipt-print
    width 210mm !important
    max-width 210mm !important
    /* Epson LQ-690K 点阵打印：等宽+固定字号，减少模糊/字形差异 */
    font-size 16px !important
    font-family "Courier New", Consolas, "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-weight normal
    -webkit-font-smoothing none !important
    -moz-osx-font-smoothing none !important
    text-rendering optimizeSpeed
    -webkit-print-color-adjust exact
    print-color-adjust exact

  .print-page
    width 210mm !important
    min-height 140mm !important
    // 避免某些浏览器在打印模式对 max-height 裁切到标题区域
    max-height none !important
    /* 针式机顶部不可打印区更大，标题整体下移 */
    padding-top 6mm !important
    overflow-x: visible
    overflow-y: visible
    break-inside avoid
    page-break-inside avoid
    page-break-after always

  .print-page:last-child
    page-break-after auto

  .doc-title
    display block !important
    /* 标题字号收小，避免在点阵纸高度/行高估算下出现半截或空白 */
    font-size 18px !important
    font-weight normal !important
    /* 标题字形上半部被裁切：增加标题内部安全区并放宽行框 */
    /* 预留右上角页码空间 */
    padding-top 7mm !important
    padding-bottom 1mm !important
    margin-top 0 !important
    margin-bottom 2px !important
    line-height 1.7 !important
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    overflow visible !important
    page-break-inside avoid !important

  /* 下方区域压缩，抵消标题下移导致的分页压力 */
  .info-block
    margin-bottom 3px !important
    font-size 17px !important

  .info-row
    font-size 17px !important

  /* 信息区：标签列固定宽度，冒号竖线对齐（打印字号更大时略加宽） */
  .info-label--l1
    flex-basis 6.0em !important
    max-width 6.0em !important

  .info-label--l2
    flex-basis 10.2em !important
    max-width 10.2em !important

  .detail-table
    margin-bottom 6px !important

  .detail-table th,
  .detail-table td
    padding 4px 6px !important

  .total-row
    margin-bottom 8px !important
    font-size 17px !important

  /* 签字区上移一点，避开针式机底部不可打印区域 */
  .sign-block
    margin-top auto !important
    padding-bottom 3mm !important
    font-size 17px !important
    padding-right 10% !important

  .sign-item
    flex-basis 20% !important

  .sign-item--wide
    flex-basis 46% !important

  .detail-table
    width 100% !important
    table-layout fixed
    border-collapse collapse
    /* 覆盖行内 style：后台配置的字号/字体对点阵机容易触发模糊/裁切 */
    font-family "Courier New", Consolas, "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 14px !important

  .detail-table th,
  .detail-table td
    border 1px solid #000
    overflow hidden
    word-wrap normal
    word-break normal
    line-height 1.45 !important

  .detail-table th
    font-weight normal !important

  .detail-table th
    background transparent !important
    -webkit-print-color-adjust economy
    print-color-adjust economy

  /* 列名统一居中 */
  .detail-table th
    text-align center !important

  /* 表格列标题不加冒号 */
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
</style>
