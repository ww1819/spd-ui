<template>
  <div
    class="out-order-print receipt-print print-root-offscreen"
    ref="receiptOrderPrintRef"
    :class="rootOrientationClass"
    :style="printStyle"
  >
    <div
      v-for="copyIndex in renderCopies"
      :key="copyIndex"
      class="print-copy-block"
      :class="{ 'is-third-split-copy': isThirdSplitPaper }"
    >
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
          <tr class="print-doc-header">
            <td colspan="9" class="header-cell">
              <div class="doc-title">
                <span v-if="hospitalName">{{ hospitalName }}</span>物资出库单
              </div>
              <div class="info-row">
                <span class="info-label">发往科</span>
                <span class="info-value">{{ row.departmentName || '' }}</span>
                <span class="info-label info-gap">单据号</span>
                <span class="info-value">{{ row.billNo || '' }}</span>
                <span class="info-label info-gap">出库日期（审核）</span>
                <span class="info-value">{{ formatOutboundDate(row.auditDate || row.billDate) }}</span>
                <span class="info-label info-gap">资金来源</span>
                <span class="info-value">{{ row.fundSource || '' }}</span>
              </div>
            </td>
          </tr>
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
            <td>{{ formatSpecModel(item) }}</td>
            <td>{{ formatNum(item.qty) }}</td>
            <td>{{ item.unitName || '' }}</td>
            <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td>{{ formatAmt(item.amt) }}</td>
            <td>{{ item.factoryName || '' }}</td>
            <td>{{ item.batchNumber || '' }}</td>
            <td>{{ formatValidDate(item.endTime || item.periodDate) }}</td>
          </tr>
          <!-- 合计：与表同列网，采购价左/采购金额右竖线延伸至本行底横线；金额在采购价、采购金额列下方 -->
          <tr class="print-total-row">
            <td colspan="4" class="total-label-cell">合计: {{ row.totalAmtConverter || '' }}</td>
            <td class="total-under-price"></td>
            <td class="total-under-amt">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</td>
            <td colspan="3" class="total-tail-cells"></td>
          </tr>
        </tbody>
      </table>

      <div class="print-sign-footer-fixed">
        <div class="sign-block">
          <span class="sign-item">领用人</span>
          <span class="sign-item">保管</span>
          <span class="sign-item">出库操作员 {{ row.outboundOperator || row.createBy || '' }}</span>
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
    renderCopies() {
      return 1
    },
    /** 纸张尺寸：A4 模式整页；三等分模式 99mm 高条带 */
    pageSizeForPrint() {
      if (this.isA4Paper) {
        return this.effectiveOrientation === 'portrait' ? '210mm 297mm' : '297mm 210mm'
      }
      return this.effectiveOrientation === 'portrait' ? '210mm 99mm' : '297mm 99mm'
    },
    printStyle() {
      const m = this.printSetting
      const margin = `${m.marginTop || 0}mm ${m.marginRight || 0}mm ${m.marginBottom || 0}mm ${m.marginLeft || 0}mm`
      const wide = this.effectiveOrientation === 'landscape'
      return {
        padding: margin,
        fontSize: (m.fontSize || 16) + 'px',
        fontFamily: 'SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif',
        width: wide ? '297mm' : '210mm',
        maxWidth: wide ? '297mm' : '210mm'
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
    /** 规格 + 型号（快照或档案合并后展示） */
    formatSpecModel(item) {
      if (!item) return ''
      const a = (item.materialSpeci || '').trim()
      const b = (item.materialModel || '').trim()
      if (!a && !b) return ''
      return [a, b].filter(Boolean).join(' ')
    },
    /**
     * 触发浏览器打印。三等分纸高度约 99mm（A4 纵向 297mm 的 1/3）。
     */
    start() {
      if (typeof this.ensureHospitalNameLoaded === 'function') {
        this.ensureHospitalNameLoaded().catch(() => {})
      }
      const doPrint = () => {
        this.$nextTick(() => {
          this.$nextTick(() => {
            const el = this.$refs.receiptOrderPrintRef || this.$el
            if (!el) {
              console.warn('[outOrderPrint] 打印节点未就绪')
              return
            }
            const pageSize = this.pageSizeForPrint
            try {
              if (typeof this.$print === 'function') {
                this.$print(el, { injectPageSize: false }, pageSize)
              } else {
                window.print()
              }
            } catch (e) {
              console.error('[outOrderPrint] 打印失败:', e)
            }
          })
        })
      }
      doPrint()
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
  break-inside avoid
  page-break-inside avoid

.print-copy-block
  min-height 99mm
  box-sizing border-box
  display flex
  flex-direction column
  justify-content space-between
  break-inside avoid
  page-break-inside avoid

.print-copy-block.is-third-split-copy
  height 99mm
  overflow hidden

.doc-title
  font-size 15px
  font-weight bold
  text-align center
  margin-bottom 6px
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
  margin-bottom 2px
  font-size 11px

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
  margin-bottom 0
  font-family $font-song

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
  font-size inherit

.detail-table thead tr.print-doc-header td
  border none

.detail-table thead tr:not(.print-doc-header) th
  border-top 1px solid #000

.detail-table th
  font-weight bold
  background #f5f5f5
  text-align center

.detail-table tbody td:nth-child(1),
.detail-table tbody td:nth-child(2),
.detail-table tbody td:nth-child(7),
.detail-table tbody td:nth-child(8),
.detail-table tbody td:nth-child(9)
  text-align left

.detail-table tbody td:nth-child(3),
.detail-table tbody td:nth-child(5),
.detail-table tbody td:nth-child(6)
  text-align right

.detail-table tbody td:nth-child(4)
  text-align center
  padding 2px 2px
  white-space nowrap

.detail-table tbody td:nth-child(7)
  white-space nowrap

.detail-table tbody td:nth-child(1),
.detail-table tbody td:nth-child(2)
  word-break break-all

/* 合计行：与采购价(第5列)、采购金额(第6列)同列竖线，底边为合计横线 */
.detail-table tbody tr.print-total-row td
  border 1px solid #000
  padding 4px 4px 6px
  font-size 11px
  vertical-align middle

.detail-table tbody tr.print-total-row td.total-label-cell
  text-align left
  font-weight normal

.detail-table tbody tr.print-total-row td.total-under-price
  text-align right

.detail-table tbody tr.print-total-row td.total-under-amt
  text-align right
  font-weight normal

.sign-block
  display flex
  justify-content space-between
  padding-right 12%
  font-size 11px
  font-family $font-song

.sign-item
  min-width 72px

/* 屏上不占用视口；打印时在复制块内展示 */
.print-sign-footer-fixed
  display none
</style>

<style lang="stylus" media="print">
/* 不强制纸张 size：允许用户在浏览器里选择 A4；
   组件本身按 99mm 高度排版，A4 下可自然一页容纳 3 条 */
@page
  margin 4mm 6mm

@media print
  *
    color #000 !important

  .print-root-offscreen
    position relative !important
    left auto !important
    top auto !important
    z-index auto !important
    width 100% !important
    padding-bottom 14mm !important

  .receipt-print
    width 100% !important
    max-width none
    padding 0
    min-height auto !important
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important

  .print-copy-block
    min-height 99mm !important
    box-sizing border-box
    padding 0 0 4mm 0

  .print-copy-block.is-third-split-copy
    height 99mm !important
    overflow hidden !important

  .doc-title
    font-size 15px !important

  .detail-table
    width 100% !important

  .detail-table th,
  .detail-table td
    border 1px solid #000
    overflow hidden

  .detail-table thead tr.print-doc-header td
    border none !important

  .detail-table tbody td:nth-child(7)
    white-space nowrap !important

  .detail-table th
    background #f5f5f5 !important
    -webkit-print-color-adjust exact
    print-color-adjust exact

  .detail-table tbody tr.print-total-row td
    border 1px solid #000 !important

  /* 每联底部签字 */
  .print-sign-footer-fixed
    display block !important
    position static
    box-sizing border-box
    padding 2px 0 0
    border-top none
    background transparent
    font-size 11px
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important

  .print-sign-footer-fixed .sign-block
    padding-right 8%
</style>
