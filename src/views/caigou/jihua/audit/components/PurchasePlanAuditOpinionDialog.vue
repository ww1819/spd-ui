<template>
<!-- 审核意见对话框 -->
    <el-dialog
      title="审核意见"
      :visible.sync="auditDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="计划单号">
          <el-input v-model="auditForm.planNo" :disabled="true" />
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="auditForm.auditOpinion"
            type="textarea"
            placeholder="审核意见"
            :rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitAudit">确定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PurchasePlanAuditOpinionDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchasePlanAudit')],
  inheritAttrs: false
}
</script>
