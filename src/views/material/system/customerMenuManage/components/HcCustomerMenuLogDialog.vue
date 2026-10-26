<template>
    <el-dialog title="启停用记录" :visible.sync="openLog" width="720px" append-to-body>
      <div class="log-dialog-header">{{ logForm.menuName }}</div>
      <el-table :data="statusLogList" border size="small" max-height="360">
        <el-table-column label="操作时间" width="170"><template slot-scope="scope">{{ parseTime(scope.row.operateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</template></el-table-column>
        <el-table-column label="状态" width="90"><template slot-scope="scope"><el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="small">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="操作人" prop="operateBy" width="120" />
        <el-table-column label="原因" prop="reason" min-width="200" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer"><el-button class="spd-btn spd-btn--secondary" @click="openLog = false">关 闭</el-button></div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcCustomerMenuLogDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomerMenuManage')],
  inheritAttrs: false
}
</script>

<style scoped>
.log-dialog-header { margin-bottom: 12px; font-weight: 600; color: #303133; }
</style>
