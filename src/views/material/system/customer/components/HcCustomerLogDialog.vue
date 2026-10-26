<template>
    <el-dialog title="启停用记录与时间段" :visible.sync="openLog" width="800px" append-to-body>
      <div class="log-dialog-header">{{ logForm.customerName }}</div>
      <el-tabs v-model="activeLogTab">
        <el-tab-pane label="启停用记录" name="statusLog">
          <el-table :data="statusLogList" border size="small" max-height="360">
            <el-table-column label="操作时间" prop="operateTime" width="170"><template slot-scope="scope">{{ parseTime(scope.row.operateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</template></el-table-column>
            <el-table-column label="状态" width="90"><template slot-scope="scope"><el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="small">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作人" prop="operateBy" width="120" />
            <el-table-column label="原因" prop="reason" min-width="200" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="启停用时间段" name="periodLog">
          <el-table :data="periodLogList" border size="small" max-height="360">
            <el-table-column label="类型" width="100"><template slot-scope="scope"><el-tag :type="scope.row.periodType === 'usage' ? 'success' : 'info'" size="small">{{ scope.row.periodType === 'usage' ? '使用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="开始时间" prop="startTime" width="170"><template slot-scope="scope">{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</template></el-table-column>
            <el-table-column label="结束时间" prop="endTime" width="170"><template slot-scope="scope">{{ scope.row.endTime ? parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}:{s}') : '至今' }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer"><el-button class="spd-btn spd-btn--secondary" @click="openLog = false">关 闭</el-button></div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcCustomerLogDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomer')],
  inheritAttrs: false
}
</script>

<style scoped>
.log-dialog-header { margin-bottom: 12px; font-weight: 600; color: #303133; }
</style>
