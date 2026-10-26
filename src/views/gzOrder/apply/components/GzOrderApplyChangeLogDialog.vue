<template>
    <el-dialog
      title="明细变更记录"
      :visible.sync="entryChangeLogDialog.visible"
      width="1000px"
    >
      <el-table v-loading="entryChangeLogDialog.loading" :data="entryChangeLogDialog.rows" border size="small" max-height="460">
        <el-table-column label="变更时间" min-width="160" align="center">
          <template slot-scope="scope">
            {{ parseTime(scope.row.changeTime, '{y}-{m}-{d} {h}:{i}:{s}') || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="actionType" label="动作" width="90" align="center" />
        <el-table-column prop="entryId" label="明细ID" width="90" align="center" />
        <el-table-column prop="operator" label="操作人" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="beforeJson" label="变更前" min-width="260" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="json-cell">{{ scope.row.beforeJson || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="afterJson" label="变更后" min-width="260" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="json-cell">{{ scope.row.afterJson || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="entryChangeLogDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzOrderApplyChangeLogDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.gzOrderEntryList !== undefined)],
  inheritAttrs: false
}
</script>
