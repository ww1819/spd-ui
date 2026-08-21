<template>
  <div class="app-container list-page first-inventory-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="searchForm" ref="queryForm" size="small" :inline="true" class="query-form">
        <more-search-bar
          ref="moreSearchBar"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          @change="onMoreSearchTypesChange"
          @search="handleQuery"
          @reset="resetQuery"
        >
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'department'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectDepartment v-model="searchForm.departmentId" field-placeholder="科室" />
              </div>
            </template>
            <el-input
              v-else-if="t === 'consumeBillNo'"
              v-model="searchForm.consumeBillNo"
              placeholder="单号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'hisChargeCode'"
              v-model="searchForm.hisChargeCode"
              placeholder="HIS收费编码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'patientId'"
              v-model="searchForm.patientId"
              placeholder="住院/门诊号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'specification'"
              v-model="searchForm.specification"
              placeholder="规格"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'model'"
              v-model="searchForm.model"
              placeholder="型号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'warehouseCategoryKeyword'"
              v-model="searchForm.warehouseCategoryKeyword"
              placeholder="耗材分类编码/名称/简码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'financeCategoryKeyword'"
              v-model="searchForm.financeCategoryKeyword"
              placeholder="财务分类编码/名称/简码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="searchForm.materialName"
              placeholder="耗材名称"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="消耗日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="searchForm.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="searchForm.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker query-date-end"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="handleExport">导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tableData"
        height="60vh"
        border
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="耗材编码" align="center" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="耗材名称" align="center" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="规格" align="center" prop="specification" width="130" min-width="110" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="型号" align="center" prop="model" width="130" min-width="110" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="单位" align="center" prop="unit" width="100" min-width="90" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="消耗数量" align="center" prop="totalQuantity" width="120" min-width="110" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="消耗金额" align="center" prop="totalAmount" width="130" min-width="120" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="平均单价" align="center" prop="averagePrice" width="130" min-width="120" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">
            <span v-if="scope.row.averagePrice != null && scope.row.averagePrice !== ''">{{ scope.row.averagePrice | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="使用率(%)" align="center" prop="usageRate" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.usageRate !== null && scope.row.usageRate !== undefined">{{ formatPercentage(scope.row.usageRate) }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材分类" align="center" prop="category" width="120" show-overflow-tooltip resizable />
        <el-table-column label="财务分类" align="center" prop="financialCategory" width="120" show-overflow-tooltip resizable />
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
import request from "@/utils/request";
import RightToolbar from "@/components/RightToolbar";
import { exportDepartmentConsumptionSummaryStyledXlsx } from "@/utils/departmentOutSummaryExport";
import { buildDefaultDateRange } from "@/utils/defaultDateRange";

function createDefaultDates() {
  const { beginDate, endDate } = buildDefaultDateRange(5);
  return { beginDate, endDate };
}

export default {
  name: "SummaryReport",
  components: { SelectDepartment, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "科室", value: "department" },
        { label: "单号", value: "consumeBillNo" },
        { label: "HIS收费编码", value: "hisChargeCode" },
        { label: "住院/门诊号", value: "patientId" },
        { label: "耗材名称", value: "materialName" },
        { label: "规格", value: "specification" },
        { label: "型号", value: "model" },
        { label: "耗材分类", value: "warehouseCategoryKeyword" },
        { label: "财务分类", value: "financeCategoryKeyword" }
      ],
      tableData: [],
      total: 0,
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        sortField: null,
        sortOrder: null
      },
      searchForm: {
        departmentId: null,
        consumeBillNo: "",
        materialName: "",
        specification: "",
        model: "",
        hisChargeCode: "",
        patientId: "",
        warehouseCategoryKeyword: "",
        financeCategoryKeyword: "",
        ...createDefaultDates()
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.department.departmentConsumption.summary.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    },
    pageTotalQty() {
      return (this.tableData || []).reduce((s, r) => s + Number(r.totalQuantity || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.tableData || []).reduce((s, r) => s + Number(r.totalAmount || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    }
  },
  mounted() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
  },
  methods: {
    formatPercentage(value) {
      if (value !== 0 && !value) return "0.00";
      return this.formatAmount(value);
    },
    buildRequestParams() {
      const form = { ...this.searchForm };
      this.applyMoreSearchToQueryParams(form);
      const params = {
        departmentId: form.departmentId,
        consumeBillNo: form.consumeBillNo,
        materialName: form.materialName,
        specification: form.specification,
        model: form.model,
        hisChargeCode: form.hisChargeCode,
        patientId: form.patientId,
        warehouseCategoryKeyword: form.warehouseCategoryKeyword,
        financeCategoryKeyword: form.financeCategoryKeyword,
        beginDate: form.beginDate,
        endDate: form.endDate,
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        sortField: this.queryParams.sortField,
        sortOrder: this.queryParams.sortOrder
      };
      return params;
    },
    getList() {
      this.loading = true;
      request({
        url: "/department/batchConsume/auditedSummaryList",
        method: "get",
        params: this.buildRequestParams()
      })
        .then(response => {
          if (response && (response.code === 200 || response.code === undefined)) {
            this.tableData = response.rows || [];
            this.total = response.total != null ? response.total : 0;
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
      Object.assign(this.searchForm, createDefaultDates());
      this.searchForm.consumeBillNo = "";
      this.queryParams.sortField = null;
      this.queryParams.sortOrder = null;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass(t) {
      if (t === 'department') {
        return 'more-search-field--select';
      }
      return 'more-search-field--text';
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.loadDefaults === "function") {
        return bar.loadDefaults();
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v));
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      const map = {
        department: 'departmentId',
        consumeBillNo: 'consumeBillNo',
        hisChargeCode: 'hisChargeCode',
        patientId: 'patientId',
        materialName: 'materialName',
        specification: 'specification',
        model: 'model',
        warehouseCategoryKeyword: 'warehouseCategoryKeyword',
        financeCategoryKeyword: 'financeCategoryKeyword'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.searchForm);
    },
    handleSortChange({ prop, order }) {
      this.queryParams.sortField = order ? prop : null;
      this.queryParams.sortOrder = order === "descending" ? "desc" : order === "ascending" ? "asc" : null;
      this.queryParams.pageNum = 1;
      this.getList();
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
          url: "/department/batchConsume/auditedSummaryList",
          method: "get",
          params
        });
        const ok = response && (response.code === 200 || response.code === undefined);
        const rows = ok ? response.rows || [] : [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const beginDate = this.searchForm.beginDate || "";
        const endDate = this.searchForm.endDate || beginDate;
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDepartmentConsumptionSummaryStyledXlsx({
          rows,
          beginDate,
          endDate,
          fileName: `科室消耗汇总报表${dateStr}.xlsx`
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

.query-row-first {
  margin-bottom: 2px;
}

.query-row-first-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  gap: 2px;
  padding-bottom: 2px;
}

.query-row-first-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 6px;
  white-space: nowrap;
}

.query-row-first-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-item-inline {
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 2px;
}

.query-item-inline .el-form-item__label {
  width: 72px !important;
  padding-right: 6px !important;
}

.query-item-wide-label .el-form-item__label {
  width: 96px !important;
  padding-right: 6px !important;
}

.query-item-inline .el-form-item {
  margin-bottom: 0;
}

.query-select-wrapper {
  width: 132px;
}

.query-input-text {
  width: 128px;
}

.query-input-text--short {
  width: 112px;
}

.query-daterange-picker {
  width: 240px;
}

.query-row-date {
  margin-bottom: 2px;
}

.query-item-daterange-row .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-date-single {
  width: 148px;
}

.query-date-separator {
  margin: 0 6px;
  color: #606266;
  white-space: nowrap;
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

.list-query-panel {
  margin-top: -20px;
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
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
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

.table-container ::v-deep .el-table .caret-wrapper {
  margin-left: 2px;
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
