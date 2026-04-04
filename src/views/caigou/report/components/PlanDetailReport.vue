<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="计划单号" prop="planNo" class="query-item-inline">
              <el-input
                v-model="queryParams.planNo"
                placeholder="计划单号"
                clearable
                class="query-input-text"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectSupplier v-model="queryParams.supplierId" />
              </div>
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" />
              </div>
            </el-form-item>
            <el-form-item label="耗材" prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectMaterial v-model="queryParams.materialId" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="制单日期" class="query-item-inline query-item-date-range">
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
            <el-form-item label="采购计划状态" prop="planStatus" class="query-item-inline query-item-wide-label">
              <el-select v-model="queryParams.planStatus" placeholder="全部" clearable class="query-select-status">
                <el-option
                  v-for="dict in dict.type.plan_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
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
        :data="reportList"
        show-summary
        :summary-method="getSummaries"
        height="60vh"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable />
        <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable />
        <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable />
        <el-table-column label="规格" align="center" prop="materialSpec" width="120" show-overflow-tooltip resizable />
        <el-table-column label="单位" align="center" prop="materialUnit" width="80" show-overflow-tooltip resizable />
        <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable />
        <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.qty">{{ scope.row.qty }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" align="center" prop="price" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.price">{{ scope.row.price | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="制单人" align="center" prop="createBy" width="120" show-overflow-tooltip resizable />
        <el-table-column label="计划状态" align="center" prop="planStatus" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.plan_status" :value="scope.row.planStatus" />
          </template>
        </el-table-column>
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
import { listPurchasePlan, getPurchasePlan } from "@/api/caigou/purchasePlan";
import { exportPurchasePlanDetailReportStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "PlanDetailReport",
  dicts: ["biz_status", "plan_status"],
  components: { SelectSupplier, SelectMaterial, SelectWarehouse, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      allDetailList: [],
      reportList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        planNo: null,
        supplierId: null,
        warehouseId: null,
        materialId: null,
        planStatus: null,
        beginDate: null,
        endDate: null
      }
    };
  },
  computed: {
    totalInfo() {
      const list = this.allDetailList || [];
      const totalQty = list.reduce((s, r) => s + Number(r.qty || 0), 0);
      const totalAmt = list.reduce((s, r) => s + Number(r.amt || 0), 0);
      return { totalQty, totalAmt };
    },
    pageTotalQty() {
      return (this.reportList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.reportList || []).reduce((s, r) => s + Number(r.amt || 0), 0);
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      return fmt ? fmt(amt) : String(Number(amt).toFixed(2));
    }
  },
  created() {
    this.queryParams.beginDate = this.getStatDate();
    this.queryParams.endDate = this.getEndDate();
    this.getList();
  },
  methods: {
    buildPlanListParams() {
      const params = {
        ...this.queryParams,
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate,
        pageNum: 1,
        pageSize: 10000
      };
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === "") {
          delete params[key];
        }
      });
      return params;
    },
    getList() {
      this.loading = true;
      const params = this.buildPlanListParams();
      listPurchasePlan(params)
        .then(response => {
          const planList = response.rows || [];
          if (planList.length === 0) {
            this.allDetailList = [];
            this.reportList = [];
            this.total = 0;
            this.loading = false;
            return;
          }
          this.fetchPlanDetails(planList);
        })
        .catch(() => {
          this.allDetailList = [];
          this.reportList = [];
          this.total = 0;
          this.loading = false;
        });
    },
    fetchPlanDetails(planList) {
      const detailPromises = planList.map(plan => {
        if (!plan.id) {
          return Promise.resolve({
            ...plan,
            purchasePlanEntryList: []
          });
        }
        return getPurchasePlan(plan.id)
          .then(response => {
            const entryList =
              response.data?.purchasePlanEntryList || response.data?.entryList || [];
            return {
              ...plan,
              purchasePlanEntryList: entryList
            };
          })
          .catch(() => ({
            ...plan,
            purchasePlanEntryList: []
          }));
      });

      Promise.all(detailPromises)
        .then(plansWithDetails => {
          const detailList = this.processPlanData(plansWithDetails);
          const filteredList = this.filterDetailData(detailList);
          this.allDetailList = filteredList;
          this.total = filteredList.length;
          this.applyPagination();
          this.loading = false;
        })
        .catch(() => {
          this.allDetailList = [];
          this.reportList = [];
          this.total = 0;
          this.loading = false;
        });
    },
    filterDetailData(detailList) {
      let filtered = detailList;
      if (this.queryParams.materialId) {
        filtered = filtered.filter(item => {
          const itemMaterialId = item.materialId || "";
          const queryMaterialId = String(this.queryParams.materialId);
          return itemMaterialId === queryMaterialId || String(itemMaterialId) === queryMaterialId;
        });
      }
      return filtered;
    },
    processPlanData(planList) {
      const detailList = [];
      if (planList && planList.length > 0) {
        planList.forEach(plan => {
          const entryList = plan.purchasePlanEntryList || plan.entryList || [];
          if (entryList && Array.isArray(entryList) && entryList.length > 0) {
            entryList.forEach(entry => {
              const materialId = entry.materialId || (entry.material && entry.material.id) || "";
              const material = entry.material || {};
              const materialCode = entry.materialCode || material.code || "";
              const materialName = entry.materialName || material.name || "";
              const materialSpec = entry.speci || entry.materialSpec || material.speci || "";
              const materialUnit = entry.materialUnit || (material.fdUnit && material.fdUnit.unitName) || "";
              detailList.push({
                planNo: plan.planNo,
                materialId,
                materialCode,
                materialName,
                materialSpec,
                materialUnit,
                supplierName: entry.supplierName || (material.supplier && material.supplier.name) || "",
                warehouseName: plan.warehouseName || (plan.warehouse && plan.warehouse.name) || "",
                qty: entry.qty || 0,
                price: entry.price || 0,
                amt: entry.amt || 0,
                createTime: plan.createTime || plan.planDate,
                createBy: plan.createBy || "",
                planStatus: plan.planStatus
              });
            });
          }
        });
      }
      return detailList;
    },
    getStatDate() {
      const myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      return myDate.getFullYear().toString() + "-" + month + "-" + "01";
    },
    getEndDate() {
      const myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      const dayEnd = new Date(myDate.getFullYear(), month, 0).getDate();
      return myDate.getFullYear().toString() + "-" + month + "-" + dayEnd;
    },
    applyPagination() {
      const { pageNum, pageSize } = this.queryParams;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      this.reportList = this.allDetailList.slice(start, end);
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      if (this.allDetailList.length) {
        this.applyPagination();
      }
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.applyPagination();
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.handleQuery();
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill("");
      let totalQty = 0;
      let totalAmt = 0;
      for (let i = 0; i < (data || []).length; i++) {
        const item = data[i] || {};
        totalQty += Number(item.qty || 0);
        totalAmt += Number(item.amt || 0);
      }
      columns.forEach((column, index) => {
        if (column.property === "qty") {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === "amt") {
          const fmt = this.$options.filters && this.$options.filters.formatCurrency;
          sums[index] = fmt ? fmt(totalAmt) : totalAmt.toFixed(2);
        }
      });
      sums[0] = "合计";
      return sums;
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const rows = this.allDetailList || [];
      if (!rows.length) {
        this.$message && this.$message.warning("暂无数据可导出");
        return;
      }
      const planOpts = this.dict.type.plan_status || [];
      const resolvePlanStatus = (v) => {
        if (v == null || v === "") return "";
        const hit = planOpts.find((d) => String(d.value) === String(v));
        return hit ? hit.label : String(v);
      };
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      try {
        await exportPurchasePlanDetailReportStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `采购计划明细表${dateStr}.xlsx`,
          resolvePlanStatus,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
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

.query-item-inline .el-form-item {
  margin-bottom: 0;
}

.query-item-wide-label .el-form-item__label {
  width: 110px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-input-text {
  width: 180px;
}

.query-select-status {
  width: 150px;
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
  width: 180px !important;
}

.query-item-date-range .query-date-start {
  margin-right: 0;
}

.query-item-date-range .query-date-end {
  margin-left: 0;
}

.query-item-date-range .query-date-sep {
  margin: 0 8px;
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
