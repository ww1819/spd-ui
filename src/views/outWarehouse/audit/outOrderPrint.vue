<template>
  <div
    class="out-order-print receipt-print"
    ref="receiptOrderPrintRef"
    hidden="hidden"
    :style="printStyle"
  >
    <!-- 标题：医院名称 + 物资出库单 -->
    <div class="doc-title">
      <span v-if="hospitalName">{{ hospitalName }}</span>物资出库单
    </div>

    <!-- 基本信息：发往科、单据号、出库日期、资金来源 -->
    <div class="info-block">
      <div class="info-row">
        <span class="info-label">发往科</span>
        <span class="info-value">{{ row.departmentName || '' }}</span>
        <span class="info-label info-gap">单据号</span>
        <span class="info-value">{{ row.billNo || '' }}</span>
        <span class="info-label info-gap">出库日期</span>
        <span class="info-value">{{ formatOutboundDate(row.billDate) }}</span>
        <span class="info-label info-gap">资金来源</span>
        <span class="info-value">{{ row.fundSource || '' }}</span>
      </div>
    </div>

    <!-- 明细表：消耗品名称、规格型号、数量、单位、采购价、采购金额、产地、批号、效期 -->
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
      <thead>
        <tr>
          <th>消耗品名称</th>
          <th>规格型号</th>
          <th>数量</th>
          <th>单位</th>
          <th>采购价</th>
          <th>采购金额</th>
          <th>产地</th>
          <th>批号</th>
          <th>效期</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in (row.detailList || [])" :key="idx">
          <td>{{ item.materialName || '' }}</td>
          <td>{{ item.materialSpeci || '' }}</td>
          <td>{{ formatNum(item.qty) }}</td>
          <td>{{ item.unitName || '' }}</td>
          <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
          <td>{{ formatAmt(item.amt) }}</td>
          <td>{{ item.factoryName || '' }}</td>
          <td>{{ item.batchNumber || '' }}</td>
          <td>{{ formatValidDate(item.endTime || item.periodDate) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-tr">
          <td colspan="2">合计: {{ row.totalAmtConverter || '' }}</td>
          <td></td>
          <td></td>
          <td></td>
          <td class="cell-num">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</td>
          <td colspan="3"></td>
        </tr>
      </tfoot>
    </table>

    <!-- 签字区：领用人、保管、出库操作员 -->
    <div class="sign-block">
      <span class="sign-item">领用人</span>
      <span class="sign-item">保管</span>
      <span class="sign-item">出库操作员 {{ row.outboundOperator || row.createBy || '' }}</span>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'
import { getDefaultTemplate } from '@/api/system/printSetting'

export default {
  mixins: [hospitalNameMixin],
  props: ['row', 'billType'],
  data() {
    return {
      /** 与耗材出库默认模板（bill_type=201）一致：正文略小、表体统一字号 */
      printSetting: {
        orientation: 'portrait',
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
    printStyle() {
      const m = this.printSetting
      const margin = `${m.marginTop || 0}mm ${m.marginRight || 0}mm ${m.marginBottom || 0}mm ${m.marginLeft || 0}mm`
      return {
        padding: margin,
        fontSize: (m.fontSize || 16) + 'px',
        fontFamily: 'SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif'
      }
    },
    tableStyle() {
      const px = this.printSetting.tableFontSize || 11
      return {
        fontSize: px + 'px',
        fontFamily: 'SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif'
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
    start() {
      const doPrint = () => {
        this.$nextTick(() => {
          const el = this.$refs.receiptOrderPrintRef || this.$el
          if (!el) return
          const pageSize = this.printSetting.orientation === 'landscape' ? 'A4 landscape' : 'A4'
          if (typeof this.$print === 'function') {
            this.$print(el, {}, pageSize)
          } else {
            try { window.print() } catch (e) { console.error('打印失败:', e) }
          }
        })
      }
      if (typeof this.ensureHospitalNameLoaded === 'function') {
        this.ensureHospitalNameLoaded().then(doPrint).catch(doPrint)
      } else {
        doPrint()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
$font-song = SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.receipt-print
  line-height 1.35
  max-width 900px
  margin 0 auto
  font-family $font-song

.doc-title
  font-size 15px
  font-weight bold
  text-align center
  margin-bottom 6px
  line-height 1.25

.info-block
  margin-bottom 4px
  font-size 11px

.info-row
  display flex
  align-items center
  flex-wrap wrap
  margin-bottom 2px

.info-label
  min-width 56px
  flex-shrink 0

.info-value
  min-width 88px
  margin-right 10px

.info-gap
  margin-left 10px

.detail-table
  width 100%
  table-layout fixed
  border-collapse collapse
  border 1px solid #000
  margin-bottom 4px
  font-family $font-song

/* 列宽：产地加宽、单位缩窄 */
.detail-table .col-name
  width 14%
.detail-table .col-spec
  width 12%
.detail-table .col-qty
  width 7%
.detail-table .col-unit
  width 4%
.detail-table .col-price
  width 9%
.detail-table .col-amt
  width 9%
.detail-table .col-origin
  width 18%
.detail-table .col-batch
  width 10%
.detail-table .col-exp
  width 10%

.detail-table th,
.detail-table td
  border 1px solid #000
  padding 2px 4px
  vertical-align middle
  /* 表头与表体同字号，由 tableStyle 控制 */
  font-size inherit

.detail-table th
  font-weight bold
  background #f5f5f5

/* 左对齐：名称、规格、产地、批号、效期 */
.detail-table th:nth-child(1),
.detail-table td:nth-child(1),
.detail-table th:nth-child(2),
.detail-table td:nth-child(2),
.detail-table th:nth-child(7),
.detail-table td:nth-child(7),
.detail-table th:nth-child(8),
.detail-table td:nth-child(8),
.detail-table th:nth-child(9),
.detail-table td:nth-child(9)
  text-align left

/* 右对齐：数量、采购价、采购金额 */
.detail-table th:nth-child(3),
.detail-table td:nth-child(3),
.detail-table th:nth-child(5),
.detail-table td:nth-child(5),
.detail-table th:nth-child(6),
.detail-table td:nth-child(6)
  text-align right

/* 单位列缩窄居中 */
.detail-table th:nth-child(4),
.detail-table td:nth-child(4)
  text-align center
  padding 2px 2px
  white-space nowrap

/* 产地：加宽不换行 */
.detail-table th:nth-child(7),
.detail-table td:nth-child(7)
  white-space nowrap

.detail-table td:nth-child(1),
.detail-table td:nth-child(2)
  word-break break-all

.detail-table tfoot .total-tr td
  text-align left

.detail-table tfoot .total-tr td.cell-num
  text-align right

.detail-table tfoot .total-tr td:first-child
  font-weight 500

.sign-block
  display flex
  justify-content space-between
  padding-right 18%
  margin-top 2px
  font-size 11px
  font-family $font-song

.sign-item
  min-width 72px
</style>

<style lang="stylus" media="print">
@page
  size auto
  margin 10mm

@media print
  *
    color #000 !important

  .receipt-print
    width 100% !important
    max-width none
    padding 0
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important

  .doc-title
    font-size 15px !important

  .detail-table
    width 100% !important

  .detail-table th,
  .detail-table td
    border 1px solid #000
    overflow hidden

  .detail-table th:nth-child(7),
  .detail-table td:nth-child(7)
    white-space nowrap !important

  .detail-table th
    background #f5f5f5 !important
    -webkit-print-color-adjust exact
    print-color-adjust exact
</style>
