<template>
  <div class="order-print receipt-print" ref="receiptOrderPrintRef">
    <div
      v-for="(pageRows, pageIndex) in pagedDetailList"
      :key="`print-page-${pageIndex}`"
      class="print-page"
      :style="printStyle"
    >
      <!-- 标题：医院名称 + 物资入库单 -->
      <div class="doc-title">
        <span v-if="hospitalName">{{ hospitalName }}</span>物资入库单
      </div>

      <!-- 基本信息区：单据号、供货商、入库日期、资金来源账户 -->
      <div class="info-block" :style="tableStyle">
        <div class="info-row">
          <span class="info-label">单据号</span>
          <span class="info-value">{{ row.billNo || '' }}</span>
          <span class="info-label info-gap">供货商</span>
          <span class="info-value info-value-wide">{{ row.supplierName || '' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">入库日期</span>
          <span class="info-value">{{ formatInboundDate(row.billDate) }}</span>
          <span class="info-label info-gap">资金来源账户</span>
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
            <th>消耗品名称</th>
            <th>规格</th>
            <th>单位</th>
            <th>数量</th>
            <th>采购价</th>
            <th>采购金额</th>
            <th>产地</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in pageRows" :key="`${pageIndex}-${idx}`">
            <td>{{ item.materialName || '' }}</td>
            <td>{{ item.materialSpeci || '' }}</td>
            <td>{{ item.unitName || '' }}</td>
            <td>{{ formatNum(item.qty) }}</td>
            <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td>{{ formatAmt(item.amt) }}</td>
            <td>{{ item.factoryName || '' }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 合计：左侧“合计: 贰仟柒佰元”，右侧数字与采购金额列对齐 -->
      <div class="total-row" :style="tableStyle">
        <span class="total-left">合计: {{ row.totalAmtConverter || '' }}</span>
        <span class="total-num">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</span>
      </div>

      <!-- 签字区：采购、保管、入库操作员 -->
      <div class="sign-block" :style="tableStyle">
        <span class="sign-item">采购</span>
        <span class="sign-item">保管</span>
        <span class="sign-item">入库操作员 {{ row.inboundOperator || row.createBy || '' }}</span>
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
      // 纸张：宽 200mm，高 140mm（纵向按高计算）；保留安全余量，避免不同浏览器实际打印误差
      const paperHeightMm = 140
      const reserveMm = 5
      const fixedMm =
        this.mmValue(this.printSetting.marginTop) +
        this.mmValue(this.printSetting.marginBottom) +
        11 + // 标题区域（含上方补偿/加大字号）
        16 + // 基本信息区域
        8 + // 表头行
        8 + // 合计区域
        8 + // 签字区域
        3 // 结构间距
      const baseRowHeightMm = 6.5
      const tableFont = this.printSetting.tableFontSize || 11
      const rowHeightMm = baseRowHeightMm * (tableFont / 11)
      const available = paperHeightMm - reserveMm - fixedMm
      return Math.max(1, Math.floor(available / rowHeightMm))
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
      const margin = `${clampNonNegativeMm(m.marginTop)}mm ${clampNonNegativeMm(m.marginRight)}mm ${clampNonNegativeMm(m.marginBottom)}mm ${clampNonNegativeMm(m.marginLeft)}mm`
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
          // “整体字号加大一号”：在后台配置基础上 +1
          if (data.fontSize != null) this.printSetting.fontSize = Math.round(Number(data.fontSize)) + 1
          if (data.tableFontSize != null) this.printSetting.tableFontSize = Math.round(Number(data.tableFontSize)) + 1
          if (data.orientation) this.printSetting.orientation = data.orientation
          if (data.marginTop != null) this.printSetting.marginTop = data.marginTop
          if (data.marginBottom != null) this.printSetting.marginBottom = data.marginBottom
          if (data.marginLeft != null) this.printSetting.marginLeft = data.marginLeft
          if (data.marginRight != null) this.printSetting.marginRight = data.marginRight
        }
      }).catch(() => {})
    },
    start() {
      const doPrint = () => {
        this.$nextTick(() => {
          const el = this.$refs.receiptOrderPrintRef || this.$el
          if (!el) return
          const pageSize = '200mm 140mm'
          if (typeof this.$print === 'function') {
            // 显式注入 @page size，避免浏览器因“适配页面”导致整体缩放而文字模糊
            this.$print(el, { injectPageSize: true }, pageSize)
          } else {
            try {
              window.print()
            } catch (e) {
              console.error('打印失败:', e)
            }
          }
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
  width 200mm
  max-width 200mm
  margin 0 auto
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.print-page
  width 200mm
  min-height 140mm
  box-sizing border-box
  break-inside avoid
  page-break-inside avoid
  page-break-after always
  overflow-x: visible
  overflow-y: visible

.print-page:last-child
  page-break-after auto

.doc-title
  font-size 20px
  font-weight normal
  text-align center
  padding-top 3mm
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
  min-width 90px
  flex-shrink 0

.info-value
  min-width 140px
  margin-right 24px

.info-value-wide
  flex 1
  min-width 200px

.info-gap
  margin-left 24px

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

.detail-table td
  word-break normal
  overflow hidden

/* 名称、规格、单位、产地：内容左对齐且不换行 */
.detail-table td:nth-child(1),
.detail-table td:nth-child(2),
.detail-table td:nth-child(3),
.detail-table td:nth-child(7)
  text-align left
  white-space nowrap
  text-overflow clip

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

.total-num
  min-width 80px
  text-align right

.sign-block
  display flex
  justify-content space-between
  padding-right 20%

.sign-item
  min-width 80px
</style>

<style lang="stylus" media="print">
@page
  size 200mm 140mm
  margin 0

@media print
  *
    color #000 !important

  .receipt-print
    width 200mm !important
    max-width 200mm !important
    font-size 15px
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-weight normal
    -webkit-font-smoothing antialiased
    -moz-osx-font-smoothing grayscale
    text-rendering optimizeLegibility
    -webkit-print-color-adjust exact
    print-color-adjust exact

  .print-page
    width 200mm !important
    min-height 140mm !important
    max-height 140mm !important
    overflow-x: visible
    overflow-y: visible
    break-inside avoid
    page-break-inside avoid
    page-break-after always

  .print-page:last-child
    page-break-after auto

  .doc-title
    font-size 20px
    font-weight normal !important
    padding-top 3mm
    line-height 1.1

  .detail-table
    width 100% !important
    table-layout fixed
    border-collapse collapse

  .detail-table th,
  .detail-table td
    border 1px solid #000
    overflow hidden
    word-wrap normal
    word-break normal

  .detail-table th
    font-weight normal !important

  .detail-table th
    background #f5f5f5 !important
    -webkit-print-color-adjust exact
    print-color-adjust exact

  /* 列名统一居中 */
  .detail-table th
    text-align center !important

  .detail-table td:nth-child(1),
  .detail-table td:nth-child(2),
  .detail-table td:nth-child(3),
  .detail-table td:nth-child(7)
    text-align left !important
    white-space nowrap !important

  .detail-table td:nth-child(4),
  .detail-table td:nth-child(5),
  .detail-table td:nth-child(6)
    text-align right !important
</style>
