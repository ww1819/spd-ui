<template>
    <el-dialog title="批量低值核销结果" :visible.sync="batchLowResultDialog.visible" width="720px" append-to-body>
      <p class="pc-batch-tip">
        成功 <b>{{ batchLowResultDialog.successCount }}</b> 条，
        失败 <b>{{ batchLowResultDialog.failCount }}</b> 条。
        以下按失败原因汇总（便于补库存/补对照）：
      </p>
      <el-table :data="batchLowResultDialog.failReasonStats" border size="mini" max-height="360">
        <el-table-column type="index" width="50" label="#" />
        <el-table-column prop="count" label="条数" width="80" />
        <el-table-column prop="reason" label="失败原因" min-width="420" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="copyBatchFailReasons">复制汇总</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="batchLowResultDialog.visible = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PatientChargeBatchResultDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PatientCharge')],
  inheritAttrs: false
}
</script>
