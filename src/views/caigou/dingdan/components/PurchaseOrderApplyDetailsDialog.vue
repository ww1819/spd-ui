<template>
    <el-dialog title="科室申购单明细" :visible.sync="applyDetailsDialogVisible" width="800px" append-to-body>
      <el-table :data="applyDetailsList" border size="small" max-height="360">
        <el-table-column label="申购单单号" prop="applyBillNo" min-width="140" show-overflow-tooltip/>
        <el-table-column label="申购科室" prop="departmentName" min-width="100" show-overflow-tooltip/>
        <el-table-column label="申购数量" prop="qty" width="100" align="right"/>
        <el-table-column label="制单人" prop="createByName" width="90" show-overflow-tooltip/>
        <el-table-column label="制单时间" prop="createTime" width="160">
          <template slot-scope="scope">{{ scope.row.createTime | parseTime('{y}-{m}-{d} {h}:{i}:{s}') || '--' }}</template>
        </el-table-column>
        <el-table-column label="审核人" prop="auditByName" width="90" show-overflow-tooltip/>
        <el-table-column label="审核时间" prop="auditTime" width="160">
          <template slot-scope="scope">{{ scope.row.auditTime | parseTime('{y}-{m}-{d} {h}:{i}:{s}') || '--' }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="applyDetailsDialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PurchaseOrderApplyDetailsDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchaseOrder')],
  inheritAttrs: false
}
</script>
