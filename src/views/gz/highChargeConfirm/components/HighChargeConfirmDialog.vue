<template>
    <el-dialog title="消耗确认" :visible.sync="confirmDialogVisible" width="480px" append-to-body @close="resetConfirmDialog">
      <p>已选 <strong>{{ selectedRows.length }}</strong> 条明细，合计数量 <strong>{{ selectedTotalQty }}</strong>，合计金额 <strong>{{ selectedTotalAmt }}</strong></p>
      <el-form label-width="100px" size="small">
        <el-form-item label="核销科室">
          <span class="hc-confirm-dept-text">{{ confirmDepartmentName || '--' }}</span>
        </el-form-item>
      </el-form>
      <p class="hc-confirm-tip">按核销单整单确认：同一核销单的其他未确认明细将一并确认。确认后不生成入出库单，待库房在「高值即入即出」审核建单。</p>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="confirmSubmitting" @click="submitConfirm">确认</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HighChargeConfirmDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HighChargeConfirm')],
  inheritAttrs: false
}
</script>
