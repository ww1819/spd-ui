<template>
  <el-table 
    v-loading="loading" 
    :data="tableData" 
    :row-class-name="rowClassName" 
    @selection-change="handleSelectionChange" 
    height="54vh" 
    border
  >
    <el-table-column type="selection" width="55" align="center" fixed="left" />
    <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
    <el-table-column label="单号" align="center" prop="consumeBillNo" width="180" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <el-button type="text" @click="handleView(scope.row)">
          <span>{{ scope.row.consumeBillNo }}</span>
        </el-button>
      </template>
    </el-table-column>
    <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
      </template>
    </el-table-column>
    <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
    <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
    <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ parseFloat(scope.row.totalAmount).toFixed(2) }}</span>
        <span v-else>--</span>
      </template>
    </el-table-column>
    <el-table-column label="制单人" align="center" prop="createrName" width="100" show-overflow-tooltip resizable />
    <el-table-column label="单据状态" align="center" prop="consumeBillStatus" width="100" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <dict-tag :options="dict.type.biz_status" :value="scope.row.consumeBillStatus"/>
      </template>
    </el-table-column>
    <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable />
    <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
      </template>
    </el-table-column>
    <el-table-column label="驳回原因" align="center" prop="rejectReason" width="150" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span>{{ scope.row.rejectReason || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
    <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
      <template slot-scope="scope">
        <span style="white-space: nowrap; display: inline-block;">
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-if="scope.row.consumeBillStatus == 2"
            style="padding: 0 5px; margin: 0;"
          >查看</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['department:batchConsume:edit']"
            v-if="scope.row.consumeBillStatus != 2"
            style="padding: 0 5px; margin: 0;"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['department:batchConsume:remove']"
            v-if="scope.row.consumeBillStatus != 2"
            style="padding: 0 5px; margin: 0;"
          >删除</el-button>
        </span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: "MainTable",
  dicts: ['biz_status'],
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    tableData: {
      type: Array,
      default: () => []
    },
    queryParams: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    rowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    handleSelectionChange(selection) {
      this.$emit('selection-change', selection);
    },
    handleView(row) {
      this.$emit('view', row);
    },
    handleUpdate(row) {
      this.$emit('update', row);
    },
    handleDelete(row) {
      this.$emit('delete', row);
    }
  }
};
</script>
