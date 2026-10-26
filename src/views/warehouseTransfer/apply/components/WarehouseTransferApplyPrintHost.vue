<template>
    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <transfer-order-print v-if="printRowData" :row="printRowData" ref="receiptOrderPrintRefAuto"></transfer-order-print>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import TransferOrderPrint from '@/views/warehouseTransfer/audit/transferOrderPrint'

export default {
  name: 'WarehouseTransferApplyPrintHost',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'WarehouseTransferApply')],
  components: { TransferOrderPrint },
  inheritAttrs: false
}
</script>
