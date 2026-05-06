<template>
  <div class="order-print receipt-print" ref="receiptOrderPrintRef">
    <div
      v-for="(pageRows, pageIndex) in pagedDetailList"
      :key="`print-page-${pageIndex}`"
      class="print-page"
      :style="printStyle"
    >
      <div class="doc-header">
        <div class="doc-header-spacer" aria-hidden="true"></div>
        <div class="doc-title">
          <span v-if="hospitalName">{{ hospitalName }}</span>高值备货验收单
        </div>
        <div class="page-meta">
          <span class="page-index">{{ pageIndex + 1 }}/{{ pagedDetailList.length }}</span>
        </div>
      </div>

      <div class="info-block" :style="tableStyle">
        <div class="info-grid">
          <div class="info-cell">
            <span class="info-label info-label--l1">单据号</span>
            <span class="info-value">{{ row.billNo || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--l1">仓库</span>
            <span class="info-value">{{ row.warehouseName || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--l3">入库日期</span>
            <span class="info-value">{{ formatDate(row.billDate) }}</span>
          </div>
          <div class="info-cell info-cell--span2">
            <span class="info-label info-label--l1">供货商</span>
            <span class="info-value">{{ row.supplierName || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--l3">资金来源账户</span>
            <span class="info-value">{{ row.fundSourceAccount || '' }}</span>
          </div>
        </div>
      </div>

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
            <td class="cell-textual"><span class="cell-text">{{ item.materialName || '' }}</span></td>
            <td class="cell-textual"><span class="cell-text">{{ item.materialSpeci || '' }}</span></td>
            <td class="cell-textual"><span class="cell-text">{{ item.unitName || '' }}</span></td>
            <td>{{ formatNum(item.qty) }}</td>
            <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td>{{ formatAmt(item.amt) }}</td>
            <td class="cell-textual"><span class="cell-text">{{ item.factoryName || '' }}</span></td>
          </tr>
          <tr v-if="pageIndex === pagedDetailList.length - 1" class="print-total-row">
            <td colspan="5" class="total-label-cell">
              <span class="total-label">合计</span><span class="total-value">{{ row.totalAmtConverter || '' }}</span>
            </td>
            <td class="total-amt-cell">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="sign-block" :style="tableStyle">
        <div class="sign-item"><span class="sign-label">采购</span><span class="sign-value sign-value--blank"></span></div>
        <div class="sign-item"><span class="sign-label">保管</span><span class="sign-value sign-value--blank"></span></div>
        <div class="sign-item sign-item--wide">
          <span class="sign-label">入库操作员</span>
          <span class="sign-value">{{ row.inboundOperator || row.createBy || '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'
import { getDefaultTemplate } from '@/api/system/printSetting'

export default {
  name: 'GzAcceptanceOrderPrint',
  mixins: [hospitalNameMixin],
  props: {
    row: { type: Object, required: true },
    billType: [String, Number],
    rowsPerPage: { type: Number, default: 6 },
    printOrientation: { type: String, default: '' }
  },
  data() {
    return {
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
      const n = Number(this.rowsPerPage)
      const size = Number.isFinite(n) && n >= 1 ? Math.min(100, Math.round(n)) : 6
      if (!details.length) return [[]]
      const out = []
      for (let i = 0; i < details.length; i += size) out.push(details.slice(i, i + size))
      return out
    },
    printStyle() {
      const m = this.printSetting
      const top = Math.min(2, Math.max(0, Number(m.marginTop) || 0))
      return {
        padding: `${top}mm ${Math.max(0, Number(m.marginRight) || 0)}mm ${Math.max(0, Number(m.marginBottom) || 0)}mm ${Math.max(0, Number(m.marginLeft) || 0)}mm`,
        fontSize: `${Math.round(m.fontSize || 14)}px`
      }
    },
    tableStyle() {
      return { fontSize: `${Math.round(this.printSetting.tableFontSize || 12)}px` }
    }
  },
  created() {
    const billType = this.billType || (this.row && this.row.billType) || 101
    getDefaultTemplate(billType).then((res) => {
      const d = res && res.data
      if (!d) return
      if (d.fontSize != null) this.printSetting.fontSize = Math.round(Number(d.fontSize)) + 3
      if (d.tableFontSize != null) this.printSetting.tableFontSize = Math.round(Number(d.tableFontSize)) + 3
      if (d.orientation) this.printSetting.orientation = d.orientation
      if (d.marginTop != null) this.printSetting.marginTop = d.marginTop
      if (d.marginBottom != null) this.printSetting.marginBottom = d.marginBottom
      if (d.marginLeft != null) this.printSetting.marginLeft = d.marginLeft
      if (d.marginRight != null) this.printSetting.marginRight = d.marginRight
    }).catch(() => {})
  },
  methods: {
    formatDate(v) {
      if (!v) return ''
      const d = new Date(v)
      if (isNaN(d.getTime())) return v
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    formatNum(v) {
      const n = Number(v)
      return isNaN(n) ? (v || '') : n.toFixed(2)
    },
    formatPrice(v) {
      const n = Number(v)
      return isNaN(n) ? (v || '') : n.toFixed(4)
    },
    formatAmt(v) {
      const n = Number(v)
      return isNaN(n) ? (v || '') : n.toFixed(4)
    },
    start() {
      const doPrint = () => {
        this.$nextTick(() => {
          const el = this.$refs.receiptOrderPrintRef || this.$el
          if (!el) return
          if (typeof this.$print === 'function') {
            this.$print(el, { injectPageSize: true, pageMargin: '0 4mm', waitForAssets: true, beforePrintDelay: 320 }, this.pagePaperSize)
          } else {
            window.print()
          }
        })
      }
      Promise.resolve(this.ensureHospitalNameLoaded ? this.ensureHospitalNameLoaded() : null).then(doPrint).catch(doPrint)
    }
  }
}
</script>

<style scoped>
.receipt-print { line-height: 1.5; width: 210mm; max-width: 210mm; margin: 0 auto; box-sizing: border-box; padding: 0 1ch; font-family: SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif; }
.print-page { position: relative; width: 100%; min-height: 140mm; display: flex; flex-direction: column; page-break-after: always; break-inside: avoid; }
.print-page:last-child { page-break-after: auto; }
.doc-header { display: grid; grid-template-columns: 92px 1fr 92px; align-items: center; margin-bottom: 6px; }
.doc-title { font-size: 20px; text-align: center; line-height: 1.1; }
.page-meta { justify-self: end; }
.page-index { font-size: 12px; color: #333; }
.info-grid { display: grid; grid-template-columns: 1.2fr 0.8fr 1.1fr; column-gap: 18px; row-gap: 2px; }
.info-cell { display: flex; align-items: center; min-width: 0; }
.info-cell--span2 { grid-column: 1 / span 2; }
.info-label::after { content: '：'; }
.detail-table { width: 100%; table-layout: fixed; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10px; }
.detail-table th, .detail-table td { border: 1px solid #000; padding: 4px 6px; text-align: center; }
.detail-table th { font-weight: normal; background: #f5f5f5; }
.detail-table td.cell-textual { text-align: left; white-space: normal; word-break: break-word; vertical-align: top; }
.detail-table td.cell-textual .cell-text { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; line-height: 1.35; }
.detail-table td:nth-child(4), .detail-table td:nth-child(5), .detail-table td:nth-child(6) { text-align: right; }
.total-label-cell { text-align: left; }
.total-amt-cell { text-align: right; white-space: nowrap; }
.sign-block { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 12px; margin-top: 2px; }
.sign-item { display: flex; align-items: center; min-width: 0; }
.sign-label::after { content: '：'; }
.sign-value { margin-left: 6px; }
.sign-value--blank { min-height: 1em; }
</style>

<style media="print">
@page { size: 210mm 140mm !important; margin: 0 4mm !important; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; }
  .receipt-print { width: 100% !important; max-width: none !important; padding: 0 !important; font-size: 16px !important; }
  .print-page { width: 100% !important; min-height: 140mm !important; padding-top: 6mm !important; }
}
</style>
