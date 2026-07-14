<template>
  <div class="stock-doc-print-page">
    <div class="stock-doc-print-toolbar no-print">
      <el-button type="text" size="small" class="toolbar-back" @click="handleBack">
        <i class="el-icon-back" /> 返回
      </el-button>
      <el-button
        type="primary"
        size="small"
        :disabled="!printReady || !canPrint"
        @click="handleBrowserPrint"
      >打印</el-button>
      <el-button
        v-if="showLodopPrint"
        type="success"
        size="small"
        :disabled="!printReady || !canPrint"
        :loading="lodopPrinting"
        @click="handleLodopPrint"
      >Lodop打印</el-button>
      <span class="toolbar-label">一页打印</span>
      <el-input-number
        v-model="formRows"
        :min="1"
        :max="30"
        :step="1"
        size="small"
        controls-position="right"
        class="toolbar-rows-input"
      />
      <el-button type="default" size="small" :loading="savingRows" @click="handleConfirmRows">确定</el-button>
    </div>
    <div v-if="loadError" class="stock-doc-print-error no-print">{{ loadError }}</div>
    <div v-loading="loading" class="stock-doc-print-body">
      <component
        :is="printComponentName"
        v-if="printRow"
        :key="`${rowsPerPageForPrint}-${reloadTick}`"
        ref="orderPrintRef"
        v-bind="printChildProps"
      />
    </div>
  </div>
</template>

<script>
import { getOutWarehouse, recordOutWarehousePrint } from '@/api/warehouse/outWarehouse'
import { getTkInventory, recordTkInventoryPrint } from '@/api/warehouse/tkInventory'
import { getThInventory, recordThInventoryPrint } from '@/api/warehouse/thInventory'
import { getPrintDocRows, updatePrintDocRows } from '@/api/system/printDocRows'
import { buildOutboundPrintRowFromDetail } from '@/views/warehouse/print/outboundPrintRow'
import { buildRefundDepotPrintRowFromDetail } from '@/views/warehouse/print/refundDepotPrintRow'
import { buildRefundGoodsPrintRowFromDetail } from '@/views/warehouse/print/refundGoodsPrintRow'
import outOrderPrint from '@/views/outWarehouse/audit/outOrderPrint'
import refundDepotOrderPrint from '@/views/outWarehouse/refundDepotAudit/refundDepotOrderPrint'
import refundGoodsOrderPrint from '@/views/inWarehouse/refundGoodsAudit/refundGoodsOrderPrint'
// import { isHsThirdTenant } from '@/utils/msunHis' // Lodop 入口恢复时一并打开

const ROUTE_META = {
  '/print/outbound': {
    docKind: 'OUTBOUND',
    emptyMsg: '未获取到出库单数据',
    fetchDetail: id => getOutWarehouse(id),
    buildRow: buildOutboundPrintRowFromDetail,
    printComponentName: 'outOrderPrint',
    paperType: 'third-split',
    printOrientation: 'portrait'
  },
  '/print/refund-depot': {
    docKind: 'REFUND_DEPOT',
    emptyMsg: '未获取到退库单数据',
    fetchDetail: id => getTkInventory(id),
    buildRow: buildRefundDepotPrintRowFromDetail,
    printComponentName: 'refundDepotOrderPrint',
    paperType: 'third-split',
    printOrientation: 'portrait'
  },
  '/print/refund-goods': {
    docKind: 'REFUND_GOODS',
    emptyMsg: '未获取到退货单数据',
    fetchDetail: id => getThInventory(id),
    buildRow: buildRefundGoodsPrintRowFromDetail,
    printComponentName: 'refundGoodsOrderPrint',
    paperType: 'third-split',
    printOrientation: 'portrait'
  }
}

const RECORD_PRINT_FN = {
  OUTBOUND: recordOutWarehousePrint,
  REFUND_DEPOT: recordTkInventoryPrint,
  REFUND_GOODS: recordThInventoryPrint
}

