<template>
  <el-table 
    class="detail-table"
    :data="tableData" 
    :row-class-name="rowClassName" 
    @selection-change="handleSelectionChange" 
    ref="detailTable" 
    height="100%" 
    border 
    :summary-method="getSummaries" 
    show-summary
  >
    <el-table-column type="selection" width="50" align="center" resizable />
    <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
    <el-table-column label="名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
    <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
    <el-table-column label="型号" align="center" prop="material.model" width="140" show-overflow-tooltip resizable/>
    <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
    <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <span>{{ scope.row.unitPrice || '--' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <el-input 
          v-if="editable"
          clearable 
          v-model="scope.row.qty" 
          placeholder="请输入数量"
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
    <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable/>
    <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
    <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
    <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
    <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable/>
    <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <dict-tag :options="dict.type.way_status" :value="scope.row.material && scope.row.material.isWay"/>
      </template>
    </el-table-column>
    <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
      <template slot-scope="scope">
        <el-input 
          v-if="editable"
          v-model="scope.row.remark" 
          placeholder="请输入备注" 
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
        if (index === 1) {
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

<style scoped>
/* 明细框表头样式：边框加粗、字体加粗加大、背景加深 */
</style>

<style>
/* 明细框表头样式：使用非scoped样式确保生效 */
.detail-table th {
  border-right: 2px solid #C0C4CC !important;
  border-bottom: 2px solid #C0C4CC !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

.detail-table th:first-child {
  border-left: 2px solid #C0C4CC !important;
}

.detail-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

.detail-table th.is-leaf {
  background-color: #EBEEF5 !important;
}

.detail-table thead th {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

.detail-table thead th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

.detail-table::before {
  height: 2px !important;
  background-color: #C0C4CC !important;
}
</style>
