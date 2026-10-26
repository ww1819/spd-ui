<template>
      <el-dialog
        title="发票补录"
        :visible.sync="invoiceDialogVisible"
        width="600px"
        :close-on-click-modal="false"
        v-if="!viewMode"
      >
        <el-form ref="invoiceForm" :model="invoiceForm" :rules="invoiceRules" label-width="120px">
          <el-form-item label="单号">
            <el-input v-model="invoiceForm.billNo" :disabled="true" />
          </el-form-item>
          <el-form-item label="发票号" prop="invoiceNumber">
            <el-input v-model="invoiceForm.invoiceNumber" placeholder="发票号" />
          </el-form-item>
          <el-form-item label="发票金额" prop="invoiceAmount">
            <el-input v-model="invoiceForm.invoiceAmount" placeholder="发票金额" type="number" />
          </el-form-item>
          <el-form-item label="发票日期" prop="invoiceTime">
            <el-date-picker
              v-model="invoiceForm.invoiceTime"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="请选择发票日期"
              style="width: 100%;"
            />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button class="spd-btn spd-btn--secondary" @click="invoiceDialogVisible = false">取 消</el-button>
          <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitInvoiceForm">保 存</el-button>
        </div>
      </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'InvoiceEntryInvoiceDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InvoiceEntry')],
  inheritAttrs: false
}
</script>
