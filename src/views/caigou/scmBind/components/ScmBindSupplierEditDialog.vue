<template>
      <el-dialog
        title="修改平台编码绑定"
        :visible.sync="supplierEditVisible"
        width="520px"
        append-to-body
        destroy-on-close
        @close="resetSupplierEditForm"
      >
        <el-form ref="supplierEditFormRef" :model="supplierEditForm" :rules="supplierEditRules" label-width="130px" size="small">
          <el-form-item label="SPD供应商">
            <span>{{ supplierEditForm.supplierName || '—' }}</span>
            <span style="color: #909399; margin-left: 8px">ID: {{ supplierEditForm.supplierId }}</span>
          </el-form-item>
          <el-form-item label="SPD供应商编码">
            <span>{{ supplierEditForm.supplierCode || '—' }}</span>
          </el-form-item>
          <el-form-item label="平台供应商编码" prop="scmSupplierCode">
            <el-input v-model="supplierEditForm.scmSupplierCode" clearable placeholder="与云平台 supplier_code 一致" maxlength="64" show-word-limit />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="supplierEditForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="选填" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button class="spd-btn spd-btn--secondary" @click="supplierEditVisible = false">取消</el-button>
          <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitSupplierEdit">确定</el-button>
        </div>
      </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'ScmBindSupplierEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'CaigouScmBind')],
  inheritAttrs: false
}
</script>
