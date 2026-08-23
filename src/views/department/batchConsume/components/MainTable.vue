<template>
  <el-table
    ref="applyMainTable"
    v-loading="loading"
    :data="tableData"
    class="table-compact apply-main-table"
    row-key="id"
    :row-class-name="applyMainRowClassName"
    @selection-change="handleSelectionChange"
    :height="height"
    border
    stripe
  >
    <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
    <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
    <el-table-column label="单号" align="center" prop="consumeBillNo" width="180" show-overflow-tooltip resizable sortable>
      <template slot-scope="scope">
        <el-button type="text" @click="handleView(scope.row)">
          <span>{{ (scope.row.reverseFlag == 1 || scope.row.reverseFlag === '1') ? ('【退】' + scope.row.consumeBillNo) : scope.row.consumeBillNo }}</span>
        </el-button>
      </template>
    </el-table-column>
    <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable sortable>
      <template slot-scope="scope">
        <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
      </template>
    </el-table-column>
    <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
    <el-table-column label="单据类型" align="center" prop="reverseFlag" width="100" show-overflow-tooltip resizable sortable>
      <template slot-scope="scope">
        <el-tag v-if="scope.row.reverseFlag == 1 || scope.row.reverseFlag === '1'" type="warning" size="mini">退消耗</el-tag>
        <el-tag v-else type="success" size="mini">正向消耗</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable>
      <template slot-scope="scope">
        <span v-if="scope.row.totalAmount !== null && scope.row.totalAmount !== undefined && scope.row.totalAmount !== ''">¥{{ scope.row.totalAmount | formatCurrency }}</span>
        <span v-else>--</span>
      </template>
    </el-table-column>
    <el-table-column label="制单人" align="center" prop="createrName" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreaterName">
      <template slot-scope="scope">
        <span>{{ formatPersonName(scope.row, 'creater') }}</span>
      </template>
    </el-table-column>
    <el-table-column label="单据状态" align="center" prop="consumeBillStatus" width="100" show-overflow-tooltip resizable sortable>
      <template slot-scope="scope">
        <dict-tag :options="dict.type.biz_status" :value="scope.row.consumeBillStatus"/>
      </template>
    </el-table-column>
    <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByAuditPerson">
      <template slot-scope="scope">
        <span>{{ formatPersonName(scope.row, 'audit') }}</span>
      </template>
    </el-table-column>
    <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
      <template slot-scope="scope">
        <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        <span v-else>--</span>
      </template>
    </el-table-column>
    <el-table-column label="来源单号" align="center" prop="reverseOfBillNo" width="180" show-overflow-tooltip resizable sortable>
      <template slot-scope="scope">
        <span>{{ scope.row.reverseOfBillNo || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable sortable />
    <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="220">
      <template slot-scope="scope">
        <span style="white-space: nowrap; display: inline-block;">
          <el-button
            size="small"
            type="text"
            @click="handleView(scope.row)"
            v-if="scope.row.consumeBillStatus == 2"
            style="padding: 0 5px; margin: 0;"
          >查看</el-button>
          <el-button
            size="small"
            type="text"
            class="reverse-action-btn"
            @click="handleReverse(scope.row)"
            v-hasPermi="['department:batchConsume:reverse']"
            v-if="isRowReverseable(scope.row)"
            style="padding: 0 5px; margin: 0;"
          >退消耗</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['department:batchConsume:edit']"
            v-if="scope.row.consumeBillStatus != 2"
            style="padding: 0 5px; margin: 0;"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
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
    },
    height: {
      type: Number,
      default: 400
    },
    selectedRowMap: {
      type: Object,
      default: () => ({})
    },
    canRowReverse: {
      type: Function,
      default: null
    }
  },
  methods: {
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByCreaterName(a, b) {
      const va = this.formatPersonName(a, 'creater');
      const vb = this.formatPersonName(b, 'creater');
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditPerson(a, b) {
      const va = this.formatPersonName(a, 'audit');
      const vb = this.formatPersonName(b, 'audit');
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    formatPersonName(row, type) {
      if (!row) {
        return '--';
      }
      if (type === 'creater') {
        const name = row.createrName
          || (row.creater && (row.creater.nickName || row.creater.userName))
          || (row.user && (row.user.nickName || row.user.userName));
        return name || '--';
      }
      const name = row.auditPersonName
        || (row.auditPerson && (row.auditPerson.nickName || row.auditPerson.userName));
      return name || '--';
    },
    isRowReverseable(row) {
      return typeof this.canRowReverse === 'function' && this.canRowReverse(row);
    },
    applyMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
    restoreSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.tableData || !this.tableData.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.tableData.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    doLayout() {
      const table = this.$refs.applyMainTable;
      if (table && table.doLayout) {
        table.doLayout();
      }
    },
    syncStickyScrollbar() {
      const table = this.$refs.applyMainTable;
      const root = table && table.$el;
      if (!root) return;
      const bodyWrap = root.querySelector('.el-table__body-wrapper');
      if (!bodyWrap) return;
      const sw = Math.max(0, bodyWrap.offsetWidth - bodyWrap.clientWidth);
      root.style.setProperty('--apply-v-scrollbar', `${sw}px`);
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
    },
    handleReverse(row) {
      this.$emit('reverse', row);
    }
  }
};
</script>

<style scoped>
.reverse-action-btn {
  color: #e6a23c;
}
</style>
