<template>
  <div class="inbound-print-page">
    <div class="inbound-print-toolbar no-print">
      <el-button type="text" size="small" class="toolbar-back" @click="handleBack">
        <i class="el-icon-back" /> 返回
      </el-button>
      <el-button
        type="primary"
        size="small"
        :disabled="!printReady"
        @click="handleBrowserPrint"
      >打印</el-button>
    </div>
    <div v-if="loadError" class="inbound-print-error no-print">{{ loadError }}</div>
    <div v-loading="loading" class="inbound-print-body">
      <gz-acceptance-order-print
        v-if="printRow"
        ref="orderPrintRef"
        :row="printRow"
        :bill-type="printRow.billType"
        print-orientation="portrait"
      />
    </div>
  </div>
</template>

<script>
import { getOrder as getGzInOrder } from '@/api/gz/order'
import { getOrder as getGzShipmentOrder } from '@/api/gz/shipment'
import GzAcceptanceOrderPrint from '@/views/gzOrder/audit/GzAcceptanceOrderPrint'
import { buildGzAcceptancePrintRowFromDetail } from '@/views/gzOrder/audit/gzPrintRow'

export default {
  name: 'GzAcceptancePrintPage',
  components: { GzAcceptanceOrderPrint },
  data() {
    return {
      loading: true,
      loadError: '',
      printRow: null
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
    loadPage() {
      const id = this.$route.query.id
      if (!id) {
        this.loading = false
        this.loadError = '缺少高值验收单 id 参数'
        return
      }
      this.loading = true
      this.loadError = ''
      const api = String(this.$route.query.api || 'order')
      const fetchDetail = api === 'shipment' ? getGzShipmentOrder : getGzInOrder
      fetchDetail(id)
        .then((res) => {
          const data = res && res.data
          if (!data) {
            this.loadError = '未获取到高值验收单数据'
            this.printRow = null
            return
          }
          this.printRow = buildGzAcceptancePrintRowFromDetail(data, data)
        })
        .catch(() => {
          this.loadError = '加载失败，请稍后重试'
          this.printRow = null
        })
        .finally(() => {
          this.loading = false
        })
    },
    handleBrowserPrint() {
      if (!this.printReady) return
      const ref = this.$refs.orderPrintRef
      if (ref && typeof ref.start === 'function') {
        ref.start()
      }
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
