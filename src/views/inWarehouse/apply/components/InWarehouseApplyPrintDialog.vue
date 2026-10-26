<template>
    <!-- 打印对话框 -->
    <el-dialog :visible.sync="modalObj.show" :title="modalObj.title" :width="modalObj.width" @close="handlePrintDialogClose">
      <template v-if="modalObj.component === 'print-type'">
        <el-radio-group v-model="modalObj.form.value">
          <el-radio :label="2">浏览器打印</el-radio>
        </el-radio-group>
      </template>
      <template v-if="modalObj.form.value === 2 || modalObj.component === 'window-print-preview'">
        <order-print v-if="modalObj.form.row" :row="modalObj.form.row" ref="receiptOrderPrintRef"></order-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="handlePrintDialogClose">取消</el-button>
        <el-button size="small" class="spd-btn spd-btn--primary" type="primary" @click="modalObj.ok">确认</el-button>
      </template>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import orderPrint from '@/views/inWarehouse/audit/orderPrint'

export default {
  name: 'InWarehouseApplyPrintDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.deliveryMatchDialog !== undefined)],
  components: { orderPrint },
  inheritAttrs: false
}
</script>
