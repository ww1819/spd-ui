<template>
  <el-dialog title="查看申购单" :visible.sync="innerVisible" width="95%" append-to-body>
    <el-table :data="list" border max-height="450">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column label="科室申购单号" prop="applyBillNo" min-width="140" show-overflow-tooltip />
      <el-table-column label="仓库" prop="warehouseName" min-width="120" show-overflow-tooltip />
      <el-table-column label="制单人" prop="createByName" width="100" show-overflow-tooltip />
      <el-table-column label="制单时间" prop="createTime" width="160" show-overflow-tooltip />
      <el-table-column label="提交人" prop="submitByName" width="100" show-overflow-tooltip />
      <el-table-column label="提交时间" prop="submitTime" width="160" show-overflow-tooltip />
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
  name: 'ApplyBillHeaderDialog',
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
