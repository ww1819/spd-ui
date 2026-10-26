<template>
    <el-dialog title="供应商结算单详情" :visible.sync="detailOpen" width="900px" append-to-body>
      <el-descriptions :column="2" border size="small" v-if="detailRow">
        <el-descriptions-item label="单号">{{ detailRow.billNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailRow.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="制单人">{{ detailRow.createBy }}</el-descriptions-item>
        <el-descriptions-item label="制单时间">{{ detailRow.createTime ? parseTime(detailRow.createTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ detailRow.auditStatus === 1 ? '已审核' : '待审核' }}</el-descriptions-item>
        <el-descriptions-item label="审核人">{{ detailRow.auditBy }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ detailRow.auditTime ? parseTime(detailRow.auditTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 12px;"><strong>明细</strong></div>
      <el-table :data="detailRow && detailRow.entryList || []" border size="small" max-height="300">
        <el-table-column type="index" label="序号" width="50" align="center" />
        <el-table-column prop="whSettlementBillNo" label="仓库结算单单号" width="150" show-overflow-tooltip />
        <el-table-column prop="materialName" label="产品名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="speci" label="规格" width="90" show-overflow-tooltip />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="unitPrice" label="单价" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.unitPrice != null ? formatPrice(scope.row.unitPrice) : '--' }}</template>
        </el-table-column>
        <el-table-column prop="amt" label="金额" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.amt != null ? this.formatAmount(scope.row.amt) : '--' }}</template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'SuppSettlementDetailDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'SuppSettlement')],
  inheritAttrs: false
}
</script>
