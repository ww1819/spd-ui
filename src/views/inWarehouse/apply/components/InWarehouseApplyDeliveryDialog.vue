<template>
    <el-dialog title="选择配送单" :visible.sync="deliveryMatchDialog.visible" width="900px" append-to-body>
      <el-table
        v-loading="deliveryMatchDialog.loading"
        :data="deliveryMatchDialog.list"
        border
        stripe
        max-height="420"
        @row-dblclick="handleDeliveryRowDblClick"
      >
        <el-table-column label="配送单号" prop="deliveryNo" min-width="220" />
        <el-table-column label="订单号" prop="orderNo" min-width="180" />
        <el-table-column label="供应商" prop="supplierName" min-width="180" />
        <el-table-column label="医院" prop="hospitalName" min-width="180" />
        <el-table-column label="状态" prop="deliveryStatus" width="110" />
        <el-table-column label="创建时间" prop="createTime" min-width="170" />
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" :disabled="deliveryRefBlocked" :title="deliveryRefBlockTitle" @click="handlePickDelivery(scope.row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template slot="footer">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="deliveryMatchDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'InWarehouseApplyDeliveryDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.deliveryMatchDialog !== undefined)],
  inheritAttrs: false
}
</script>
