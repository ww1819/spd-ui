<template>
    <el-dialog :title="title" :visible.sync="open" width="720px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="发票号码" prop="invoiceNo">
              <el-input v-model="form.invoiceNo" placeholder="请输入发票号码" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票代码" prop="invoiceCode">
              <el-input v-model="form.invoiceCode" placeholder="请输入发票代码" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开票日期" prop="invoiceDate">
              <el-date-picker v-model="form.invoiceDate" type="date" value-format="yyyy-MM-dd" placeholder="选择开票日期" style="width: 100%" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input v-model="form.amount" placeholder="金额" type="number" :disabled="form.auditStatus === 1" @input="calcTotal" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税额" prop="taxAmount">
              <el-input v-model="form.taxAmount" placeholder="税额" type="number" :disabled="form.auditStatus === 1" @input="calcTotal" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价税合计" prop="totalAmount">
              <el-input v-model="form.totalAmount" placeholder="价税合计" type="number" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="供应商" prop="supplierId">
              <SelectSupplier v-model="form.supplierId" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="购方名称" prop="buyerName">
              <el-input v-model="form.buyerName" placeholder="购方名称" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购方税号" prop="buyerTaxNo">
              <el-input v-model="form.buyerTaxNo" placeholder="购方税号" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销方名称" prop="sellerName">
              <el-input v-model="form.sellerName" placeholder="销方名称" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销方税号" prop="sellerTaxNo">
              <el-input v-model="form.sellerTaxNo" placeholder="销方税号" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="备注" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'

export default {
  name: 'FinanceInvoiceEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'FinanceInvoice')],
  components: { SelectSupplier },
  inheritAttrs: false
}
</script>
