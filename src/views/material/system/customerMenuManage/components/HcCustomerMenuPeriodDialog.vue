<template>
    <el-dialog title="启停用时间段" :visible.sync="openPeriod" width="720px" append-to-body>
      <div class="log-dialog-header">{{ logForm.menuName }}</div>
      <el-table :data="periodLogList" border size="small" max-height="360">
        <el-table-column label="类型" width="90"><template slot-scope="scope"><el-tag :type="scope.row.periodType === 'usage' ? 'success' : 'info'" size="small">{{ scope.row.periodType === 'usage' ? '使用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="开始时间" width="170"><template slot-scope="scope">{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</template></el-table-column>
        <el-table-column label="结束时间" width="170"><template slot-scope="scope">{{ scope.row.endTime ? parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}:{s}') : '至今' }}</template></el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer"><el-button class="spd-btn spd-btn--secondary" @click="openPeriod = false">关 闭</el-button></div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcCustomerMenuPeriodDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomerMenuManage')],
  inheritAttrs: false
}
</script>

<style scoped>
.log-dialog-header { margin-bottom: 12px; font-weight: 600; color: #303133; }
</style>
