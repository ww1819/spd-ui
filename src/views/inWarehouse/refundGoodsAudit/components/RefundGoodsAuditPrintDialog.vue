<template>
    <el-dialog
      :visible.sync="modalObj.show"
      :width="modalObj.width"
      custom-class="out-warehouse-print-dialog"
      append-to-body
    >
      <template slot="title">
        <div class="print-dialog-title-row">
          <span class="print-dialog-title-text">{{ modalObj.title }}</span>
          <div v-if="showPrintOrientation" class="print-orientation-in-title">
            <span class="print-orientation-label">打印方向</span>
            <el-radio-group v-model="modalObj.form.printOrientation" size="small">
              <el-radio label="landscape">横向</el-radio>
              <el-radio label="portrait">纵向</el-radio>
            </el-radio-group>
          </div>
        </div>
      </template>
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <!--          <el-radio :label=" 1 ">lodop打印</el-radio>-->
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
        <div style="margin-top: 10px;">
          <span style="margin-right: 10px;">纸张</span>
          <el-radio-group v-model="modalObj.form.paperType" size="small">
            <el-radio label="a4">A4</el-radio>
            <el-radio label="third-split">三等分纸</el-radio>
          </el-radio-group>
        </div>
      </template>
      <template v-if="showPrintContent">
        <refund-goods-order-print
          :row=" modalObj.form.row "
          :print-orientation="modalObj.form.printOrientation || 'portrait'"
          :paper-type="modalObj.form.paperType || 'third-split'"
          ref="receiptRefundGoodsPrintRef"
        ></refund-goods-order-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import refundGoodsOrderPrint from '@/views/inWarehouse/refundGoodsAudit/refundGoodsOrderPrint.vue'

export default {
  name: 'RefundGoodsAuditPrintDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'RefundGoodsAudit')],
  components: { refundGoodsOrderPrint },
  inheritAttrs: false
}
</script>
