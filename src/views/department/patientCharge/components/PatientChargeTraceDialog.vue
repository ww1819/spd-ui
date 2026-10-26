<template>
    <el-dialog :title="fetchTraceDialog.title" :visible.sync="fetchTraceDialog.visible" width="920px" append-to-body>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="mb8"
        :title="fetchTraceDialog.hint"
      />
      <el-table
        v-loading="fetchTraceDialog.loading"
        :data="fetchTraceDialog.rows"
        border
        size="small"
        max-height="420"
        empty-text="暂无相关抓取记录"
      >
        <el-table-column label="抓取时间" prop="createTime" width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatDateTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" prop="chargeKind" width="72" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.chargeKind === 'OUTPATIENT' ? '门诊' : '住院' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="查询条件" prop="queryCondition" min-width="280" show-overflow-tooltip />
        <el-table-column label="新增" prop="insertedCount" width="70" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.insertedCount != null ? scope.row.insertedCount : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="跳过" prop="skippedCount" width="70" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.skippedCount != null ? scope.row.skippedCount : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="需核对" prop="driftCount" width="80" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.driftCount != null ? scope.row.driftCount : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="本条结果" width="110" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.downloadSuccess" type="success" size="mini">本条下载成功</el-tag>
            <span v-else>--</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="fetchTraceDialog.visible = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PatientChargeTraceDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PatientChargeHis')],
  inheritAttrs: false
}
</script>
