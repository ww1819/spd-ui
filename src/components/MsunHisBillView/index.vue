<template>
  <el-dialog
    title="HIS 单据推送记录"
    :visible.sync="innerVisible"
    width="960px"
    append-to-body
    @close="handleClose"
  >
    <div v-loading="loading" class="msun-his-bill-view">
      <p v-if="hint" class="hint">{{ hint }}</p>
      <el-table v-if="rows.length" :data="rows" border size="small" max-height="360">
        <el-table-column label="接口" prop="api_code" width="80" />
        <el-table-column label="状态" prop="push_status" width="72" />
        <el-table-column label="traceId" prop="his_trace_id" min-width="120" show-overflow-tooltip />
        <el-table-column label="失败原因" prop="push_msg" min-width="140" show-overflow-tooltip />
        <el-table-column label="推送时间" prop="insert_time" width="160" show-overflow-tooltip />
        <el-table-column label="报文" width="88" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="showJson('请求', scope.row.request_json)">请求</el-button>
            <el-button type="text" size="small" @click="showJson('响应', scope.row.response_json)">响应</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="暂无推送记录（未审核或尚未推送 HIS）" />
    </div>

    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="720px" append-to-body>
      <pre class="json-pre">{{ jsonViewer.content }}</pre>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { queryMsunBillHis } from '@/api/foundation/msunHisBill'

export default {
  name: 'MsunHisBillView',
  props: {
    visible: { type: Boolean, default: false },
    billId: { type: [String, Number], default: null },
    billType: { type: String, default: null },
    billNo: { type: String, default: null }
  },
  data() {
    return {
      innerVisible: false,
      loading: false,
      rows: [],
      hint: '',
      jsonViewer: { visible: false, title: '', content: '' }
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(v) {
        this.innerVisible = v
        if (v) this.loadData()
      }
    },
    innerVisible(v) {
      if (!v) this.$emit('update:visible', false)
    }
  },
  methods: {
    loadData() {
      if (!this.billId) {
        this.rows = []
        this.hint = '缺少单据 ID'
        return
      }
      this.hint = this.billNo ? `单号：${this.billNo}` : ''
      this.loading = true
      const params = { billId: String(this.billId) }
      if (this.billType) params.billType = this.billType
      queryMsunBillHis(params).then(res => {
        const data = res.data || {}
        this.rows = data.pushLogs || []
      }).catch(() => {
        this.rows = []
      }).finally(() => {
        this.loading = false
      })
    },
    showJson(title, raw) {
      let content = raw || ''
      try {
        content = JSON.stringify(JSON.parse(raw), null, 2)
      } catch (e) { /* keep raw */ }
      this.jsonViewer.title = title
      this.jsonViewer.content = content
      this.jsonViewer.visible = true
    },
    handleClose() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.hint {
  margin: 0 0 10px;
  font-size: 13px;
  color: #909399;
}
.json-pre {
  max-height: 480px;
  overflow: auto;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
