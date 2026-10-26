<template>
    <el-dialog title="库房申请单明细" :visible.sync="viewOpen" width="1200px" append-to-body @closed="viewForm = {}">
      <el-descriptions v-if="viewForm && viewForm.id" :column="2" border size="small" class="mb12">
        <el-descriptions-item label="库房申请单号">{{ viewForm.applyBillNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="科室申领单号">{{ viewForm.basApplyBillNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ (viewForm.warehouse && viewForm.warehouse.name) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="科室">{{ (viewForm.department && viewForm.department.name) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ billStatusText(viewForm.billStatus) }}</el-descriptions-item>
        <el-descriptions-item label="整单作废">{{ viewForm.voidWholeFlag === 1 ? '是' : '否' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="viewEntryList" border max-height="420" size="small">
        <el-table-column label="行号" prop="lineNo" width="60" align="center" />
        <el-table-column label="产品名称" min-width="140" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.model ? scope.row.material.model : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请数量" prop="qty" width="100" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.qty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="待出库数量" prop="pendingOutboundQty" width="110" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.pendingOutboundQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库待审核数量" prop="ckPendingAuditQty" width="120" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.ckPendingAuditQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已下推出库合计" prop="linkedCkQty" width="120" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.linkedCkQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已审核出库数量" prop="ckAuditedQty" width="120" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.ckAuditedQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已作废数量" prop="lineVoidQty" width="100" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.lineVoidQty) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="viewOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'WhWarehouseApplyDetailDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'WhWarehouseApply')],
  inheritAttrs: false
}
</script>
