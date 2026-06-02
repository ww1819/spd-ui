<template>
  <div class="gz-barcode-print-page">
    <div class="gz-barcode-toolbar no-print">
      <el-button type="text" size="small" class="toolbar-back" @click="handleBack">
        <i class="el-icon-back" /> 返回
      </el-button>
      <el-button
        type="primary"
        size="small"
        :disabled="!canPrint"
        @click="handleBrowserPrint"
      >打印</el-button>
    </div>
    <div v-if="loadError" class="gz-barcode-print-error no-print">{{ loadError }}</div>
    <p v-else-if="canPrint" class="gz-barcode-scan-tip no-print">
      上方为实际标签效果；屏幕扫码请用标签下方「放大条码」区域。浏览器缩放保持 <strong>100%</strong>，扫码枪距屏幕 10–20cm。
    </p>
    <div v-loading="loading" class="gz-barcode-print-body">
      <barcode-print
        v-if="barcodeList.length"
        ref="barcodePrintRef"
        :barcode-list="barcodeList"
        :embed-preview="true"
      />
    </div>
  </div>
</template>

<script>
import barcodePrint from '@/views/gzOrder/apply/barcodePrint'

/** 与 apply 页 handlePrintBarcode 写入的 key 一致 */
export const GZ_BARCODE_SESSION_KEY = 'spd_gz_barcode_print'

export default {
  name: 'GzBarcodePrintPage',
  components: { barcodePrint },
  data() {
    return {
      loading: true,
      loadError: '',
      barcodeList: [],
      canPrint: false
    }
  },
  mounted() {
    this.loadFromSession()
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
    loadFromSession() {
      this.loading = true
      this.loadError = ''
      this.barcodeList = []
      this.canPrint = false
      try {
        const raw = sessionStorage.getItem(GZ_BARCODE_SESSION_KEY)
        if (!raw) {
          this.loadError = '未找到条码数据，请从列表重新点击「打印条码」'
          return
        }
        const payload = JSON.parse(raw)
        const list = payload && payload.list
        if (!Array.isArray(list) || list.length === 0) {
          this.loadError = '没有可打印的条码'
          return
        }
        this.barcodeList = list
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.canPrint = true
          })
        })
      } catch (e) {
        this.loadError = '条码数据解析失败，请重试'
      } finally {
        this.loading = false
      }
    },
    handleBrowserPrint() {
      const ref = this.$refs.barcodePrintRef
      if (ref && typeof ref.start === 'function') {
        ref.start()
      }
    }
  },
  beforeDestroy() {
    try {
      sessionStorage.removeItem(GZ_BARCODE_SESSION_KEY)
    } catch (e) {
      // ignore
    }
  }
}
</script>

<style scoped>
.gz-barcode-print-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 16px 24px;
  background: #f5f6f7;
}
.gz-barcode-toolbar {
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
.gz-barcode-print-body {
  background: #fff;
  padding: 12px 12px 0;
  border-radius: 4px;
  overflow: hidden;
}
.gz-barcode-print-error {
  color: #f56c6c;
  margin-bottom: 8px;
}
.gz-barcode-scan-tip {
  margin: 0 0 10px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
  background: #ecf5ff;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}
@media print {
  .no-print {
    display: none !important;
  }
  .gz-barcode-print-page {
    padding: 0;
    background: #fff;
  }
  .gz-barcode-print-body {
    padding: 0;
    overflow: visible;
  }
}
</style>
