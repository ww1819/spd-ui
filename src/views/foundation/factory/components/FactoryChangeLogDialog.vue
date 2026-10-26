<template>
    <div v-if="changeLog.open" class="change-log-drawer-mask" @click.self="closeChangeLog">
      <div class="change-log-drawer-panel" @click.stop>
        <div class="change-log-drawer-header">
          <span class="change-log-drawer-title">生产厂家变更记录 — {{ changeLog.factoryName }}</span>
          <i class="el-icon-close change-log-drawer-close" @click="closeChangeLog" />
        </div>
        <div class="change-log-drawer-body">
          <el-table v-loading="changeLog.loading" :data="changeLog.rows" height="100%" size="small" border stripe>
            <el-table-column label="时间" prop="changeTime" width="160" show-overflow-tooltip />
            <el-table-column label="操作人" prop="operator" width="100" show-overflow-tooltip />
            <el-table-column label="字段" prop="fieldLabel" width="100" show-overflow-tooltip />
            <el-table-column label="原值" prop="oldValue" min-width="120" show-overflow-tooltip />
            <el-table-column label="新值" prop="newValue" min-width="120" show-overflow-tooltip />
          </el-table>
        </div>
        <div class="change-log-drawer-footer">
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="closeChangeLog">关 闭</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'FactoryChangeLogDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Factory')],
  inheritAttrs: false
}
</script>
