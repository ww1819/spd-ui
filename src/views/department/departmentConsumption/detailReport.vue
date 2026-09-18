<template>
  <div class="app-container list-page first-inventory-page dept-consume-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="searchForm" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
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
        </div>
        <more-search-bar
          ref="moreSearchBar"
          class="ctk-more-search-bar--hidden"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          :show-picker="false"
          :show-save="false"
          :show-search-actions="false"
          @change="onMoreSearchTypesChange"
        />

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
            <div class="ctk-query-actions query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="list-toolbar ctk-list-toolbar">
      <div class="list-toolbar-left">
        <el-button type="warning" size="small" icon="el-icon-download" class="spd-btn" @click="handleExport">导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <div class="toolbar-more-search" @mouseenter="onToolbarMoreEnter" @mouseleave="onToolbarMoreLeave">
          <span class="more-search-label">更多检索</span>
          <el-select
            ref="toolbarMoreSelect"
            v-model="moreSearchTypes"
            multiple
            collapse-tags
            size="small"
            :popper-append-to-body="false"
            placeholder="选择检索条件（可多选）"
            class="more-search-type"
            @change="onMoreSearchTypesChange"
            @visible-change="onToolbarMoreVisibleChange"
          >
            <el-option v-for="opt in moreSearchOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <el-button type="success" size="small" icon="el-icon-check" class="spd-btn" @click="saveMoreSearchDefaults">保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="reportTable"
        class="dept-consume-main-table"
        v-loading="loading"
        :data="tableData"
        :height="tableHeight"
        :row-key="getDeptConsumeRowKey"
        :row-class-name="deptConsumeRowClassName"
        border
        stripe
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleDeptConsumeRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="dept-consume-select-col col-serial-center" />
        <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单号" align="left" header-align="center" class-name="ctk-col-left" prop="billNo" width="180" show-overflow-tooltip resizable />
        <el-table-column label="科室" align="left" header-align="center" class-name="ctk-col-left" prop="departmentName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="耗材编码" align="left" header-align="center" class-name="ctk-col-left" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable="custom" />
        <el-table-column label="耗材名称" align="left" header-align="center" class-name="ctk-col-left" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable="custom" />
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" prop="specification" width="130" min-width="110" show-overflow-tooltip resizable sortable="custom" />
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" prop="model" width="130" min-width="110" show-overflow-tooltip resizable sortable="custom" />
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable="custom" />
        <el-table-column label="单价" align="center" prop="unitPrice" width="120" min-width="110" show-overflow-tooltip resizable sortable="custom">
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice != null && scope.row.unitPrice !== ''">{{ scope.row.unitPrice | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="quantity" width="110" min-width="100" show-overflow-tooltip resizable sortable="custom" />
        <el-table-column label="金额" align="center" prop="amount" width="130" min-width="120" show-overflow-tooltip resizable sortable="custom">
          <template slot-scope="scope">
            <span v-if="scope.row.amount">{{ scope.row.amount | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材分类" align="left" header-align="center" class-name="ctk-col-left" prop="category" width="120" show-overflow-tooltip resizable />
        <el-table-column label="财务分类" align="left" header-align="center" class-name="ctk-col-left" prop="financialCategory" width="120" show-overflow-tooltip resizable />
        <el-table-column label="注册证号" align="left" header-align="center" class-name="ctk-col-left" prop="registrationNumber" width="180" show-overflow-tooltip resizable />
        <el-table-column label="医保编码" align="left" header-align="center" class-name="ctk-col-left" prop="medicalInsuranceCode" width="120" show-overflow-tooltip resizable />
        <el-table-column label="收费编码" align="left" header-align="center" class-name="ctk-col-left" prop="hisChargeItemCode" width="130" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="收费名称" align="left" header-align="center" class-name="ctk-col-left" prop="hisChargeItemName" width="150" min-width="130" show-overflow-tooltip resizable />
        <el-table-column label="收费规格" align="left" header-align="center" class-name="ctk-col-left" prop="hisChargeItemSpeci" width="130" min-width="110" show-overflow-tooltip resizable />
        <el-table-column label="收费单位" align="left" header-align="center" class-name="ctk-col-left" prop="hisChargeItemUnit" width="100" min-width="90" show-overflow-tooltip resizable />
        <el-table-column label="收费价格" align="center" prop="hisChargeItemPrice" width="120" min-width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.hisChargeItemPrice != null && scope.row.hisChargeItemPrice !== ''">{{ scope.row.hisChargeItemPrice | formatCurrency }}</span>
            <span v-else>--</span>
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
          :pager-count="7"
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
import { exportDepartmentConsumptionDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import { buildDefaultDateRange } from "@/utils/defaultDateRange";
import deptConsumeLayoutMixin from "./mixins/deptConsumeLayoutMixin";

function createDefaultDates() {
  const { beginDate, endDate } = buildDefaultDateRange(5);
  return { beginDate, endDate };
}

export default {
  name: "DetailReport",
  mixins: [deptConsumeLayoutMixin],
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
      selectedRowKeys: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      tableHeight: 400,
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
      return "spd.department.departmentConsumption.detail.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    },
    pageTotalQty() {
      return (this.tableData || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.tableData || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    }
  },
  mounted() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
    this.initDeptConsumeLayout();
  },
  methods: {
    stampRowKeys(rows) {
      const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
      return (rows || []).map((row, idx) => {
        if (row && !row._rowKey) {
          row._rowKey = `dept-consume-detail-${pageBase + idx}-${row.billNo || ''}-${row.materialCode || ''}-${idx}`;
        }
        return row;
      });
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
        url: "/department/batchConsume/auditedDetailList",
        method: "get",
        params: this.buildRequestParams()
      })
        .then(response => {
          if (response && (response.code === 200 || response.code === undefined)) {
            this.tableData = this.stampRowKeys(response.rows || response.data?.rows || []);
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
          this.selectedRowKeys = [];
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
        })
        .catch(error => {
          this.$modal.msgError("查询失败：" + (error.msg || error.message || "未知错误"));
          this.tableData = [];
          this.total = 0;
          this.totalInfo = { totalQty: 0, totalAmt: 0 };
          this.selectedRowKeys = [];
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
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
        const beginDate = this.searchForm.beginDate || "";
        const endDate = this.searchForm.endDate || beginDate;
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

<style src="./styles/deptConsumeLayout.css"></style>
<style scoped src="./styles/deptConsumeLayoutScoped.css"></style>
