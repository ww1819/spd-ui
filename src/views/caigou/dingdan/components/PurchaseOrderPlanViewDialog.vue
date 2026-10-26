<template>
    <el-dialog title="采购计划" :visible.sync="planViewDialogVisible" width="560px" append-to-body>
      <el-descriptions v-if="planViewData" :column="2" border size="small">
        <el-descriptions-item label="计划单号">{{ planViewData.planNo || '--' }}</el-descriptions-item>
        <el-descriptions-item label="计划状态">
          <dict-tag v-if="planViewData.planStatus" :options="dict.type.plan_status" :value="planViewData.planStatus"/>
          <span v-else>--</span>
        </el-descriptions-item>
        <el-descriptions-item label="计划日期">{{ planViewData.planDate | parseTime('{y}-{m}-{d}') || '--' }}</el-descriptions-item>
        <el-descriptions-item label="总金额">{{ planViewData.totalAmount != null ? formatPrice4(planViewData.totalAmount) : '--' }}</el-descriptions-item>
        <el-descriptions-item label="仓库" :span="2">{{ planViewData.warehouse && planViewData.warehouse.name ? planViewData.warehouse.name : '--' }}</el-descriptions-item>
      </el-descriptions>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="openJihuaPage">前往采购计划</el-button>
        <el-button size="small" @click="planViewDialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PurchaseOrderPlanViewDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchaseOrder')],
  dicts: ['plan_status'],
  inheritAttrs: false
}
</script>
