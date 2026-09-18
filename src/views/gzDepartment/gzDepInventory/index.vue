<template>
  <div class="app-container out-warehouse-query-page gz-dep-inventory-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
    </el-tabs>

    <div class="app-container list-page first-inventory-page gz-dep-inv-query">
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
                placeholder="收费项目ID"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
              <el-input
                v-else-if="t === 'batchNo'"
                v-model="queryParams.batchNo"
                placeholder="批次号"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
              <el-input
                v-else-if="t === 'inHospitalCode'"
                v-model="queryParams.inHospitalCode"
                placeholder="院内码模糊"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
              <el-input
                v-else-if="t === 'masterBarcode'"
                v-model="queryParams.masterBarcode"
                placeholder="主条码模糊"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
              <el-input
                v-else-if="t === 'secondaryBarcode'"
                v-model="queryParams.secondaryBarcode"
                placeholder="辅条码模糊"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
              <el-input
                v-else
                v-model="queryParams.materialKeyword"
                placeholder="产品编码/名称/简码"
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
              <el-form-item label="批号" prop="materialNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.materialNo"
                  placeholder="批号"
                  clearable
                  class="query-input-batch"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="生产日期" prop="materialDate" class="query-item-inline">
                <el-date-picker
                  v-model="queryParams.materialDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="生产日期"
                  clearable
                  class="query-date-picker"
                />
              </el-form-item>
              <el-form-item label="入库日期" prop="warehouseDate" class="query-item-inline">
                <el-date-picker
                  v-model="queryParams.warehouseDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="入库日期"
                  clearable
                  class="query-date-picker"
                />
              </el-form-item>
              <el-form-item class="query-item-inline query-item-switch">
                <el-switch
                  v-model="queryParams.showZeroStock"
                  active-text="显示"
                  inactive-text="隐藏"
                  @change="handleQuery"
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
          <el-button
            type="warning"
            size="small"
            icon="el-icon-download"
            class="spd-btn"
            @click="handleExport"
            v-hasPermi="['gzDepartment:gzDepInventory:export']"
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

      <GzDepInventoryDetail
        v-if="activeName === 'detail'"
        ref="detailTable"
        class="gz-dep-tab-panel"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <GzDepInventorySummary
        v-if="activeName === 'summary'"
        ref="summaryTable"
        class="gz-dep-tab-panel"
        :query-params="queryParams"
      />
    </div>
  </div>
</template>

<script>
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplierDept";
import RightToolbar from "@/components/RightToolbar";
import GzDepInventoryDetail from "./components/GzDepInventoryDetail.vue";
import GzDepInventorySummary from "./components/GzDepInventorySummary.vue";
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory";
import {
  buildGzDepInventorySummaryRows,
  exportGzDepInventoryDetailStyledXlsx,
  exportGzDepInventorySummaryStyledXlsx,
} from "@/utils/departmentOutSummaryExport";

export default {
  name: "GzDepInventory",
  components: {
    SelectDepartment,
    SelectSupplier,
    RightToolbar,
    GzDepInventoryDetail,
    GzDepInventorySummary
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
        { label: "产品", value: "materialKeyword" },
        { label: "科室", value: "department" },
        { label: "收费项目ID", value: "hisChargeItemId" },
        { label: "批次号", value: "batchNo" },
        { label: "院内码", value: "inHospitalCode" },
        { label: "主条码", value: "masterBarcode" },
        { label: "辅条码", value: "secondaryBarcode" }
      ],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialKeyword: null,
        departmentId: null,
        supplierId: null,
        batchNo: null,
        inHospitalCode: null,
        masterBarcode: null,
        secondaryBarcode: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null,
        showZeroStock: false,
        hisChargeItemId: null
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.gzDepartment.gzDepInventory.moreSearchTypes";
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
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.refreshActiveTable();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.supplierId = null;
      this.queryParams.departmentId = null;
      this.queryParams.materialKeyword = null;
      this.queryParams.batchNo = null;
      this.queryParams.inHospitalCode = null;
      this.queryParams.masterBarcode = null;
      this.queryParams.secondaryBarcode = null;
      this.queryParams.materialNo = null;
      this.queryParams.materialDate = null;
      this.queryParams.warehouseDate = null;
      this.queryParams.hisChargeItemId = null;
      this.queryParams.pageNum = 1;
      this.queryParams.showZeroStock = false;
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
        materialKeyword: 'materialKeyword',
        department: 'departmentId',
        hisChargeItemId: 'hisChargeItemId',
        batchNo: 'batchNo',
        inHospitalCode: 'inHospitalCode',
        masterBarcode: 'masterBarcode',
        secondaryBarcode: 'secondaryBarcode'
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
    buildListQuery() {
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      const kw = params.materialKeyword != null ? String(params.materialKeyword).trim() : '';
      params.materialKeyword = kw || null;
      const code = params.inHospitalCode != null ? String(params.inHospitalCode).trim() : '';
      params.inHospitalCode = code || null;
      const master = params.masterBarcode != null ? String(params.masterBarcode).trim() : '';
      params.masterBarcode = master || null;
      const secondary = params.secondaryBarcode != null ? String(params.secondaryBarcode).trim() : '';
      params.secondaryBarcode = secondary || null;
      return params;
    },
    async handleExport() {
      const requestParams = {
        ...this.buildListQuery(),
        pageNum: 1,
        pageSize: 10000,
      };
      const loading = this.$loading({ lock: true, text: '正在导出...', spinner: 'el-icon-loading' });
      try {
        const response = await listGzDepInventory(requestParams);
        const detailList = response.rows || [];
        if (!detailList.length) {
          this.$message && this.$message.warning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        if (this.activeName === 'summary') {
          const summaryRows = buildGzDepInventorySummaryRows(detailList);
          if (!summaryRows.length) {
            this.$message && this.$message.warning('暂无数据可导出');
            return;
          }
          await exportGzDepInventorySummaryStyledXlsx({
            rows: summaryRows,
            fileName: `高值科室库存汇总查询表${dateStr}.xlsx`,
          });
        } else {
          await exportGzDepInventoryDetailStyledXlsx({
            rows: detailList,
            fileName: `高值科室库存明细查询表${dateStr}.xlsx`,
          });
        }
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      } finally {
        loading.close();
      }
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

.app-container.first-inventory-page.gz-dep-inv-query {
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

.gz-dep-inv-query .pagination-wrapper {
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
.gz-dep-inv-query .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gz-dep-inv-query .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.gz-dep-inv-query .pagination-wrapper .pagination-container {
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
.gz-dep-inv-query .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.gz-dep-inv-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.gz-dep-inv-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.gz-dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
}
.gz-dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.gz-dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
}

.gz-dep-inv-query .gz-dep-main-table .el-table__header-wrapper th,
.gz-dep-inv-query .gz-dep-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.gz-dep-inv-query .gz-dep-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.gz-dep-inv-query .gz-dep-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.gz-dep-inv-query .gz-dep-main-table .el-table__body tr.gz-dep-row-selected > td {
  background-color: #B8DAFF !important;
}
.gz-dep-inv-query .gz-dep-main-table .el-table__body tr.gz-dep-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
</style>

<style scoped>
.app-container.gz-dep-inventory-page {
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
.gz-dep-inventory-page >>> .app-container.first-inventory-page {
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
.query-input-batch {
  width: 150px;
}
.query-date-picker {
  width: 150px;
}
.query-item-switch .el-form-item__content {
  min-height: 32px;
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

.gz-dep-tab-panel {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
</style>
