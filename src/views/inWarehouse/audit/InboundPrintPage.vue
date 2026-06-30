<template>
  <div class="inbound-print-page">
    <div class="inbound-print-toolbar no-print">
      <el-button type="text" size="small" class="toolbar-back" @click="handleBack">
        <i class="el-icon-back" /> 返回
      </el-button>
      <el-button
        type="primary"
        size="small"
        :disabled="!printReady || !canPrint"
        @click="handleBrowserPrint"
      >打印</el-button>
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
    <div v-if="loadError" class="inbound-print-error no-print">{{ loadError }}</div>
    <div v-loading="loading" class="inbound-print-body">
      <order-print
        v-if="printRow"
        :key="`${rowsPerPageForPrint}-${reloadTick}`"
        ref="orderPrintRef"
        :row="printRow"
        :bill-type="printRow.billType"
        :rows-per-page="rowsPerPageForPrint"
        print-orientation="portrait"
      />
    </div>
  </div>
</template>

<script>
import { getInWarehouse, recordInWarehousePrint } from '@/api/warehouse/warehouse'
import { getPrintDocRows, updatePrintDocRows } from '@/api/system/printDocRows'
import { buildInboundPrintRowFromDetail } from '@/views/inWarehouse/audit/inboundPrintRow'
import orderPrint from '@/views/inWarehouse/audit/orderPrint'

export default {
  name: 'InboundPrintPage',
  components: { orderPrint },
  data() {
    return {
      loading: true,
      savingRows: false,
      loadError: '',
      printRow: null,
      formRows: 6,
      rowsPerPageForPrint: 6,
      reloadTick: 0,
      canPrint: false
    }
  },
  computed: {
    printReady() {
      return !!this.printRow && !this.loading
    }
  },
  mounted() {
    this.loadPage()
  },
  methods: {
    /** 回到入库列表：优先用进入本页时带的 from（全路径），否则浏览器历史后退 */
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
        this.loadError = '缺少入库单 id 参数'
        return
      }
      this.loading = true
      this.loadError = ''
      Promise.all([getInWarehouse(id), getPrintDocRows('INBOUND')])
        .then(([whRes, rowsRes]) => {
          const data = whRes && whRes.data
          if (!data) {
            this.loadError = '未获取到入库单数据'
            this.printRow = null
            return
          }
          const rowsPayload = rowsRes && rowsRes.data
          const rpp = this.parseRowsPerPage(rowsPayload)
          this.printRow = buildInboundPrintRowFromDetail(null, data)
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
      updatePrintDocRows({ docKind: 'INBOUND', rowsPerPage: Math.round(n) })
        .then(() => getPrintDocRows('INBOUND'))
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
        recordInWarehousePrint(billId).finally(() => doPrint())
        return
      }
      doPrint()
    }
  }
}
</script>

<style scoped>
.inbound-print-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 16px 24px;
  background: #f5f6f7;
}
.inbound-print-toolbar {
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
.inbound-print-body {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
}
.inbound-print-error {
  color: #f56c6c;
  margin-bottom: 8px;
}
@media print {
  .no-print {
    display: none !important;
  }
  .inbound-print-page {
    padding: 0;
    background: #fff;
  }
  .inbound-print-body {
    padding: 0;
  }
}
</style>
