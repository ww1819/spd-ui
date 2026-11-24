<template>
  <div class="entry-change-log-drawer-mask" @click.self="entryChangeLogDialog.visible = false">
    <div class="entry-change-log-drawer-panel" @click.stop>
      <div class="entry-change-log-drawer-header">
        <span class="entry-change-log-drawer-title">明细变更记录</span>
        <i class="el-icon-close entry-change-log-drawer-close" @click="entryChangeLogDialog.visible = false" />
      </div>
      <div class="entry-change-log-drawer-body">
        <el-table
          v-loading="entryChangeLogDialog.loading"
          :data="entryChangeLogDialog.list"
          border
          stripe
          height="100%"
          size="small"
        >
          <el-table-column label="变更时间" prop="changeTime" width="170" />
          <el-table-column label="操作人" prop="operatorName" width="120" show-overflow-tooltip />
          <el-table-column label="动作" prop="actionType" width="80" align="center" />
          <el-table-column label="变更前" min-width="200">
            <template slot-scope="scope">
              <span>{{ jsonPreview(scope.row.beforeJson) }}</span>
              <el-button type="text" size="mini" @click="showJsonDetail('变更前 JSON', scope.row.beforeJson)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column label="变更后" min-width="200">
            <template slot-scope="scope">
              <span>{{ jsonPreview(scope.row.afterJson) }}</span>
              <el-button type="text" size="mini" @click="showJsonDetail('变更后 JSON', scope.row.afterJson)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="entry-change-log-drawer-footer">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="entryChangeLogDialog.visible = false">关 闭</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'InWarehouseApplyChangeLogDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.deliveryMatchDialog !== undefined)],
  inheritAttrs: false
}
</script>
