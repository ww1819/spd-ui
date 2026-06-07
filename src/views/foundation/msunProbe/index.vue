<template>
  <div v-if="visible" class="app-container msun-probe-page">
    <el-alert
      title="众阳 HIS 接口联调：浏览器 → SPD 后端 → scminterface 前置机（无跨域）"
      type="info"
      :closable="false"
      show-icon
      class="mb16"
    />
    <el-row :gutter="12" class="mb16">
      <el-col :span="6">
        <el-button type="primary" :loading="envLoading" @click="loadEnv">查看当前环境</el-button>
      </el-col>
    </el-row>
    <el-card v-if="envInfo" class="mb16" shadow="never">
      <pre class="env-pre">{{ envInfo }}</pre>
    </el-card>

    <el-row :gutter="16">
      <el-col v-for="api in apiList" :key="api.key" :span="12" class="mb16">
        <el-card shadow="hover">
          <div slot="header" class="api-card-head">
            <span>{{ api.title }}</span>
            <el-button type="primary" size="mini" @click="openInvoke(api)">调用</el-button>
          </div>
          <p class="api-hint">{{ api.hint }}</p>
        </el-card>
      </el-col>
    </el-row>

    <msun-his-param-dialog
      :visible.sync="dialogVisible"
      :title="currentApi ? currentApi.title : '调用'"
      :description="currentApi ? currentApi.hint : ''"
      :fields="dialogFields"
      :loading="invokeLoading"
      @confirm="submitInvoke"
    />

    <el-dialog title="调用结果" :visible.sync="resultVisible" width="70%" append-to-body>
      <pre class="result-pre">{{ resultText }}</pre>
      <div slot="footer">
        <el-button type="primary" @click="copyResult">复制 JSON</el-button>
        <el-button @click="resultVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
  <div v-else class="app-container">
    <el-empty description="当前租户未接入众阳 HIS" />
  </div>
</template>

<script>
import { getMsunHisEnv, invokeMsunHisProbe } from '@/api/foundation/msunHisProbe'
import { isMsunIntegratedTenant } from '@/utils/msunHis'
import { MSUN_PROBE_API_LIST } from '@/utils/msunHisProbeApi'
import MsunHisParamDialog from '@/components/MsunHisParamDialog'

export default {
  name: 'MsunHisProbe',
  components: { MsunHisParamDialog },
  data() {
    return {
      apiList: MSUN_PROBE_API_LIST,
      envLoading: false,
      envInfo: '',
      dialogVisible: false,
      currentApi: null,
      invokeLoading: false,
      resultVisible: false,
      resultText: ''
    }
  },
  computed: {
    visible() {
      return isMsunIntegratedTenant(this.$store.getters.customerId)
    },
    dialogFields() {
      return this.currentApi && this.currentApi.fields ? this.currentApi.fields : []
    }
  },
  methods: {
    loadEnv() {
      this.envLoading = true
      getMsunHisEnv().then(res => {
        this.envInfo = JSON.stringify(res.data || res, null, 2)
      }).finally(() => { this.envLoading = false })
    },
    openInvoke(api) {
      this.currentApi = api
      if (!api.fields || !api.fields.length) {
        this.submitInvoke({})
        return
      }
      this.dialogVisible = true
    },
    submitInvoke(params) {
      if (!this.currentApi) return
      this.invokeLoading = true
      invokeMsunHisProbe(this.currentApi.key, params).then(res => {
        this.resultText = JSON.stringify(res, null, 2)
        this.resultVisible = true
        this.dialogVisible = false
        this.$modal.msgSuccess((res && res.msg) || '调用完成')
      }).finally(() => { this.invokeLoading = false })
    },
    copyResult() {
      if (!this.resultText) return
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this.resultText)
        this.$modal.msgSuccess('已复制')
      }
    }
  }
}
</script>

<style scoped>
.mb16 { margin-bottom: 16px; }
.api-card-head { display: flex; justify-content: space-between; align-items: center; }
.api-hint { margin: 0; font-size: 12px; color: #909399; }
.env-pre, .result-pre {
  max-height: 420px;
  overflow: auto;
  background: #f5f7fa;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}
</style>
