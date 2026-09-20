<template>
  <div class="app-container list-page first-inventory-page dep-inv-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div class="more-search-dynamic-field more-search-field--select">
            <div class="query-select-wrapper more-search-select-wrap">
              <SelectSupplier v-model="queryParams.supplierId" />
            </div>
          </div>
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'department'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </template>
            <el-input
              v-else-if="t === 'hisChargeItemId'"
              v-model="queryParams.hisChargeItemId"
              placeholder="收费项目ID模糊"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="queryParams.materialKeyword"
              placeholder="产品名称/编码"
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
            <el-form-item label="产品档案" prop="materialIsUse" class="query-item-inline">
              <el-select v-model="queryParams.materialIsUse" placeholder="启停用" clearable class="query-select-wrapper">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range query-item-period-range">
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
        class="dep-inv-main-table"
        v-loading="loading"
        :data="summaryList"
        :height="tableHeight"
        :row-key="getDetailRowKey"
        :row-class-name="depInvRowClassName"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleDetailRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="dep-select-col col-serial-center" />
        <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode"/>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" />
        <el-table-column
          v-for="col in hisChargeItemColumnDefs"
          :key="'his-charge-' + col.key"
          :label="col.label"
          :width="col.width"
          align="left"
          header-align="center"
          class-name="ctk-col-left"
          show-overflow-tooltip
          resizable
        >
          <template slot-scope="scope">
            <span>{{ col.text(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" prop="specification" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci"/>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" prop="model" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByModel"/>
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" prop="unit" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByUnit"/>
        <el-table-column label="科室编码" align="left" header-align="center" class-name="ctk-col-left" prop="departmentCode" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByDepartmentCode"/>
        <el-table-column label="科室" align="left" header-align="center" class-name="ctk-col-left" prop="departmentName" width="160" min-width="140" show-overflow-tooltip resizable sortable :sort-method="sortByDepartment"/>
        <el-table-column label="单价" align="center" prop="avgUnitPrice" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice">
          <template slot-scope="scope">
            <span v-if="scope.row.avgUnitPrice">{{ scope.row.avgUnitPrice | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" align="center" prop="totalQty" min-width="130" width="130" show-overflow-tooltip resizable sortable :sort-method="sortByTotalQty">
          <template slot-scope="scope">
            <span v-if="scope.row.totalQty != null">{{ scope.row.totalQty }}</span>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="库存金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="生产厂家" align="left" header-align="center" class-name="ctk-col-left" prop="factoryName" min-width="180" width="200" show-overflow-tooltip resizable />
        <el-table-column label="供应商" align="left" header-align="center" class-name="ctk-col-left" prop="supplierName" width="160" show-overflow-tooltip resizable />
        <el-table-column label="计费" align="center" prop="isBilling" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.isBilling === '1' || scope.row.isBilling === 1">是</span>
            <span v-else-if="scope.row.isBilling === '0' || scope.row.isBilling === 0 || scope.row.isBilling === '2'">否</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="产品档案状态" align="center" prop="materialIsUse" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ materialUseDictLabel(scope.row.materialIsUse) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证号" align="left" header-align="center" class-name="ctk-col-left" prop="registerNo" width="180" show-overflow-tooltip resizable />
        <el-table-column label="注册证有效期" align="center" prop="periodDate" width="130" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.periodDate">{{ parseTime(scope.row.periodDate, '{y}-{m}-{d}') }}</span>
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
import { listInventorySummary } from "@/api/department/depInventory";
import { exportDepInventorySummaryStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplierDept";
import RightToolbar from "@/components/RightToolbar";
import hisChargeItemTableColumnsMixin from "@/mixins/hisChargeItemTableColumns";

export default {
  name: "InventorySummary",
  dicts: ['is_use_status'],
  mixins: [hisChargeItemTableColumnsMixin],
  components: { SelectDepartment, SelectSupplier, RightToolbar },
  data() {
    return {
      hisChargeFlatRow: true,
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "耗材", value: "materialKeyword" },
        { label: "收费项目ID", value: "hisChargeItemId" },
        { label: "科室", value: "department" }
      ],
      selectedRowKeys: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      tableHeight: 400,
      total: 0,
      summaryList: [],
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialKeyword: '',
        hisChargeItemId: null,
        departmentId: null,
        warehouseId: null,
        supplierId: null,
        materialIsUse: '',
        beginDate: null,
        endDate: null
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.department.depInventory.summary.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    },
    pageTotalQty() {
      return (this.summaryList || []).reduce((s, r) => s + Number(r.totalQty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.summaryList || []).reduce((s, r) => s + Number(r.totalAmount || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    }
  },
  mounted() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
    this.$nextTick(() => {
      this.updateTableHeight();
      setTimeout(() => this.updateTableHeight(), 80);
    });
    window.addEventListener('resize', this.updateTableHeight);
  },
  activated() {
    this.$nextTick(() => this.updateTableHeight());
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
    this.clearToolbarMoreCloseTimer();
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateTableHeight());
    }
  },
  methods: {
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        const h = Math.floor(panel.clientHeight);
        if (h > 120) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.reportTable && this.$refs.reportTable.doLayout) {
              this.$refs.reportTable.doLayout();
            }
          });
        }
      });
    },
    getDetailRowKey(row) {
      return (row && row._rowKey) || '';
    },
    depInvRowClassName({ row }) {
      const key = this.getDetailRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'dep-row-selected';
      }
      return '';
    },
    handleSelectionChange(selection) {
      this.selectedRowKeys = (selection || []).map(row => this.getDetailRowKey(row));
    },
    handleDetailRowDblclick(row) {
      const table = this.$refs.reportTable;
      if (!table || !row) return;
      const key = this.getDetailRowKey(row);
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || [];
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getDetailRowKey(r) === key)
      ));
      table.toggleRowSelection(row, !selected);
    },
    saveMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.saveDefaults === 'function') {
        bar.saveDefaults();
      }
    },
    clearToolbarMoreCloseTimer() {
      if (this.toolbarMoreCloseTimer) {
        clearTimeout(this.toolbarMoreCloseTimer);
        this.toolbarMoreCloseTimer = null;
      }
    },
    setToolbarMoreVisible(visible) {
      const sel = this.$refs.toolbarMoreSelect;
      if (!sel) return;
      if (sel.visible === visible) return;
      sel.visible = visible;
      if (!visible && typeof sel.blur === 'function') {
        sel.blur();
      }
    },
    onToolbarMoreEnter() {
      this.toolbarMoreHover = true;
      this.clearToolbarMoreCloseTimer();
      this.setToolbarMoreVisible(true);
    },
    onToolbarMoreLeave() {
      this.toolbarMoreHover = false;
      this.clearToolbarMoreCloseTimer();
      this.toolbarMoreCloseTimer = setTimeout(() => {
        if (!this.toolbarMoreHover) {
          this.setToolbarMoreVisible(false);
        }
      }, 280);
    },
    onToolbarMoreVisibleChange(visible) {
      if (!visible) {
        this.toolbarMoreHover = false;
      }
    },
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByNum(a, b, prop) {
      const va = Number(a[prop]);
      const vb = Number(b[prop]);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortByMaterialCode(a, b) { return this.sortByStr(a, b, r => r.materialCode || ''); },
    sortByMaterialName(a, b) { return this.sortByStr(a, b, r => r.materialName || ''); },
    sortBySpeci(a, b) { return this.sortByStr(a, b, r => r.specification || ''); },
    sortByModel(a, b) { return this.sortByStr(a, b, r => r.model || ''); },
    sortByUnit(a, b) { return this.sortByStr(a, b, r => r.unit || ''); },
    sortByDepartment(a, b) { return this.sortByStr(a, b, r => r.departmentName || ''); },
    sortByDepartmentCode(a, b) { return this.sortByStr(a, b, r => r.departmentCode || ''); },
    sortByUnitPrice(a, b) { return this.sortByNum(a, b, 'avgUnitPrice'); },
    sortByTotalQty(a, b) { return this.sortByNum(a, b, 'totalQty'); },
    getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(queryParams);
      listInventorySummary(queryParams).then(response => {
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        this.summaryList = (response.rows || []).map((row, idx) => {
          if (row && !row._rowKey) {
            row._rowKey = `dep-sum-${pageBase + idx}-${row.materialCode || ''}-${row.departmentCode || ''}-${idx}`;
          }
          return row;
        });
        this.total = response.total != null ? response.total : 0;
        this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      }).catch(() => {
        this.summaryList = [];
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
      this.queryParams.supplierId = null;
      this.queryParams.materialIsUse = '';
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
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
        const loaded = bar.loadDefaults();
        return (loaded || []).filter(v => v !== 'supplier');
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v) && v !== 'supplier');
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      const map = {
        materialKeyword: 'materialKeyword',
        hisChargeItemId: 'hisChargeItemId',
        department: 'departmentId'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 };
      this.applyMoreSearchToQueryParams(requestParams);
      this.loading = true;
      try {
        const response = await listInventorySummary(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDepInventorySummaryStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室库存汇总查询表${dateStr}.xlsx`,
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
    },
    materialUseDictLabel(isUse) {
      if (isUse === undefined || isUse === null || isUse === '') return '--';
      const label = this.selectDictLabel(this.dict.type.is_use_status, String(isUse));
      return label || '--';
    }
  }
};
</script>

<style>
.app-container.first-inventory-page {
  padding-top: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  flex: 0 0 auto !important;
  gap: 12px !important;
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding: 4px 0 6px !important;
  min-height: 40px !important;
  overflow: visible !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 32px !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  margin-left: auto !important;
  padding: 0 4px !important;
  flex: 0 0 auto !important;
  overflow: visible !important;
  background: transparent !important;
}
.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.dep-inv-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
}
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
}
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 160px !important;
}

.first-inventory-page .dep-inv-main-table .el-table__header-wrapper th,
.first-inventory-page .dep-inv-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .dep-inv-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}

.first-inventory-page .dep-inv-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected:hover > td {
  background-color: #A0CBFF !important;
}

.first-inventory-page .dep-inv-main-table th.dep-select-col,
.first-inventory-page .dep-inv-main-table td.dep-select-col,
.first-inventory-page .dep-inv-main-table th.el-table-column--selection,
.first-inventory-page .dep-inv-main-table td.el-table-column--selection {
  position: sticky;
  left: 0;
  z-index: 2;
  box-shadow: 2px 0 0 0 #e2e8f0;
}
.first-inventory-page .dep-inv-main-table th.dep-select-col,
.first-inventory-page .dep-inv-main-table th.el-table-column--selection {
  z-index: 3;
  background-color: #f1f5f9;
}
.first-inventory-page .dep-inv-main-table td.dep-select-col,
.first-inventory-page .dep-inv-main-table td.el-table-column--selection {
  background-color: #fff;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.el-table__row--striped td.dep-select-col,
.first-inventory-page .dep-inv-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr:hover > td.dep-select-col,
.first-inventory-page .dep-inv-main-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected > td.dep-select-col,
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected:hover > td.dep-select-col,
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF;
}
.first-inventory-page .dep-inv-main-table td.dep-select-col .cell,
.first-inventory-page .dep-inv-main-table td.el-table-column--selection .cell,
.first-inventory-page .dep-inv-main-table th.dep-select-col .cell,
.first-inventory-page .dep-inv-main-table th.el-table-column--selection .cell {
  text-align: center !important;
  justify-content: center !important;
  background: transparent;
}
</style>

<style scoped>
.app-container {
  margin-top: 0;
  padding-top: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
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

.more-search-dynamic-field {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  height: 32px;
}
.more-search-label {
  color: #606266;
  font-size: 12px;
  line-height: 32px;
  white-space: nowrap;
}
.more-search-input--dynamic {
  width: 180px;
}

.ctk-query-top-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.ctk-more-search-bar--hidden {
  display: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

.query-row-second {
  margin-top: 0;
  margin-bottom: 0;
}

.query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding-bottom: 0;
}

.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 0;
  white-space: nowrap;
}

.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.ctk-query-actions {
  margin-left: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.query-item-period-range.el-form-item .el-form-item__label {
  width: 110px !important;
}

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 138px;
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
  margin-bottom: 4px;
  margin-top: 0;
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
}

.ctk-list-toolbar.list-toolbar {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  flex: 0 0 auto;
  flex-wrap: nowrap !important;
  align-items: center !important;
}
.ctk-list-toolbar .list-toolbar-right {
  flex-wrap: nowrap !important;
  flex-shrink: 0;
}

.table-container {
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  min-height: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
  flex: 1 1 auto;
}

.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 4px 6px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 6px !important;
}

.table-container ::v-deep .el-table thead th.el-table__cell > .cell,
.table-container ::v-deep .el-table tbody td.el-table__cell > .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 23px;
  word-break: normal;
}

.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}

.table-container ::v-deep .el-table th.ctk-col-left .cell {
  text-align: center !important;
}
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
}

.table-container ::v-deep .el-table th.col-serial-center .cell,
.table-container ::v-deep .el-table td.col-serial-center .cell {
  text-align: center !important;
  justify-content: center;
}

.table-container ::v-deep .col-serial-center-text {
  display: block;
  width: 100%;
  text-align: center;
}
</style>
