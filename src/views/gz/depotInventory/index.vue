<template>
  <div class="app-container out-warehouse-query-page gz-depot-inventory-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
    </el-tabs>

    <div class="app-container list-page first-inventory-page gz-depot-inv-query">
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
              <template v-if="t === 'warehouse'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" placeholder="仓库" />
                </div>
              </template>
              <el-input
                v-else-if="t === 'orderNo'"
                v-model="queryParams.orderNo"
                placeholder="单号"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
              <el-input
                v-else-if="t === 'hisChargeItemId'"
                v-model="queryParams.hisChargeItemId"
                placeholder="收费编码"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
              <el-input
                v-else-if="t === 'inHospitalCode'"
                v-model="queryParams.inHospitalCode"
                placeholder="院内码"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
              <el-input
                v-else
                v-model="queryParams.materialKeyword"
                placeholder="产品编码/名称"
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
              <el-form-item label="日期" class="query-item-inline query-item-date-range">
                <el-date-picker
                  v-model="queryParams.beginDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="起始日期"
                  clearable
                  class="query-date-picker query-date-start"
                />
                <span class="query-date-sep">至</span>
                <el-date-picker
                  v-model="queryParams.endDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="截止日期"
                  clearable
                  class="query-date-picker query-date-end"
                />
              </el-form-item>
              <el-form-item class="query-item-inline query-item-zero-stock">
                <el-button
                  size="small"
                  :class="showZeroStock ? 'spd-btn spd-btn--primary' : 'spd-btn spd-btn--secondary'"
                  :type="showZeroStock ? 'primary' : 'default'"
                  @click="toggleShowZeroStock"
                >零库存</el-button>
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
          <el-button
            type="warning"
            size="small"
            icon="el-icon-download"
            class="spd-btn"
            @click="handleExport"
            v-hasPermi="['gz:depotInventory:export']"
          >导出</el-button>
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
          <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
        </div>
      </el-row>

      <DepotInventoryDetail
        v-if="activeName === 'detail'"
        ref="detailTable"
        class="gz-depot-tab-panel"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <DepotInventorySummary
        v-if="activeName === 'summary'"
        ref="summaryTable"
        class="gz-depot-tab-panel"
        :query-params="queryParams"
      />
    </div>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplierDept";
import RightToolbar from "@/components/RightToolbar";
import DepotInventoryDetail from "./components/DepotInventoryDetail.vue";
import DepotInventorySummary from "./components/DepotInventorySummary.vue";
import { listDepotInventory } from "@/api/gz/depotInventory";
import {
  buildGzDepotInventorySummaryRows,
  exportGzDepotInventoryDetailStyledXlsx,
  exportGzDepotInventorySummaryStyledXlsx,
} from "@/utils/departmentOutSummaryExport";
import { buildDepotInventoryQueryParams } from "./depotInventoryQuery";

