<template>
    <el-dialog title="单据结果" :visible.sync="resultDialogVisible" width="720px" append-to-body>
      <p>共处理 {{ result.lineCount }} 条明细</p>
      <el-table :data="result.bills || []" border size="small">
        <el-table-column label="供应商" prop="supplierName" min-width="120" />
        <el-table-column label="入库 G-RK" prop="inboundBillNo" min-width="140" />
        <el-table-column label="出库 G-CK" prop="outboundBillNo" min-width="140" />
        <el-table-column label="退货 G-TH" prop="returnGoodsBillNo" min-width="140" />
        <el-table-column label="退库 G-TK" prop="returnDepotBillNo" min-width="140" />
      </el-table>
      <div slot="footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="resultDialogVisible = false">知道了</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzInstantIoResultDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'GzInstantIo')],
  inheritAttrs: false
}
</script>
