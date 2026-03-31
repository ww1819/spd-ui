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
      <div class="print-copy-block__top">
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
            <td>{{ item.unitName || (item.fdUnit && item.fdUnit.unitName) || '' }}</td>
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
      </div>

      <div class="print-copy-block__grow" aria-hidden="true" />

      <div class="print-copy-block__footer">
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
      return '200mm 140mm'
    }
  },
  methods: {
    start() {
      // 确保医院名称已加载完成后再打印
      this.ensureHospitalNameLoaded().then(() => {
        // 等待Vue更新DOM
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.$print(
              this.$refs.receiptRefundGoodsPrintRef,
              { injectPageSize: true, pageMargin: '0', waitForAssets: true, beforePrintDelay: 320 },
              this.pageSizeForPrint
            )
          })
        })
      }).catch(() => {
        // 即使加载失败也继续打印
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.$print(
              this.$refs.receiptRefundGoodsPrintRef,
              { injectPageSize: true, pageMargin: '0', waitForAssets: true, beforePrintDelay: 320 },
              this.pageSizeForPrint
            )
          })
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
  padding 8px
  line-height 1.35
  font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif
  font-size 13px

/* 仅三等分纸固定版心高度；A4 用内容自然高度，避免 min-height+page-break-inside 触发空白第二页 */
.print-copy-block
  box-sizing border-box
  display flex
  flex-direction column
  justify-content flex-start
  align-items stretch
  min-height 0
  height auto

.print-copy-block.is-third-split-copy
  min-height 140mm
  height 140mm
  padding-top 5mm
  padding-bottom 5mm
  overflow hidden
  break-inside avoid
  page-break-inside avoid

.print-copy-block__top
  flex 0 0 auto

.print-copy-block__grow
  flex 1 1 auto
  min-height 4mm

.print-copy-block__footer
  flex 0 0 auto
  width 100%
  box-sizing border-box

.is-a4-print .print-copy-block:not(.is-third-split-copy)
  break-inside auto
  page-break-inside auto

.doc-title
  font-size 15px
  line-height 1.55
  padding-top 2mm
  padding-bottom 1mm
  text-align center
  margin-bottom 2px
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.summary
  display flex
  flex-wrap wrap
  width 96%
  margin 0 auto 2px
  margin-bottom 2px
  line-height 1.25

.summary-item
  width 33.33%
  white-space nowrap

.summary-right
  text-align right

.common-table
  width 96%
  margin-left auto
  margin-right auto
  table-layout fixed
  border-collapse collapse
  border-spacing 0

.common-table .col-name
  width 24%

.common-table .col-unit
  width 6%

.common-table .col-spec
  width 16%

.common-table .col-qty
  width 12%

.common-table .col-price
  width 15%

.common-table .col-amt
  width 15%

.common-table .col-batch
  width 12%

.common-table thead tr:first-child th
  padding-top 1px

.common-table th,
.common-table td
  border 1px solid #000
  padding 3px 5px
  font-size 11px
  white-space nowrap
  overflow hidden
  text-overflow clip

.common-table th
  text-align center
  font-weight normal
  background transparent

/* 批号列值：比表体默认大 1 号 */
.common-table tbody td:nth-child(7)
  font-size 12px

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
  width 96%
  margin 0 auto 6px
  white-space nowrap

.foot
  display flex
  justify-content space-between
  width 96%
  margin 0 auto
  white-space nowrap
  padding-bottom 0

.foot span:nth-child(1)
  flex 1
  text-align left

.foot span:nth-child(2)
  flex 0 0 auto
  text-align center

.foot span:nth-child(3)
  flex 1
  text-align right

@page
  size 200mm 140mm
  margin 0

@media print
  *
    color #000 !important

  .refund-goods-print
    width 100% !important
    /* 针式机左右容易裁切：给内容区留安全边 */
    padding 0 6mm !important
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 13px !important

  .common-table
    width 96% !important
    margin-left auto !important
    margin-right auto !important

  .summary
    width 96% !important
    margin 0 auto 2px !important

  .amount-row
    width 96% !important
    margin 0 auto 6px !important

  .foot
    width 96% !important
    margin-left auto !important
    margin-right auto !important
    margin-top 0 !important
    padding-bottom 0 !important

  .print-copy-block.is-third-split-copy
    padding-top 5mm !important
    padding-bottom 5mm !important
    box-sizing border-box !important

  .doc-title
    font-size 15px !important
    line-height 1.55 !important
    padding-top 2mm !important
    padding-bottom 1mm !important
    margin-top 0 !important
    margin-bottom 2px !important
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important

  .common-table th,
  .common-table td
    border 1px solid #000
    padding 3px 5px !important
    font-size 11px !important
    white-space nowrap !important
    word-break normal !important

  .common-table th
    text-align center !important
    font-weight normal !important
    background transparent !important
    -webkit-print-color-adjust economy
    print-color-adjust economy

  .common-table td:nth-child(1),
  .common-table td:nth-child(2),
  .common-table td:nth-child(3),
  .common-table td:nth-child(7)
    text-align left !important

  .common-table td:nth-child(4),
  .common-table td:nth-child(5),
  .common-table td:nth-child(6)
    text-align right !important

  .common-table tbody td:nth-child(7)
    font-size 12px !important
</style>