export default {
  name: "DepotInventory",
  components: {
    SelectWarehouse,
    SelectSupplier,
    RightToolbar,
    DepotInventoryDetail,
    DepotInventorySummary
  },
  data() {
    return {
      activeName: 'detail',
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "仓库", value: "warehouse" },
        { label: "单号", value: "orderNo" },
        { label: "收费编码", value: "hisChargeItemId" },
        { label: "产品", value: "materialKeyword" },
        { label: "院内码", value: "inHospitalCode" }
      ],
      showZeroStock: false,
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        warehouseId: null,
        warehouseName: null,
        materialKeyword: null,
        supplierId: null,
        orderNo: null,
        inHospitalCode: null,
        beginDate: null,
        endDate: null,
        hisChargeItemId: null,
        includeZeroQty: null
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.gz.depotInventory.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return [];
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.refreshActiveTableHeight());
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.initDefaultDateRange();
  },
  activated() {
    document.body.classList.add('inventory-query-fixed');
    this.$nextTick(() => this.refreshActiveTableHeight());
  },
  deactivated() {
    document.body.classList.remove('inventory-query-fixed');
  },
  mounted() {
    document.body.classList.add('inventory-query-fixed');
    this.$nextTick(() => this.refreshActiveTableHeight());
  },
  beforeDestroy() {
    document.body.classList.remove('inventory-query-fixed');
    this.clearToolbarMoreCloseTimer();
  },
  methods: {
    formatQueryDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    initDefaultDateRange() {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 5);
      this.queryParams.beginDate = this.formatQueryDate(start);
      this.queryParams.endDate = this.formatQueryDate(end);
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.refreshActiveTable();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.showZeroStock = false;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.warehouseName = null;
      this.queryParams.materialKeyword = null;
      this.queryParams.orderNo = null;
      this.queryParams.inHospitalCode = null;
      this.queryParams.hisChargeItemId = null;
      this.queryParams.includeZeroQty = null;
      this.initDefaultDateRange();
      this.queryParams.pageNum = 1;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    toggleShowZeroStock() {
      this.showZeroStock = !this.showZeroStock;
      this.queryParams.includeZeroQty = this.showZeroStock ? true : null;
      this.handleQuery();
    },
    handleTabClick(tab) {
      this.$nextTick(() => {
        if (tab.name === 'summary' && this.$refs.summaryTable && typeof this.$refs.summaryTable.getList === 'function') {
          this.$refs.summaryTable.getList();
        } else if (tab.name === 'detail' && this.$refs.detailTable && typeof this.$refs.detailTable.getList === 'function') {
          this.$refs.detailTable.getList();
        }
        this.refreshActiveTableHeight();
        setTimeout(() => this.refreshActiveTableHeight(), 80);
      });
    },
    refreshActiveTable() {
      const ref = this.activeName === 'summary' ? this.$refs.summaryTable : this.$refs.detailTable;
      if (ref && typeof ref.getList === 'function') {
        ref.getList();
      }
    },
    refreshActiveTableHeight() {
      const ref = this.activeName === 'summary' ? this.$refs.summaryTable : this.$refs.detailTable;
      if (ref && typeof ref.updateTableHeight === 'function') {
        ref.updateTableHeight();
      }
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    async handleExport() {
      const form = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(form);
      const requestParams = buildDepotInventoryQueryParams(form, {
        pageNum: 1,
        pageSize: 10000,
      });
      const loading = this.$loading({ lock: true, text: '正在导出...', spinner: 'el-icon-loading' });
      try {
        const response = await listDepotInventory(requestParams);
        const detailList = response.rows || [];
        if (!detailList.length) {
          this.$message && this.$message.warning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const exportOpts = {
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
        };
        if (this.activeName === 'summary') {
          const summaryRows = buildGzDepotInventorySummaryRows(detailList);
          if (!summaryRows.length) {
            this.$message && this.$message.warning('暂无数据可导出');
            return;
          }
          await exportGzDepotInventorySummaryStyledXlsx({
            ...exportOpts,
            rows: summaryRows,
            fileName: `高值仓库库存汇总查询表${dateStr}.xlsx`,
          });
        } else {
          await exportGzDepotInventoryDetailStyledXlsx({
            ...exportOpts,
            rows: detailList,
            fileName: `高值仓库库存明细查询表${dateStr}.xlsx`,
          });
        }
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      } finally {
        loading.close();
      }
    },
    moreSearchFieldClass(t) {
      if (t === 'warehouse') {
        return 'more-search-field--select';
      }
      return 'more-search-field--text';
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
        warehouse: 'warehouseId',
        orderNo: 'orderNo',
        hisChargeItemId: 'hisChargeItemId',
        materialKeyword: 'materialKeyword',
        inHospitalCode: 'inHospitalCode'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange(val) {
      const allow = new Set(this.moreSearchOptions.map(o => o.value));
      const cleaned = (val || this.moreSearchTypes || []).filter(v => allow.has(v) && v !== 'supplier');
      if (cleaned.length !== (this.moreSearchTypes || []).length) {
        this.moreSearchTypes = cleaned;
      }
      this.applyMoreSearchToQueryParams(this.queryParams);
      this.$nextTick(() => this.refreshActiveTableHeight());
    }
  }
};
</script>

<style>
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}

.app-container.first-inventory-page.gz-depot-inv-query {
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

.gz-depot-inv-query .pagination-wrapper {
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
.gz-depot-inv-query .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gz-depot-inv-query .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.gz-depot-inv-query .pagination-wrapper .pagination-container {
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
.gz-depot-inv-query .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.gz-depot-inv-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.gz-depot-inv-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.gz-depot-inv-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
}
.gz-depot-inv-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.gz-depot-inv-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
}
.gz-depot-inv-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 160px !important;
}

.gz-depot-inv-query .gz-depot-main-table .el-table__header-wrapper th,
.gz-depot-inv-query .gz-depot-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.gz-depot-inv-query .gz-depot-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.gz-depot-inv-query .gz-depot-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.gz-depot-inv-query .gz-depot-main-table .el-table__body tr.gz-depot-row-selected > td {
  background-color: #B8DAFF !important;
}
.gz-depot-inv-query .gz-depot-main-table .el-table__body tr.gz-depot-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
</style>

<style scoped>
.app-container.gz-depot-inventory-page {
  display: flex !important;
  flex-direction: column !important;
  padding-top: 4px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 4px !important;
  height: calc(100vh - 92px) !important;
  max-height: calc(100vh - 92px) !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  min-height: 0 !important;
}
.inventory-tabs-compact {
  flex: 0 0 auto;
  margin-top: 0;
  margin-bottom: 0;
}
.inventory-tabs-compact >>> .el-tabs__header {
  margin: 0 0 4px !important;
}
.inventory-tabs-compact >>> .el-tabs__nav-wrap {
  margin-bottom: 0;
}
.gz-depot-inventory-page >>> .app-container.first-inventory-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  margin-top: 0;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
}
.query-item-inline .el-form-item__label {
  width: 80px !important;
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
.query-select-wrapper {
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
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-more-search {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.gz-depot-tab-panel {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
</style>
