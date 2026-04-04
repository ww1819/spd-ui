<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="耗材" prop="materialName" class="query-item-inline">
              <div class="query-select-wrapper">
                <MaterialAutocomplete v-model="queryParams.materialName" />
              </div>
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable />
              </div>
            </el-form-item>
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" clearable />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-end"
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
        :data="consumeSummaryList"
        show-summary
        :summary-method="getTotalSummaries"
        height="60vh"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="科室" align="center" prop="departmentName" width="120" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="耗材编码" align="center" prop="materialCode" min-width="140" width="150" show-overflow-tooltip resizable />
        <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable />
        <el-table-column label="规格" align="center" prop="materialSpeci" width="100" min-width="100" show-overflow-tooltip resizable />
        <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="100" show-overflow-tooltip resizable />
        <el-table-column label="单位" align="center" prop="unitName" width="100" min-width="100" show-overflow-tooltip resizable />
        <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="totalQty" width="80" show-overflow-tooltip resizable />
        <el-table-column label="金额" align="center" prop="totalAmt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmt">{{ scope.row.totalAmt | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="计费" align="center" prop="isBilling" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.isBilling === '1' || scope.row.isBilling === 1 || scope.row.isBilling === 'true'">是</span>
            <span v-else-if="scope.row.isBilling === '0' || scope.row.isBilling === 0 || scope.row.isBilling === '2' || scope.row.isBilling === 'false'">否</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证号" align="center" prop="registerNo" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.registerNo || "--" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证有效期" align="center" prop="periodDate" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.periodDate">{{ parseTime(scope.row.periodDate, "{y}-{m}-{d}") }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="厂家" align="center" prop="factoryName" min-width="200" width="220" show-overflow-tooltip resizable />
        <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable />
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额:
        {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额:
        {{ pageTotalAmtFormatted }}
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
import { listConsumeSummary } from "@/api/department/consumeDetail";
import { exportConsumeSummaryStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "ConsumeSummaryTable",
  components: { SelectWarehouse, SelectDepartment, MaterialAutocomplete, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      consumeSummaryList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialName: null,
        warehouseId: null,
        departmentId: null,
        beginDate: null,
        endDate: null
      }
    };
  },
  computed: {
    pageTotalQty() {
      return (this.consumeSummaryList || []).reduce((s, r) => s + Number(r.totalQty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.consumeSummaryList || []).reduce((s, r) => s + Number(r.totalAmt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill("");
      let totalQty = 0;
      let totalAmt = 0;
      for (let i = 0; i < (data || []).length; i++) {
        const item = data[i] || {};
        totalQty += Number(item.totalQty || 0);
        totalAmt += Number(item.totalAmt || 0);
      }
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      columns.forEach((column, index) => {
        if (column.property === "totalQty") {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === "totalAmt") {
          sums[index] = fmt ? fmt(totalAmt) : totalAmt.toFixed(2);
        }
      });
      sums[0] = "合计";
      return sums;
    },
    getList() {
      this.loading = true;
      listConsumeSummary(this.queryParams)
        .then(response => {
          this.consumeSummaryList = response.rows || [];
          this.total = response.total != null ? response.total : 0;
          this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
          this.loading = false;
        })
        .catch(() => {
          this.consumeSummaryList = [];
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
      this.queryParams.materialName = null;
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await listConsumeSummary(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportConsumeSummaryStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室领用汇总表${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
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

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 150px;
}
.query-item-date-range .query-date-start {
  margin-right: 6px;
}
.query-item-date-range .query-date-end {
  margin-left: 6px;
}
.query-item-date-range .query-date-sep {
  margin: 0 2px;
  flex-shrink: 0;
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
  border: 1px solid #ebeef5;
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

.table-container ::v-deep .el-table thead th.el-table__cell > .cell {
  white-space: nowrap;
  line-height: 23px;
}

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
</style>
