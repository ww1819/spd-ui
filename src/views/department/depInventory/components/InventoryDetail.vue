<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
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
            <el-form-item label="耗材" prop="materialKeyword" class="query-item-inline">
              <el-input
                v-model="queryParams.materialKeyword"
                placeholder="耗材名称/编码"
                clearable
                class="query-select-wrapper"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="计费" prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="请选择计费" clearable class="query-select-billing">
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="收货确认状态" prop="receiptConfirmStatus" class="query-item-inline">
              <el-select v-model="queryParams.receiptConfirmStatus" placeholder="请选择" clearable class="query-select-receipt">
                <el-option label="全部" :value="null" />
                <el-option label="未确认" :value="0" />
                <el-option label="已确认" :value="1" />
              </el-select>
            </el-form-item>
            <el-form-item label="生产批号" prop="batchNumber" class="query-item-inline">
              <el-input
                v-model="queryParams.batchNumber"
                placeholder="生产批号"
                clearable
                class="query-input-batch"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory button-row-inventory-flex">
      <div class="button-row-left">
        <el-button type="warning" icon="el-icon-download" size="medium" @click="handleExport">导出</el-button>
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </div>
      <div class="button-row-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="inventoryList"
        height="60vh"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="耗材" align="center" prop="material.name" width="160" show-overflow-tooltip resizable />
        <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="归属仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" align="center" prop="material.speci" width="80" show-overflow-tooltip resizable/>
        <el-table-column label="型号" align="center" prop="material.model" width="80" show-overflow-tooltip resizable/>
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
        <el-table-column label="数量" align="center" prop="qty" width="80" show-overflow-tooltip resizable/>
        <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="生产批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="耗材批次号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="生产日期" align="center" prop="beginDate" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.beginDate">{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" align="center" prop="endDate" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.endDate">{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" align="center" prop="batchNo" width="220" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="batch-no-text">{{ scope.row.batchNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName">
              {{ scope.row.material.fdWarehouseCategory.warehouseCategoryName }}
            </span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable>
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
        <el-table-column label="生产厂家" align="center" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ depFactoryName(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.supplier && scope.row.supplier.name) || (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="主条码" align="center" prop="mainBarcode" width="140" show-overflow-tooltip resizable/>
        <el-table-column label="辅条码" align="center" prop="subBarcode" width="140" show-overflow-tooltip resizable/>
        <el-table-column label="出库日期" align="center" prop="materialDate" width="180" show-overflow-tooltip resizable>
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
        <el-table-column label="收货确认状态" align="center" prop="receiptConfirmStatus" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.receiptConfirmStatus === 1">已确认</span>
            <span v-else-if="scope.row.receiptConfirmStatus === 0">未确认</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <div class="pagination-container">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          :pager-count="11"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { listInventory } from "@/api/department/depInventory";
import { exportDepInventoryDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "InventoryDetail",
  components: {SelectDepartment,SelectWarehouse,SelectSupplier,RightToolbar},
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      inventoryList: [],
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        supplierId: null,
        materialKeyword: '',
        departmentId: null,
        isBilling: '',
        qty: null,
        unitPrice: null,
        amt: null,
        batchNo: null,
        batchNumber: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null,
        receiptConfirmStatus: null
      }
    };
  },
  computed: {
    pageTotalQty() {
      return (this.inventoryList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.inventoryList || []).reduce((s, r) => s + Number(r.amt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listInventory(this.queryParams).then(response => {
        this.inventoryList = response.rows || [];
        this.total = response.total != null ? response.total : 0;
        this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
        this.loading = false;
      }).catch(() => {
        this.inventoryList = [];
        this.total = 0;
        this.totalInfo = { totalQty: 0, totalAmt: 0 };
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await listInventory(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDepInventoryDetailStyledXlsx({
          rows,
          beginDate: "",
          endDate: "",
          fileName: `科室库存明细查询表${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    },
    depFactoryName(row) {
      if (!row) return '--';
      if (row.fdFactory && row.fdFactory.factoryName) return row.fdFactory.factoryName;
      const m = row.material;
      if (m && m.fdFactory && m.fdFactory.factoryName) return m.fdFactory.factoryName;
      return '--';
    }
  }
};
</script>

<style scoped>
.app-container {
  margin-top: -10px;
}

.query-row-left {
  margin-bottom: 2px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-item-inline .el-form-item {
  margin-bottom: 0;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 2px;
  position: relative;
}

.query-row-second-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  gap: 4px;
  padding-bottom: 2px;
}

.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 8px;
  white-space: nowrap;
}

.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-select-billing {
  width: 120px;
}

.query-select-receipt {
  width: 160px;
}

.query-input-batch {
  width: 150px;
}

.form-fields-container {
  background: #fff;
  padding: 6px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
  border: 1px solid #EBEEF5;
}

.button-row-inventory {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
}

.button-row-inventory-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.button-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.button-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  min-width: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

/* 表体横向滚动：与出退库明细一致，保证底部横向条可见（含 Firefox） */
.table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 32px;
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
}
.table-container ::v-deep .el-table__footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 3;
  background: #fff;
}
.table-container ::v-deep .el-table__fixed-footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 4;
  background: #fff;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 10px;
  transition: height 0.2s ease;
}
.table-container:hover ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 3px;
  margin: 0 2px;
  cursor: pointer;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 3px;
  cursor: grab;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #808080;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #606060;
  cursor: grabbing;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}
.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}

/* 与 firstOutQuery 明细表一致：表头单行、行高 23px，避免窄列换行抬高列头 */
.table-container ::v-deep .el-table thead th.el-table__cell > .cell {
  white-space: nowrap;
  line-height: 23px;
}

/* 合计行：覆盖全局 .cell 的 word-break: break-all，数字与金额单行显示 */
.table-container ::v-deep .el-table__footer-wrapper td.el-table__cell > .cell,
.table-container ::v-deep .el-table__fixed-footer-wrapper td.el-table__cell > .cell {
  white-space: nowrap;
  word-break: normal;
  overflow: visible;
  line-height: 23px;
}
</style>

<style>
.app-container.first-inventory-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}

.batch-no-text {
  display: inline-block;
  width: 100%;
  white-space: normal;
  word-break: break-all;
  line-height: 18px;
}
</style>
