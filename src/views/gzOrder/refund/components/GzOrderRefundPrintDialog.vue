<template>
  <div>
    <el-dialog :visible.sync=" modalObj.show " :title=" modalObj.title " :width=" modalObj.width " @close="handlePrintDialogClose">
      <!-- 打印方式选择（包含布局选择） -->
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
        <div style="margin-top: 20px;">
          <el-form-item label="页面方向：">
            <el-radio-group v-model=" modalObj.form.orientation ">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </template>
      <!-- 打印预览 -->
      <template v-else-if=" modalObj.component === 'window-print-preview' ">
        <gz-order-print v-if=" modalObj.form.row && modalObj.form.row.detailList && modalObj.form.row.detailList.length > 0 " :key="`print-${modalObj.form.row.goodsNo || Date.now()}-${modalObj.form.orientation || 'landscape'}-${modalObj.form.row.detailList.length}`" :row=" modalObj.form.row " :orientation=" modalObj.form.orientation || 'landscape' " :printType="'refundStock'" ref="receiptOrderPrintRef"></gz-order-print>
        <div v-else-if=" modalObj.form.row " style="padding: 20px; text-align: center; color: #999;">
          <p>正在加载打印数据...</p>
        </div>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>
    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" :printType="'refundStock'" ref="receiptOrderPrintRefAuto"></gz-order-print>
    </div>
  </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import gzOrderPrint from '@/views/gzOrder/audit/gzOrderPrint'

export default {
  name: 'GzOrderRefundPrintDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'RefundGoods')],
  components: { gzOrderPrint },
  inheritAttrs: false
}
</script>
