<template>
  <div class="refund-depot-order-print print-root-offscreen" ref="receiptRefundDepotOrderPrintRef" :class="rootOrientationClass">
    <div
      v-for="(detailPage, pageIndex) in detailPages"
      :key="`page-${pageIndex}`"
      class="print-copy-block"
      :class="{ 'is-third-split-copy': isThirdSplitPaper, 'print-page-break': pageIndex < detailPages.length - 1 }"
    >
      <div class="print-copy-block__top">
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
            <tr v-for="(item, idx) in detailPage" :key="`${pageIndex}-${idx}`">
              <td>{{ item.materialName || '' }}</td>
              <td>{{ item.materialSpeci || '' }}</td>
              <td>{{ item.batchNumber || '' }}</td>
              <td class="num-cell">{{ formatQty(item.qty) }}</td>
              <td class="num-cell">{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
              <td class="num-cell">{{ formatAmt(item.amt) }}</td>
            </tr>
            <tr v-if="pageIndex === detailPages.length - 1" class="total-row">
              <td colspan="3" class="total-label">合计:</td>
              <td class="num-cell">{{ formatQty(row.totalQty) }}</td>
              <td></td>
              <td class="num-cell">{{ formatAmt(row.totalAmt) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="pageIndex === detailPages.length - 1" class="amount-line">
          <span>合计金额（大写）: {{ row.totalAmtConverter || '' }}</span>
          <span>（小写）: {{ formatAmt(row.totalAmt) }}</span>
        </div>
      </div>

      <div class="print-copy-block__grow" aria-hidden="true" />

      <div class="print-copy-block__footer">
        <div class="sign-block">
          <span>退库操作员</span>
          <span>退款人员</span>
          <span>打印日期 {{ formatDateOnly(row.printDate || new Date()) }}</span>
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
        // 等待Vue更新DOM并让浏览器完成一次布局后再触发打印
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.$print(
              this.$refs.receiptRefundDepotOrderPrintRef,
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
              this.$refs.receiptRefundDepotOrderPrintRef,
              { injectPageSize: true, pageMargin: '0', waitForAssets: true, beforePrintDelay: 320 },
              this.pageSizeForPrint
            )
          })
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
    padding 0 7mm !important
    font-family "Courier New", Consolas, SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 16px !important

  /* 表头信息（科室/仓库/单据号/日期等）+3号 */
  .summary-item
    font-size 17px !important
    line-height 1.6 !important

  .doc-title
    font-size 20px !important
    line-height 1.7 !important
    margin-top 5mm !important

  /* 列名、明细数据行较原设置缩小 1 号；表格内「合计」行保持原字号 */
  .common-table thead th
    font-size 18px !important
    line-height 1.55 !important

  .common-table tbody tr:not(.total-row) td
    font-size 16px !important
    line-height 1.55 !important

  .common-table tbody tr:not(.total-row) td:nth-child(4),
  .common-table tbody tr:not(.total-row) td:nth-child(5),
  .common-table tbody tr:not(.total-row) td:nth-child(6)
    font-size 14px !important

  .common-table tbody tr:not(.total-row) td:nth-child(1),
  .common-table tbody tr:not(.total-row) td:nth-child(2),
  .common-table tbody tr:not(.total-row) td:nth-child(3)
    font-size 15px !important

  /* 合计信息（含大写/小写）+ 表格内合计行 */
  .amount-line,
  .common-table .total-row td
    font-size 17px !important
    line-height 1.6 !important

  .common-table th
    background transparent !important
    font-weight normal !important
    -webkit-print-color-adjust economy
    print-color-adjust economy

  /* 整张纸上下各 5mm 安全区；签字行贴内底，避免被裁切 */
  .print-copy-block
    padding-top 5mm !important
    padding-bottom 5mm !important
    box-sizing border-box !important

  .sign-block
    margin-bottom 0 !important
    padding-bottom 0 !important

.refund-depot-order-print
  padding 6px 6mm 0
  line-height 1.45
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif
  font-size 14px
  break-inside avoid
  page-break-inside avoid

.print-copy-block
  min-height 140mm
  height 140mm
  padding-top 5mm
  padding-bottom 5mm
  box-sizing border-box
  display flex
  flex-direction column
  justify-content flex-start
  align-items stretch
  break-inside avoid
  page-break-inside avoid

.print-copy-block__top
  flex 0 0 auto

/* 中间占位：把签字区顶到纸张底部；合计大写/小写已在表格下方 */
.print-copy-block__grow
  flex 1 1 auto
  min-height 4mm

/* 仅签字区；距底边由 print-copy-block padding-bottom 5mm 控制 */
.print-copy-block__footer
  flex 0 0 auto
  width 100%
  box-sizing border-box

.print-copy-block.is-third-split-copy
  height 140mm
  overflow hidden

  .print-page-break
    break-after page !important
    page-break-after always !important

.doc-title
  text-align center
  font-size 18px
  line-height 1.65
  padding-top 2mm
  padding-bottom 2mm
  margin-top 0
  margin-bottom 4px
  font-weight normal
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.summary
  display flex
  flex-wrap wrap
  margin-bottom 8px

.summary-item
  box-sizing border-box
  font-size 14px
  line-height 1.55
  padding 2px 0
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
  width 94%
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
  padding 5px 6px
  font-size 17px
  line-height 1.6

.common-table thead th
  font-size 16px
  line-height 1.55

.common-table tbody tr:not(.total-row) td
  font-size 16px
  line-height 1.55

.common-table tbody tr:not(.total-row) td:nth-child(4),
.common-table tbody tr:not(.total-row) td:nth-child(5),
.common-table tbody tr:not(.total-row) td:nth-child(6)
  font-size 14px

.common-table tbody tr:not(.total-row) td:nth-child(1),
.common-table tbody tr:not(.total-row) td:nth-child(2),
.common-table tbody tr:not(.total-row) td:nth-child(3)
  font-size 15px

.common-table th
  text-align center
  font-weight normal

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
  margin-top 8px
  margin-bottom 0
  font-size 14px
  line-height 1.55
  width 94%
  margin-left auto
  margin-right auto

.sign-block
  display flex
  justify-content space-between
  align-items flex-start
  font-size 14px
  line-height 1.55
  width 94%
  margin-left auto
  margin-right auto
  margin-top 0
  padding-bottom 0

.sign-block span
  flex 1 1 0
  min-width 0
  padding 0 4px
  box-sizing border-box

.sign-block span:nth-child(1)
  text-align left

.sign-block span:nth-child(2)
  text-align center

.sign-block span:nth-child(3)
  text-align right
</style>
