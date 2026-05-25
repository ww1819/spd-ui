<template>
  <el-dialog title="申购明细" :visible.sync="innerVisible" width="900px" append-to-body>
    <el-table :data="list" border max-height="400">
      <el-table-column label="科室申购单单号" prop="applyBillNo" width="140" show-overflow-tooltip />
      <el-table-column label="申购科室" prop="departmentName" width="120" show-overflow-tooltip />
      <el-table-column label="申购数量" prop="qty" width="100" align="right">
        <template slot-scope="scope">
          <span>{{ scope.row.qty != null ? Number(scope.row.qty) : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" prop="createByName" width="100" show-overflow-tooltip />
      <el-table-column label="制单时间" prop="createTime" width="160" show-overflow-tooltip />
      <el-table-column label="审核人" prop="auditByName" width="100" show-overflow-tooltip />
      <el-table-column label="审核时间" prop="auditTime" width="160" show-overflow-tooltip />
    </el-table>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="innerVisible = false">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'ApplyDetailDialog',
  props: {
    visible: { type: Boolean, default: false },
    list: { type: Array, default: () => [] }
  },
  computed: {
    innerVisible: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    }
  }
}
</script>
