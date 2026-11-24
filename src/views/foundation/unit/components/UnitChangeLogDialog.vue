<template>
    <div v-if="changeLog.open" class="change-log-drawer-mask" @click.self="closeChangeLog">
      <div class="change-log-drawer-panel" @click.stop>
        <div class="change-log-drawer-header">
          <span class="change-log-drawer-title">单位变更记录 — {{ changeLog.unitName }}</span>
          <i class="el-icon-close change-log-drawer-close" @click="closeChangeLog" />
        </div>
        <div class="change-log-drawer-body">
          <el-table v-loading="changeLog.loading" :data="changeLog.rows" height="100%" size="small" border stripe>
            <el-table-column label="时间" prop="changeTime" width="160" show-overflow-tooltip />
            <el-table-column label="操作人" prop="operatorName" width="120" show-overflow-tooltip />
            <el-table-column label="字段" prop="fieldLabel" width="140" show-overflow-tooltip />
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
  name: 'UnitChangeLogDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Unit')],
  inheritAttrs: false
}
</script>

<style>
.change-log-drawer-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: flex-end;
}
.change-log-drawer-panel {
  width: min(720px, 92%);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 16px rgba(0,0,0,0.12);
}
.change-log-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}
.change-log-drawer-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 12px;
}
.change-log-drawer-close {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}
.change-log-drawer-close:hover { color: #409EFF; }
.change-log-drawer-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 12px 16px;
  box-sizing: border-box;
}
.change-log-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
}
</style>
