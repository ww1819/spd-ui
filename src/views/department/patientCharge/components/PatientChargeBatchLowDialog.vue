<template>
    <el-dialog title="批量低值核销" :visible.sync="batchLowDialog.visible" width="520px" append-to-body>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="mb8"
        title="请选择核销范围。并发下同一条只能被一名用户核销成功，另一人将提示「正在核销或已被他人处理」。"
      />
      <el-radio-group v-model="batchLowDialog.scope" class="pc-batch-scope">
        <el-radio label="SELECTED">已勾选记录（跨页 {{ cachedSelectionCount }} 条）</el-radio>
        <el-radio label="QUERY">当前查询条件下全部待处理低值结果</el-radio>
      </el-radio-group>
      <p class="pc-batch-tip">「全部」将按当前筛选条件分页收集待处理低值明细后再核销，条数多时可能较久。</p>
      <p class="pc-batch-tip">仅核销执行科室不为空的记录；执行科室为空的自动跳过。若范围内存在空执行科室，将询问是否先补全。</p>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="batchLowDialog.visible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="batchLowSubmitting" @click="confirmBatchLowProcess">开始核销</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PatientChargeBatchLowDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PatientChargeHis')],
  inheritAttrs: false
}
</script>
