<template>
  <div class="refund-depot-order-print print-root-offscreen" ref="receiptRefundDepotOrderPrintRef" :class="rootOrientationClass">
    <div
      v-for="copyIndex in renderCopies"
      :key="copyIndex"
      class="print-copy-block"
      :class="{ 'is-third-split-copy': isThirdSplitPaper }"
    >
      <div class="doc-title">{{ displayHospitalName }}科室退库单</div>

      <div class="summary">
        <div class="summary-item summary-left">科室: {{ row.departmentName || '' }}</div>
        <div class="summary-item summary-center">单据号: {{ row.billNo || '' }}</div>
        <div class="summary-item summary-right">退库日期: {{ formatDateTime(row.auditDate || row.billDate) }}</div>
        <div class="summary-item summary-left">仓库: {{ row.warehouseName || '' }}</div>
        <div class="summary-item summary-center">申请时间: {{ formatDateTime(row.billDate) }}</div>
        <div class="summary-item summary-right">单位: 元</div>
      </div>

      <table class="common-table">
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
            <th>消耗品名称</th>
            <th>规格型号</th>
            <th>批号</th>
            <th>数量</th>
            <th>退库单价</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in (row.detailList || [])" :key="idx">
            <td>{{ item.materialName || '' }}</td>
            <td>{{ item.materialSpeci || '' }}</td>
            <td>{{ item.batchNumber || '' }}</td>
            <td class="num-cell">{{ formatQty(item.qty) }}</td>
            <td class="num-cell">{{ formatPrice(item.price) }}</td>
            <td class="num-cell">{{ formatAmt(item.amt) }}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" class="total-label">合计:</td>
            <td class="num-cell">{{ formatQty(row.totalQty) }}</td>
            <td></td>
            <td class="num-cell">{{ formatAmt(row.totalAmt) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="amount-line">
        <span>合计金额（大写）: {{ row.totalAmtConverter || '' }}</span>
        <span>（小写）: {{ formatAmt(row.totalAmt) }}</span>
      </div>

      <div class="sign-block">
        <span>退库操作员</span>
        <span>退款人员</span>
        <span>打印日期 {{ formatDateOnly(row.printDate || new Date()) }}</span>
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
    // 默认样式按衡水市第三人民医院版式渲染
    displayHospitalName() {
      return this.hospitalName || '衡水市第三人民医院'
    },
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
    renderCopies() {
      return 1
    },
    pageSizeForPrint() {
      return '200mm 140mm'
    }
  },
  methods: {
    formatDateTime(v) {
      if (!v) return ''
      const d = new Date(v)
      if (isNaN(d.getTime())) return v
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${y}${m}${day}${h}:${mm}`
    },
    formatDateOnly(v) {
      if (!v) return ''
      const d = new Date(v)
      if (isNaN(d.getTime())) return v
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
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
    start() {
      // 确保医院名称已加载完成后再打印
      this.ensureHospitalNameLoaded().then(() => {
        // 等待Vue更新DOM
        this.$nextTick(() => {
          this.$print(this.$refs.receiptRefundDepotOrderPrintRef, { injectPageSize: true }, this.pageSizeForPrint)
        })
      }).catch(() => {
        // 即使加载失败也继续打印
        this.$nextTick(() => {
          this.$print(this.$refs.receiptRefundDepotOrderPrintRef, { injectPageSize: true }, this.pageSizeForPrint)
        })
      })
    }
  }
}
</script>


<style lang="stylus" media="print">
@page
  size 200mm 140mm
  margin 0

@media print
  *
    color #000 !important

  .refund-depot-order-print
    width 200mm !important
    max-width 200mm !important
    /* 针式机左右容易裁切：给内容区留安全边 */
    padding 0 6mm !important
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 13px !important

  .common-table th
    background transparent !important
    font-weight normal !important
    -webkit-print-color-adjust economy
    print-color-adjust economy

.refund-depot-order-print
  padding 5px 6px
  line-height 1.25
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif
  font-size 11px
  break-inside avoid
  page-break-inside avoid

.print-copy-block
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

.doc-title
  text-align center
  font-size 15px
  line-height 1.55
  padding-top 2mm
  padding-bottom 1mm
  margin-top 0
  margin-bottom 2px
  font-weight normal
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.summary
  display flex
  flex-wrap wrap
  margin-bottom 6px

.summary-item
  box-sizing border-box
  font-size 11px
  padding 1px 0
  white-space nowrap
  overflow hidden
  text-overflow clip

.summary-left
  width 34%

.summary-center
  width 31%

.summary-right
  width 35%
  text-align right

.common-table
  width 96%
  margin-left auto
  margin-right auto
  table-layout fixed
  border-collapse collapse
  border-spacing 0

.common-table .col-name
  width 26%

.common-table .col-spec
  width 18%

.common-table .col-batch
  width 14%

.common-table .col-qty
  width 12%

.common-table .col-price
  width 14%

.common-table .col-amt
  width 16%

.common-table th,
.common-table td
  border 1px solid #000
  padding 3px 5px
  font-size 11px

.common-table th
  text-align center
  font-weight bold

.common-table td:nth-child(1),
.common-table td:nth-child(2),
.common-table td:nth-child(3)
  text-align left
  white-space nowrap
  overflow hidden
  text-overflow clip

.num-cell
  text-align right

.total-row td
  font-weight normal

.total-label
  text-align left

.amount-line
  display flex
  justify-content space-between
  margin-top 4px
  font-size 11px

.sign-block
  display flex
  justify-content space-between
  margin-top auto
  font-size 11px
</style>
