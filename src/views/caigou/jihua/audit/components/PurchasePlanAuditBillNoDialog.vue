<template>
    <!-- 引用申购单号列表弹窗 -->
    <el-dialog title="引用申购单号" :visible.sync="applyBillNoDialogVisible" width="500px" append-to-body>
      <el-table :data="applyBillNoList" border max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="申购单号" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="applyBillNoDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PurchasePlanAuditBillNoDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchasePlanAudit')],
  inheritAttrs: false
}
</script>
