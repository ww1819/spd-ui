<template>
    <el-dialog :visible.sync="invoiceEntryOpen" title="发票补录" width="600px" :close-on-click-modal="false">
      <el-form ref="invoiceForm" :model="invoiceForm" :rules="invoiceRules" label-width="120px">
        <el-form-item label="结算单号">
          <el-input v-model="invoiceForm.billNo" :disabled="true" />
        </el-form-item>
        <el-form-item label="发票号" prop="invoiceNumber">
          <el-input v-model="invoiceForm.invoiceNumber" placeholder="发票号" />
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
        <el-form-item label="供应链平台上传">
          <el-select v-model="invoiceForm.isPlatformUploaded" placeholder="请选择" style="width: 100%;">
            <el-option label="是" value="1" />
            <el-option label="否" value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="cancelInvoiceEntry">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitInvoiceEntry">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'SettlementAuditInvoiceDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'SettlementAudit')],
  inheritAttrs: false
}
</script>
