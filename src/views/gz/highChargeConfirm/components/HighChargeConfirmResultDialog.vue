<template>
    <el-dialog title="确认结果" :visible.sync="resultDialogVisible" width="480px" append-to-body>
      <p>确认批次：<strong>{{ result.confirmNo }}</strong>，共 {{ result.lineCount }} 条明细。</p>
      <p>已确认，待库房即入即出审核。</p>
      <div slot="footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="resultDialogVisible = false">知道了</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HighChargeConfirmResultDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HighChargeConfirm')],
  inheritAttrs: false
}
</script>
