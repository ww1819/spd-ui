<template>
    <el-dialog :visible.sync=" modalObj.show " :title=" modalObj.title " :width=" modalObj.width ">
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
<!--          <el-radio :label=" 1 ">lodop打印</el-radio>-->
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
      </template>
      <template v-if=" modalObj.form.value === 2 || modalObj.component === 'window-print-preview' ">
        <order-print :row=" modalObj.form.row " ref="receiptOrderPrintRef"></order-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import orderPrint from "@/views/settlement/audit/orderPrint"

export default {
  name: 'SettlementAuditPrintDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'SettlementAudit')],
  components: { orderPrint },
  inheritAttrs: false
}
</script>