export default {
  name: 'StockDocPrintPage',
  components: {
    outOrderPrint,
    refundDepotOrderPrint,
    refundGoodsOrderPrint
  },
  data() {
    return {
      loading: true,
      savingRows: false,
      loadError: '',
      printRow: null,
      formRows: 6,
      rowsPerPageForPrint: 6,
      reloadTick: 0,
      canPrint: false,
      lodopPrinting: false
    }
  },
  computed: {
    routeMeta() {
      return ROUTE_META[this.$route.path] || ROUTE_META['/print/outbound']
    },
    docKind() {
      return this.routeMeta.docKind
    },
    printComponentName() {
      return this.routeMeta.printComponentName
    },
    printReady() {
      return !!this.printRow && !this.loading
    },
    /** 衡水三院出库单：Lodop 入口（暂屏蔽，待针式字体方案稳定后再开） */
    showLodopPrint() {
      return false
      // if (this.docKind !== 'OUTBOUND') return false
      // const tenant = this.$store.getters.tenant
      // if (tenant && tenant.tenantKey === 'HS_003') return true
      // return isHsThirdTenant(this.$store.getters.customerId)
    },
    printChildProps() {
      if (!this.printRow) return {}
      const base = {
        row: this.printRow,
        rowsPerPage: this.rowsPerPageForPrint,
        paperType: this.routeMeta.paperType,
        printOrientation: this.routeMeta.printOrientation,
        embedPreview: true
      }
      if (this.docKind === 'OUTBOUND') {
        base.billType = this.printRow.billType
      }
      return base
    }
  },
  mounted() {
    this.loadPage()
  },
  methods: {
    handleBack() {
      const raw = this.$route.query.from
      if (raw != null && String(raw).length) {
        try {
          const path = decodeURIComponent(String(raw))
          if (path.startsWith('/') && !path.startsWith('//')) {
            this.$router.push(path).catch(() => {
              this.$router.replace({ path: '/' })
            })
            return
          }
        } catch (e) {
          // ignore
        }
      }
      this.$router.go(-1)
    },
    parseRowsPerPage(payload) {
      const n = Number(payload && payload.rowsPerPage)
      if (!Number.isFinite(n) || n < 1 || n > 30) return 6
      return Math.round(n)
    },
    loadPage() {
      const id = this.$route.query.id
      if (!id) {
        this.loading = false
        this.loadError = '缺少单据 id 参数'
        return
      }
      const meta = this.routeMeta
      this.loading = true
      this.loadError = ''
      Promise.all([meta.fetchDetail(id), getPrintDocRows(meta.docKind)])
        .then(([detailRes, rowsRes]) => {
          const data = detailRes && detailRes.data
          if (!data) {
            this.loadError = meta.emptyMsg
            this.printRow = null
            return
          }
          const rowsPayload = rowsRes && rowsRes.data
          const rpp = this.parseRowsPerPage(rowsPayload)
          this.printRow = meta.buildRow(null, data)
          this.rowsPerPageForPrint = rpp
          this.formRows = rpp
          this.reloadTick = 0
          this.canPrint = false
          this.$nextTick(() => {
            requestAnimationFrame(() => {
              this.canPrint = true
            })
          })
        })
        .catch(() => {
          this.loadError = '加载失败，请稍后重试'
          this.printRow = null
        })
        .finally(() => {
          this.loading = false
        })
    },
    handleConfirmRows() {
      const n = Number(this.formRows)
      if (!Number.isFinite(n) || n < 1 || n > 30) {
        this.$modal.msgWarning('每页行数需在 1～30 之间')
        return
      }
      this.savingRows = true
      updatePrintDocRows({ docKind: this.docKind, rowsPerPage: Math.round(n) })
        .then(() => getPrintDocRows(this.docKind))
        .then(res => {
          const rpp = this.parseRowsPerPage(res && res.data)
          this.rowsPerPageForPrint = rpp
          this.formRows = rpp
          this.reloadTick += 1
          this.canPrint = false
          this.$nextTick(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                this.canPrint = true
              })
            })
          })
          this.$modal.msgSuccess('已更新每页行数')
        })
        .catch(() => {})
        .finally(() => {
          this.savingRows = false
        })
    },
    handleBrowserPrint() {
      if (!this.printReady || !this.canPrint) return
      const billId = this.$route.query.id
      const doPrint = () => {
        const ref = this.$refs.orderPrintRef
        if (ref && typeof ref.start === 'function') {
          ref.start()
        }
      }
      if (billId) {
        const recordPrint = RECORD_PRINT_FN[this.docKind]
        if (recordPrint) {
          recordPrint(billId).finally(() => doPrint())
          return
        }
      }
      doPrint()
    },
    handleLodopPrint() {
      if (!this.printReady || !this.canPrint || this.lodopPrinting) return
      const billId = this.$route.query.id
      const doLodop = () => {
        const ref = this.$refs.orderPrintRef
        if (!ref || typeof ref.startLodop !== 'function') {
          this.$modal.msgWarning('当前打印模板不支持 Lodop')
          this.lodopPrinting = false
          return Promise.resolve()
        }
        return ref
          .startLodop({ preview: true })
          .catch(err => {
            const msg = (err && err.message) || 'Lodop 打印失败'
            this.$modal.msgError(msg)
          })
          .finally(() => {
            this.lodopPrinting = false
          })
      }
      this.lodopPrinting = true
      if (billId) {
        const recordPrint = RECORD_PRINT_FN[this.docKind]
        if (recordPrint) {
          recordPrint(billId)
            .catch(() => {})
            .finally(() => {
              doLodop()
            })
          return
        }
      }
      doLodop()
    }
  }
}
</script>

<style scoped>
.stock-doc-print-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 16px 24px;
  background: #f5f6f7;
}
.stock-doc-print-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.toolbar-back {
  margin-right: 4px;
  color: #409eff;
  padding-left: 0;
}
.toolbar-label {
  color: #606266;
  font-size: 14px;
}
.toolbar-rows-input {
  width: 120px;
}
.stock-doc-print-body {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
}
.stock-doc-print-error {
  color: #f56c6c;
  margin-bottom: 8px;
}
@media print {
  .no-print {
    display: none !important;
  }
  .stock-doc-print-page {
    padding: 0;
    background: #fff;
  }
  .stock-doc-print-body {
    padding: 0;
  }
}
</style>
