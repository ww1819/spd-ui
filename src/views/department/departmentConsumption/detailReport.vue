<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="searchForm" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="searchForm.departmentId" />
              </div>
            </el-form-item>
            <el-form-item label="耗材" prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectMaterial v-model="searchForm.materialId" />
              </div>
            </el-form-item>
            <el-form-item label="耗材名称" prop="materialName" class="query-item-inline">
              <el-input
                v-model="searchForm.materialName"
                placeholder="耗材名称"
                clearable
                class="query-input-text"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="规格" prop="specification" class="query-item-inline">
              <el-input
                v-model="searchForm.specification"
                placeholder="规格"
                clearable
                class="query-input-text"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="型号" prop="model" class="query-item-inline">
              <el-input
                v-model="searchForm.model"
                placeholder="型号"
                clearable
                class="query-input-text"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="HIS收费编码" prop="hisChargeCode" class="query-item-inline query-item-wide-label">
              <el-input
                v-model="searchForm.hisChargeCode"
                placeholder="HIS收费编码"
                clearable
                class="query-input-text"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="住院/门诊号" prop="patientId" class="query-item-inline query-item-wide-label">
              <el-input
                v-model="searchForm.patientId"
                placeholder="患者住院号/门诊号"
                clearable
                class="query-input-text"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="消耗日期" prop="dateRange" class="query-item-inline query-item-wide-label query-item-daterange">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                clearable
                class="query-daterange-picker"
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
        :data="tableData"
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
        <el-table-column label="单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable />
        <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="名称" align="center" prop="materialName" width="150" show-overflow-tooltip resizable />
        <el-table-column label="规格" align="center" prop="specification" width="120" show-overflow-tooltip resizable />
        <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable />
        <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice != null && scope.row.unitPrice !== ''">{{ scope.row.unitPrice | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="quantity" width="100" show-overflow-tooltip resizable />
        <el-table-column label="金额" align="center" prop="amount" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.amount">{{ scope.row.amount | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材分类" align="center" prop="category" width="120" show-overflow-tooltip resizable />
        <el-table-column label="财务分类" align="center" prop="financialCategory" width="120" show-overflow-tooltip resizable />
        <el-table-column label="注册证号" align="center" prop="registrationNumber" width="180" show-overflow-tooltip resizable />
        <el-table-column label="医保编码" align="center" prop="medicalInsuranceCode" width="120" show-overflow-tooltip resizable />
        <el-table-column label="HIS收费项目编码" align="center" prop="hisChargeItemCode" width="150" show-overflow-tooltip resizable />
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
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import request from "@/utils/request";
import RightToolbar from "@/components/RightToolbar";
import { exportDepartmentConsumptionDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";

export default {
  name: "DetailReport",
  components: { SelectMaterial, SelectDepartment, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      tableData: [],
      total: 0,
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      searchForm: {
        departmentId: null,
        materialId: null,
        materialName: "",
        specification: "",
        model: "",
        hisChargeCode: "",
        patientId: "",
        dateRange: null
      }
    };
  },
  computed: {
    pageTotalQty() {
      return (this.tableData || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.tableData || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    buildRequestParams() {
      const params = {
        departmentId: this.searchForm.departmentId,
        materialId: this.searchForm.materialId,
        materialName: this.searchForm.materialName,
        specification: this.searchForm.specification,
        model: this.searchForm.model,
        hisChargeCode: this.searchForm.hisChargeCode,
        patientId: this.searchForm.patientId,
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize
      };
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        params.beginDate = this.searchForm.dateRange[0];
        params.endDate = this.searchForm.dateRange[1];
      }
      return params;
    },
    getList() {
      this.loading = true;
      request({
        url: "/department/batchConsume/auditedDetailList",
        method: "get",
        params: this.buildRequestParams()
      })
        .then(response => {
          if (response && (response.code === 200 || response.code === undefined)) {
            this.tableData = response.rows || response.data?.rows || [];
            this.total = response.total != null ? response.total : response.data?.total || 0;
            this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
          } else {
            this.tableData = [];
            this.total = 0;
            this.totalInfo = { totalQty: 0, totalAmt: 0 };
            if (response && response.msg) {
              this.$modal.msgWarning(response.msg);
            }
          }
          this.loading = false;
        })
        .catch(error => {
          this.$modal.msgError("查询失败：" + (error.msg || error.message || "未知错误"));
          this.tableData = [];
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
      this.searchForm.dateRange = null;
      this.handleQuery();
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill("");
      let totalQty = 0;
      let totalAmt = 0;
      for (let i = 0; i < (data || []).length; i++) {
        const item = data[i] || {};
        totalQty += Number(item.quantity || 0);
        totalAmt += Number(item.amount || 0);
      }
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      columns.forEach((column, index) => {
        if (column.property === "quantity") {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === "amount") {
          sums[index] = fmt ? fmt(totalAmt) : totalAmt.toFixed(2);
        }
      });
      sums[0] = "合计";
      return sums;
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
      const params = { ...this.buildRequestParams(), pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await request({
          url: "/department/batchConsume/auditedDetailList",
          method: "get",
          params
        });
        const ok = response && (response.code === 200 || response.code === undefined);
        const rows = ok ? response.rows || response.data?.rows || [] : [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const dr = this.searchForm.dateRange;
        const beginDate = dr && dr.length === 2 ? dr[0] : "";
        const endDate = dr && dr.length === 2 ? dr[1] : beginDate;
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDepartmentConsumptionDetailStyledXlsx({
          rows,
          beginDate,
          endDate,
          fileName: `科室消耗明细报表${dateStr}.xlsx`
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
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

.query-item-wide-label .el-form-item__label {
  width: 108px !important;
}

.query-item-inline .el-form-item {
  margin-bottom: 0;
}

.query-select-wrapper {
  width: 180px;
}

.query-input-text {
  width: 180px;
}

.query-daterange-picker {
  width: 240px;
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
