<template>
  <div
    class="refund-goods-print"
    :class="{ 'is-a4-print': isA4Paper, 'is-third-split-print': isThirdSplitPaper }"
    ref="receiptRefundGoodsPrintRef"
  >
    <div
      v-for="copyIndex in renderCopies"
      :key="copyIndex"
      class="print-copy-block"
      :class="{ 'is-third-split-copy': isThirdSplitPaper }"
    >
      <div class="doc-title">
        <span v-if="hospitalName">{{ hospitalName }}</span>采购退货单
      </div>
      <div class="summary">
        <div class="summary-item">单号: {{ row.billNo || '' }}</div>
        <div class="summary-item">仓库: {{ row.warehouseName || '' }}</div>
        <div class="summary-item">供应商: {{ row.supplierName || '' }}</div>
        <div class="summary-item">申请时间: {{ row.billDate || '' }}</div>
        <div class="summary-item">审核时间: {{ row.auditDate || '' }}</div>
        <div class="summary-item summary-right">单位: 元</div>
      </div>
      <table class="common-table">
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
            <th>名称</th>
            <th>单位</th>
            <th>规格</th>
            <th>数量</th>
            <th>退货价</th>
            <th>退货金额</th>
            <th>批号</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in (row.detailList || [])" :key="idx">
            <td>{{ item.materialName || '' }}</td>
            <td>{{ item.unitName || '' }}</td>
            <td>{{ item.materialSpeci || '' }}</td>
            <td class="num-cell">{{ formatQty(item.qty) }}</td>
            <td class="num-cell">{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td class="num-cell">{{ formatPrice(item.amt) }}</td>
            <td>{{ item.batchNumber || '' }}</td>
          </tr>
          <tr class="subtotal-row">
            <td class="left-cell">合计:</td>
            <td></td>
            <td></td>
            <td class="num-cell">{{ formatQty(row.totalQty) }}</td>
            <td></td>
            <td class="num-cell">{{ formatPrice(row.totalAmt) }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="amount-row">
        <span>合计金额（大写）: {{ row.totalAmtConverter || '' }}</span>
        <span>（小写）: {{ formatPrice(row.totalAmt) }}</span>
      </div>
      <div class="foot">
        <span>操作员</span>
        <span>合计:</span>
        <span>{{ formatPrice(row.totalAmt) }}</span>
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
      if (this.isA4Paper) {
        return this.effectiveOrientation === 'portrait' ? '210mm 297mm' : '297mm 210mm'
      }
      // 纸张：宽 210mm，高 140mm
      return this.effectiveOrientation === 'portrait' ? '140mm 210mm' : '210mm 140mm'
    }
  },
  methods: {
    start() {
      // 确保医院名称已加载完成后再打印
      this.ensureHospitalNameLoaded().then(() => {
        // 等待Vue更新DOM
        this.$nextTick(() => {
          this.$print(this.$refs.receiptRefundGoodsPrintRef, { injectPageSize: true }, this.pageSizeForPrint)
        })
      }).catch(() => {
        // 即使加载失败也继续打印
        this.$nextTick(() => {
          this.$print(this.$refs.receiptRefundGoodsPrintRef, { injectPageSize: true }, this.pageSizeForPrint)
        })
      })
    },
    formatQty(value) {
      if (value === null || value === undefined || value === '') {
        return ''
      }
      const num = parseFloat(value)
      if (isNaN(num)) {
        return ''
      }
      return num.toFixed(2)
    },
    formatPrice(value) {
      if (value === null || value === undefined || value === '') {
        return ''
      }
      const num = parseFloat(value)
      if (isNaN(num)) {
        return ''
      }
      return num.toFixed(4)
    }
  }
}
</script>


<style lang="stylus" media="print">
.refund-goods-print
  padding 6px 6px
  line-height 1.25
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif
  font-size 11px

/* 仅三等分纸固定版心高度；A4 用内容自然高度，避免 min-height+page-break-inside 触发空白第二页 */
.print-copy-block
  box-sizing border-box
  display flex
  flex-direction column
  justify-content flex-start
  min-height 0
  height auto

.print-copy-block.is-third-split-copy
  min-height 140mm
  height 140mm
  overflow hidden
  break-inside avoid
  page-break-inside avoid

.is-a4-print .print-copy-block:not(.is-third-split-copy)
  break-inside auto
  page-break-inside auto

.doc-title
  font-size 18px
  line-height 1.2
  text-align center
  margin-bottom 2px

.summary
  display flex
  flex-wrap wrap
  margin-bottom 2px
  line-height 1.25

.summary-item
  width 33.33%
  white-space nowrap

.summary-right
  text-align right

.common-table
  width 100%
  table-layout fixed
  border-collapse collapse
  border-spacing 0

.common-table .col-name
  width 22%

.common-table .col-unit
  width 6%

.common-table .col-spec
  width 15%

.common-table .col-qty
  width 12%

.common-table .col-price
  width 15%

.common-table .col-amt
  width 15%

.common-table .col-batch
  width 15%

.common-table thead tr:first-child th
  padding-top 1px

.common-table th,
.common-table td
  border 1px solid #000
  padding 1px 2px
  font-size 11px
  white-space nowrap
  overflow hidden

.common-table th
  text-align center
  font-weight normal

.common-table td:nth-child(1),
.common-table td:nth-child(2),
.common-table td:nth-child(3),
.common-table td:nth-child(7)
  text-align left

.num-cell
  text-align right

.left-cell
  text-align left

.amount-row
  display flex
  justify-content space-between
  margin-top 2px
  white-space nowrap

.foot
  display flex
  justify-content space-between
  margin-top 6px
  white-space nowrap

@page
  size auto
  margin 0

@media print
  *
    color #000 !important

  .refund-goods-print
    width 210mm !important
    max-width 210mm !important
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important

  .common-table th,
  .common-table td
    border 1px solid #000
    white-space nowrap !important
    word-break normal !important

  .common-table th
    text-align center !important

  .common-table td:nth-child(1),
  .common-table td:nth-child(2),
  .common-table td:nth-child(3),
  .common-table td:nth-child(7)
    text-align left !important

  .common-table td:nth-child(4),
  .common-table td:nth-child(5),
  .common-table td:nth-child(6)
    text-align right !important
</style>
