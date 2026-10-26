<template>
      <el-dialog
        title="修改平台医院编码"
        :visible.sync="tenantEditVisible"
        width="520px"
        append-to-body
        destroy-on-close
        @close="resetTenantEditForm"
      >
        <el-form ref="tenantEditFormRef" :model="tenantEditForm" :rules="tenantEditRules" label-width="130px" size="small">
          <el-form-item label="平台医院编码" prop="scmHospitalCode">
            <el-input
              v-model="tenantEditForm.scmHospitalCode"
              clearable
              placeholder="与云平台 hospital_code 一致"
              maxlength="64"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="tenantEditForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="选填" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button class="spd-btn spd-btn--secondary" @click="tenantEditVisible = false">取消</el-button>
          <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitTenantEdit">保存</el-button>
        </div>
      </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'ScmBindTenantEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'CaigouScmBind')],
  inheritAttrs: false
}
</script>
