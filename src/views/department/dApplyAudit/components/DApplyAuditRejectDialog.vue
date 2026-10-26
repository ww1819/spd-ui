<template>
    <el-dialog
      title="驳回原因"
      :visible.sync="rejectDialogVisible"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="驳回原因">
          <el-input
            v-model="rejectDialogReason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="rejectDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRejectDialog">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DApplyAuditRejectDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApplyAudit')],
  inheritAttrs: false
}
</script>
