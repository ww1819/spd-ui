<template>
  <div class="app-container">
    <div class="query-container">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectWarehouse v-model="queryParams.warehouseId" />
                </div>
          </el-form-item>
              <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectSupplier v-model="queryParams.supplierId" />
                </div>
          </el-form-item>
              <el-form-item label="耗材" prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectMaterial v-model="queryParams.materialId" />
                </div>
          </el-form-item>
        </el-col>
      </el-row>
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="科室" prop="departmentId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectDepartment v-model="queryParams.departmentId" />
                </div>
          </el-form-item>
              <el-form-item label="计费" prop="isBilling" class="query-item-inline">
                <el-select v-model="queryParams.isBilling" placeholder="请选择计费" clearable style="width: 180px">
                  <el-option label="全部" value="" />
                  <el-option label="是" value="1" />
                  <el-option label="否" value="0" />
                </el-select>
          </el-form-item>
        </el-col>
      </el-row>
        </el-form>
      </div>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 0px; margin-top: 0px; margin-bottom: 16px;">
      <el-col :span="1.5">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="small"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
        </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetQuery"
        >重置</el-button>
        </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

    <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="inventoryList" 
              :row-class-name="inventoryListIndex"
              show-summary :summary-method="getSummaries" 
              height="51vh"
              border>
      <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
      <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材" align="center" prop="material.name" width="160" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span
            v-if="scope.row.unitPrice !== null && scope.row.unitPrice !== undefined && scope.row.unitPrice !== ''"
          >
            {{ scope.row.unitPrice | formatCurrency}}
          </span>
          <span
            v-else-if="scope.row.amt !== null && scope.row.amt !== undefined && scope.row.qty"
          >
            {{ (scope.row.amt / scope.row.qty) | formatCurrency }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="生产日期" align="center" prop="beginDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.beginDate">{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.endDate">{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable/>
      <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName">
            {{ scope.row.material.fdWarehouseCategory.warehouseCategoryName }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName">
            {{ scope.row.material.fdFinanceCategory.financeCategoryName }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" prop="material.isBilling" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1)">是</span>
          <span v-else-if="scope.row.material && (scope.row.material.isBilling === '0' || scope.row.material.isBilling === 0 || scope.row.material.isBilling === '2')">否</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="150" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="material.supplier.name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="出库日期" align="center" prop="materialDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="出库单号" align="center" prop="outOrderNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.outOrderNo">{{ scope.row.outOrderNo }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listInventory } from "@/api/department/depInventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "InventoryDetail",
  components: {SelectMaterial,SelectDepartment,SelectWarehouse,SelectSupplier,RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 科室库存表格数据
      inventoryList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        supplierId: null,
        materialId: null,
        departmentId: null,
        isBilling: '',
        qty: null,
        unitPrice: null,
        amt: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null
      }
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    /** 查询科室库存列表 */
    getList() {
      this.loading = true;
      listInventory(this.queryParams).then(response => {
        this.inventoryList = response.rows;
        this.total = response.total;
        this.loading = false;
        // 使用$nextTick确保DOM更新完成后刷新表格合计
        this.$nextTick(() => {
          // 强制表格重新布局，确保合计正确显示
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    inventoryListIndex({ row, rowIndex }) {
      // 确保 pageNum 和 pageSize 是正整数
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));

      // 计算行索引
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },
    /** 合计行计算 */
    getSummaries(param) {
      const { columns, data } = param;
      // 创建与列数相同的数组
      const sums = Array(columns.length).fill('');
      
      // 第一列显示"合计"
      sums[0] = '合计';
      
      // 计算合计数量和金额
      let totalQty = 0;
      let totalAmt = 0;
      
      // 计算总和
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        totalQty += Number(item.qty || 0);
        totalAmt += Number(item.amt || 0);
      }
      
      // 遍历所有列，为指定列设置合计值
      columns.forEach((column, index) => {
        if (column.property === 'qty') {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === 'amt') {
          sums[index] = '￥' + totalAmt.toFixed(2);
        }
      });
      
      return sums;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/depInventory/export', {
        ...this.queryParams
      }, `department_inventory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 查询条件样式 */
.query-row-left {
  margin-bottom: 10px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 10px;
  position: relative;
}

.query-row-second .el-form-item {
  white-space: nowrap;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 查询容器样式 */
.query-container {
  margin-top: -20px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
}

.table-container {
  margin-top: 0px;
  overflow: visible;
  width: 100%;
  position: relative;
}

/* 加粗表格底部滚动条，提升可操作性 */
.table-container ::-webkit-scrollbar {
  height: 12px;
}

.table-container ::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background-color: #c0c4cc;
}

.table-container ::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}
</style>
