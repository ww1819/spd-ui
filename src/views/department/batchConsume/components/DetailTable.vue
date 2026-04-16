<template>
  <el-table
    :data="tableData"
    :row-class-name="rowClassName"
    @selection-change="handleSelectionChange"
    ref="detailTable"
    :height="tableHeight"
    border
    :summary-method="getSummaries"
    show-summary
  >
    <el-table-column type="selection" width="60" align="center" fixed="left" resizable />
    <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable />
    <el-table-column
      label="名称"
      align="left"
      header-align="center"
      width="240"
      min-width="180"
      :show-overflow-tooltip="false"
      class-name="detail-col-text-wrap"
      resizable
    >
      <template slot-scope="scope">
        <span
          class="detail-text-cell-2line"
          :title="(scope.row.material && scope.row.material.name) || '--'"
        >{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column
      label="规格"
      align="left"
      header-align="center"
      width="200"
      min-width="150"
      :show-overflow-tooltip="false"
      class-name="detail-col-text-wrap"
      resizable
    >
      <template slot-scope="scope">
        <span
          class="detail-text-cell-2line"
          :title="(scope.row.material && scope.row.material.speci) || '--'"
        >{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column
      label="型号"
      align="left"
      header-align="center"
      width="200"
      min-width="150"
      :show-overflow-tooltip="false"
      class-name="detail-col-text-wrap"
      resizable
    >
      <template slot-scope="scope">
        <span
          class="detail-text-cell-2line"
          :title="(scope.row.material && scope.row.material.model) || '--'"
        >{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable />
    <el-table-column label="单价" prop="unitPrice" width="120" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span>{{ scope.row.unitPrice || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <el-input
          v-if="editable"
          clearable
          v-model="scope.row.qty"
          placeholder="数量"
          @input="qtyChange(scope.row)"
        />
        <span v-else>{{ scope.row.qty || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span>{{ scope.row.amt || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="来源消耗单号" align="center" prop="srcConsumeBillNo" width="140" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span>{{ scope.row.srcConsumeBillNo || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="来源明细ID" align="center" prop="srcConsumeEntryId" width="120" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span>{{ scope.row.srcConsumeEntryId || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column
      label="生产厂家"
      align="left"
      header-align="center"
      width="260"
      min-width="200"
      :show-overflow-tooltip="false"
      class-name="detail-col-text-wrap"
      resizable
    >
      <template slot-scope="scope">
        <span
          class="detail-text-cell-2line"
          :title="(scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--'"
        >{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable />
    <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable />
    <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable />
    <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable />
    <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <dict-tag :options="dict.type.way_status" :value="scope.row.material && scope.row.material.isWay" />
      </template>
    </el-table-column>
    <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <el-input
          v-if="editable"
          v-model="scope.row.remark"
          placeholder="备注"
        />
        <span v-else>{{ scope.row.remark || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column v-if="editable" label="操作" align="center" width="100" fixed="right">
      <template slot-scope="scope">
        <el-button
          size="small"
          type="text"
          icon="el-icon-delete"
          @click="handleDeleteRow(scope.$index)"
          style="padding: 0 5px; margin: 0;"
        >删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: "DetailTable",
  dicts: ['way_status'],
  props: {
    tableData: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: true
    },
    /** 与到货验收弹窗明细表一致（inWarehouse/audit detailTableHeight） */
    tableHeight: {
      type: [String, Number],
      default: 'max(260px, calc(100vh - 368px))'
    }
  },
  methods: {
    rowClassName({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    handleSelectionChange(selection) {
      this.$emit('selection-change', selection);
    },
    qtyChange(row) {
      this.$emit('qty-change', row);
    },
    handleDeleteRow(index) {
      this.$emit('delete-row', index);
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (column.type === 'selection') {
          sums[index] = '';
          return;
        }
        if (column.property === 'index') {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'qty') {
          let totalQty = 0;
          data.forEach(item => {
            if (item.qty && !isNaN(item.qty)) {
              totalQty += parseFloat(item.qty);
            }
          });
          sums[index] = totalQty;
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach(item => {
            if (item.amt && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '￥' + totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    }
  }
};
</script>
