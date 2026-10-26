<template>
    <el-dialog
      :title="outboundRefFilterEntryId != null ? '本行关联出库单据与明细' : '关联出库单据与明细'"
      :visible.sync="outboundRefDialogVisible"
      width="1120px"
      append-to-body
      @closed="outboundRefFilterEntryId = null"
    >
      <el-table :data="filteredOutboundRefList" border size="small" max-height="420" empty-text="暂无关联出库记录">
        <el-table-column label="申领明细" align="center" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ outboundRefEntryLabel(scope.row.basApplyEntryId) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" align="center" min-width="120" prop="materialName" show-overflow-tooltip />
        <el-table-column label="库房申请单号" align="center" width="140" prop="whApplyBillNo" show-overflow-tooltip />
        <el-table-column label="出库单号" align="center" width="140" prop="ckBillNo" show-overflow-tooltip />
        <el-table-column label="出库状态" align="center" width="100">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.biz_status" :value="scope.row.ckBillStatus" />
          </template>
        </el-table-column>
        <el-table-column label="关联数量" align="right" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtQty(scope.row.refQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库明细数量" align="right" width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtQty(scope.row.ckEntryQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库单ID" align="center" width="100" prop="ckBillId" show-overflow-tooltip />
        <el-table-column label="出库明细ID" align="center" width="100" prop="ckEntryId" show-overflow-tooltip />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="outboundRefDialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DApplyOutboundRefDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApply')],
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
