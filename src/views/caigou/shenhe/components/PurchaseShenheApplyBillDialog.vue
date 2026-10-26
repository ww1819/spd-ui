<template>
    <el-dialog title="查看申购单" :visible.sync="applyBillNoDialogVisible" width="95%" append-to-body>
      <el-table :data="applyBillHeaderList" border max-height="450">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="科室申购单号" prop="applyBillNo" min-width="140" show-overflow-tooltip />
        <el-table-column label="仓库" prop="warehouseName" min-width="120" show-overflow-tooltip />
        <el-table-column label="制单人" prop="createByName" width="100" show-overflow-tooltip />
        <el-table-column label="制单时间" prop="createTime" width="160" show-overflow-tooltip />
        <el-table-column label="提交人" prop="submitByName" width="100" show-overflow-tooltip />
        <el-table-column label="提交时间" prop="submitTime" width="160" show-overflow-tooltip />
        <el-table-column label="审核人" prop="auditByName" width="100" show-overflow-tooltip />
        <el-table-column label="审核时间" prop="auditTime" width="160" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="applyBillNoDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PurchaseShenheApplyBillDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchaseOrderAudit' && vm.$el && vm.$el.classList && vm.$el.classList.contains('purchase-order-audit-page'))],
  inheritAttrs: false
}
</script>
