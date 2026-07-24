<template>
  <div class="app-container gaopayi-debug">
    <el-card shadow="never">
      <div slot="header" class="clearfix">
        <span>高拍仪调试</span>
        <el-button style="float:right;padding:3px 0" type="text" @click="openCapture">打开拍摄面板</el-button>
      </div>
      <el-alert
        title="说明：请先安装并启动对应厂家本地服务。良田(Eloam)默认连接 ws://127.0.0.1:9000。后续其他外设调试页可挂在「系统设置 / 外设管理」下统一入口。"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />

      <el-form :inline="true" size="small" label-width="70px">
        <el-form-item label="厂家">
          <el-select v-model="vendorCode" placeholder="厂家" style="width:200px" @change="onVendorChange">
            <el-option v-for="v in vendors" :key="v.code" :label="v.name" :value="v.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号">
          <el-select v-model="modelCode" placeholder="型号" style="width:240px">
            <el-option
              v-for="m in modelOptions"
              :key="m.code"
              :label="m.name"
              :value="m.code"
              :disabled="m.disabled || !m.adapter"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="busy" @click="probe">探测连接</el-button>
          <el-button @click="clearLog">清空日志</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="catalogRows" size="mini" border style="margin-bottom: 16px">
        <el-table-column prop="vendorName" label="厂家" width="160" />
        <el-table-column prop="modelName" label="型号" min-width="180" />
        <el-table-column prop="adapter" label="适配器" width="140" />
        <el-table-column prop="wsUrl" label="服务地址" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="mini">
              {{ scope.row.enabled ? '已接入' : '预留' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="log-box">
        <div v-for="(line, i) in logs" :key="i" class="log-line">{{ line }}</div>
        <div v-if="!logs.length" class="log-empty">暂无日志</div>
      </div>

      <div v-if="lastCaptureUrls.length" class="last-capture">
        <div class="last-title">最近拍摄预览（{{ lastCaptureUrls.length }}）</div>
        <div class="last-capture-list">
          <img v-for="(url, i) in lastCaptureUrls" :key="i" :src="url" alt="shot" />
        </div>
      </div>
    </el-card>

    <gaopayi-capture :visible.sync="captureVisible" title="高拍仪调试拍摄" @confirm="onCaptureConfirm" />
  </div>
</template>

<script>
import GaopayiCapture from '@/components/GaopayiCapture'
import {
  GAOPAYI_VENDORS,
  loadLastSelection,
  saveLastSelection,
  createGaopayiAdapter
} from '@/utils/gaopayi'

export default {
  name: 'GaopayiDebug',
  components: { GaopayiCapture },
  data() {
    const last = loadLastSelection()
    return {
      vendors: GAOPAYI_VENDORS,
      vendorCode: last.vendorCode,
      modelCode: last.modelCode,
      busy: false,
      logs: [],
      captureVisible: false,
      lastCaptureUrls: []
    }
  },
  computed: {
    modelOptions() {
      const v = this.vendors.find(x => x.code === this.vendorCode)
      return v ? v.models : []
    },
    catalogRows() {
      const rows = []
      this.vendors.forEach(v => {
        (v.models || []).forEach(m => {
          rows.push({
            vendorName: v.name,
            modelName: m.name,
            adapter: m.adapter || '-',
            wsUrl: m.wsUrl || '-',
            enabled: !!(m.adapter && !m.disabled)
          })
        })
      })
      return rows
    }
  },
  methods: {
    log(msg) {
      const t = new Date().toTimeString().slice(0, 8)
      this.logs.unshift(t + ' ' + msg)
    },
    clearLog() {
      this.logs = []
    },
    onVendorChange() {
      const models = this.modelOptions.filter(m => m.adapter && !m.disabled)
      this.modelCode = models.length ? models[0].code : ''
    },
    async probe() {
      this.busy = true
      let adapter = null
      try {
        this.log('开始探测: ' + this.vendorCode + ' / ' + this.modelCode)
        adapter = createGaopayiAdapter(this.vendorCode, this.modelCode)
        await adapter.connect()
        this.log('WebSocket 已连接')
        await adapter.initDevs()
        this.log('InitDevs 完成')
        const count = await adapter.getDeviceCount()
        this.log('设备数量: ' + count)
        if (count > 0) {
          const res = await adapter.getResolution(0)
          this.log('分辨率: ' + (res.join(', ') || '(空)'))
        }
        saveLastSelection(this.vendorCode, this.modelCode)
        this.$modal.msgSuccess('探测成功')
      } catch (e) {
        this.log('失败: ' + ((e && e.message) || e))
        this.$modal.msgError((e && e.message) || '探测失败')
      } finally {
        if (adapter) {
          try { await adapter.dispose() } catch (e) { /* ignore */ }
        }
        this.busy = false
      }
    },
    openCapture() {
      saveLastSelection(this.vendorCode, this.modelCode)
      this.captureVisible = true
    },
    onCaptureConfirm(payload) {
      const items = (payload && payload.items) || []
      this.lastCaptureUrls = items.map(i => i.dataUrl).filter(Boolean)
      if (!this.lastCaptureUrls.length && payload && payload.dataUrl) {
        this.lastCaptureUrls = [payload.dataUrl]
      }
      this.log('拍摄确认: 厂家=' + payload.vendorCode + ' 型号=' + payload.modelCode + ' 张数=' + this.lastCaptureUrls.length)
      this.$modal.msgSuccess('已获取 ' + this.lastCaptureUrls.length + ' 张')
    }
  }
}
</script>

<style scoped>
.log-box {
  background: #1e1e1e;
  color: #d4d4d4;
  min-height: 180px;
  max-height: 320px;
  overflow: auto;
  padding: 10px 12px;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  border-radius: 4px;
}
.log-line {
  line-height: 1.6;
  white-space: pre-wrap;
}
.log-empty {
  color: #888;
}
.last-capture {
  margin-top: 16px;
}
.last-title {
  margin-bottom: 8px;
  color: #606266;
  font-size: 13px;
}
.last-capture-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.last-capture-list img {
  max-width: 160px;
  max-height: 120px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
</style>
