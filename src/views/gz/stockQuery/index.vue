<template>
  <div class="app-container out-warehouse-query-page gz-stock-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="备货入/退货表" name="inbound"></el-tab-pane>
      <el-tab-pane label="备货出/退库表" name="outbound"></el-tab-pane>
      <el-tab-pane label="跟台表" name="follow"></el-tab-pane>
    </el-tabs>

    <div class="app-container list-page first-inventory-page gz-stock-query">
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
              :class="(t === 'warehouse' || t === 'department') ? 'more-search-field--select' : 'more-search-field--text'"
            >
              <template v-if="t === 'warehouse'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" placeholder="仓库" />
                </div>
              </template>
              <template v-else-if="t === 'department'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectDepartment v-model="queryParams.departmentId" fieldPlaceholder="科室" />
                </div>
              </template>
              <el-input
                v-else
                v-model="queryParams[t]"
                :placeholder="moreSearchPlaceholderFor(t)"
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
              <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
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
              <el-form-item prop="orderStatus" class="query-item-inline">
                <el-select v-model="queryParams.orderStatus" placeholder="单据状态" clearable class="more-search-short-select">
                  <el-option
                    v-for="dict in dict.type.biz_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
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
            v-hasPermi="['gz:stockQuery:export']"
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

      <InboundRefundTable
        v-if="activeName === 'inbound'"
        ref="inboundTable"
        class="gz-stock-tab-panel"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <OutboundRefundTable
        v-if="activeName === 'outbound'"
        ref="outboundTable"
        class="gz-stock-tab-panel"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <FollowTable
        v-if="activeName === 'follow'"
        ref="followTable"
        class="gz-stock-tab-panel"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
    </div>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplierDept";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import RightToolbar from "@/components/RightToolbar";
import InboundRefundTable from "./components/InboundRefundTable.vue";
import OutboundRefundTable from "./components/OutboundRefundTable.vue";
import FollowTable from "./components/FollowTable.vue";
import { parseTime } from "@/utils/ruoyi";

function createDefaultBeginDate() {
  const date = new Date();
  date.setDate(date.getDate() - 5);
  return parseTime(date, '{y}-{m}-{d}');
}

function createDefaultEndDate() {
  return parseTime(new Date(), '{y}-{m}-{d}');
}

export default {
  name: "StockQuery",
  dicts: ['biz_status'],
  components: {
    SelectWarehouse,
    SelectSupplier,
    SelectDepartment,
    RightToolbar,
    InboundRefundTable,
    OutboundRefundTable,
    FollowTable
  },
  data() {
    return {
      activeName: 'inbound',
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "warehouse", label: "仓库" },
        { value: "materialKeyword", label: "产品" },
        { value: "inHospitalCode", label: "院内码" },
        { value: "orderNo", label: "单号" },
        { value: "department", label: "科室" }
      ],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialKeyword: null,
        inHospitalCode: null,
        warehouseId: null,
        supplierId: null,
        departmentId: null,
        orderNo: null,
        orderStatus: null,
        beginDate: createDefaultBeginDate(),
        endDate: createDefaultEndDate()
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.gz.stockQuery.moreSearchTypes";
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
    moreSearchPlaceholderFor(t) {
      const map = {
        materialKeyword: "产品编码/名称/规格/型号",
        inHospitalCode: "院内码",
        orderNo: this.activeName === "outbound" ? "出库/退库单号" : "单号"
      };
      return map[t] || "请输入";
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
      if (!set.has("warehouse")) target.warehouseId = null;
      if (!set.has("department")) target.departmentId = null;
      if (!set.has("materialKeyword")) target.materialKeyword = null;
      if (!set.has("inHospitalCode")) target.inHospitalCode = null;
      if (!set.has("orderNo")) target.orderNo = null;
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
    initDefaultDateRange() {
      this.queryParams.beginDate = createDefaultBeginDate();
      this.queryParams.endDate = createDefaultEndDate();
    },
    handleQuery() {
      this.applyMoreSearchToQueryParams(this.queryParams);
      this.queryParams.pageNum = 1;
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.materialKeyword = null;
      this.queryParams.inHospitalCode = null;
      this.queryParams.warehouseId = null;
      this.queryParams.supplierId = null;
      this.queryParams.departmentId = null;
      this.queryParams.orderNo = null;
      this.queryParams.orderStatus = null;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.initDefaultDateRange();
      this.queryParams.pageNum = 1;
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    activeTableRef() {
      if (this.activeName === 'outbound') return this.$refs.outboundTable;
      if (this.activeName === 'follow') return this.$refs.followTable;
      return this.$refs.inboundTable;
    },
    refreshActiveTableHeight() {
      const ref = this.activeTableRef();
      if (ref && typeof ref.updateTableHeight === 'function') {
        ref.updateTableHeight();
      }
    },
    handleTabClick() {
      this.resetQuery();
      this.$nextTick(() => {
        this.refreshActiveTableHeight();
        setTimeout(() => this.refreshActiveTableHeight(), 80);
      });
    },
    handleExport() {
      const exportUrl = this.activeName === 'inbound' ? 'gzOrder/export'
        : this.activeName === 'outbound' ? 'gzShipment/export'
          : 'gzFollow/export';
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      this.download(exportUrl, {
        ...params,
        orderType: this.activeName === 'inbound' ? 101 : this.activeName === 'outbound' ? 102 : null
      }, `备货查询_${this.activeName === 'inbound' ? '入退货表' : this.activeName === 'outbound' ? '出退库表' : '跟台表'}_${new Date().getTime()}.xlsx`);
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

.app-container.first-inventory-page.gz-stock-query {
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

.gz-stock-query .pagination-wrapper {
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
.gz-stock-query .pagination-wrapper .pagination-container {
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
.gz-stock-query .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.gz-stock-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.gz-stock-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.gz-stock-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
}
.gz-stock-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.gz-stock-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
}

.gz-stock-query .gz-stock-main-table .el-table__header-wrapper th,
.gz-stock-query .gz-stock-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.gz-stock-query .gz-stock-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.gz-stock-query .gz-stock-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.gz-stock-query .gz-stock-main-table .el-table__body tr.gz-stock-row-selected > td {
  background-color: #B8DAFF !important;
}
.gz-stock-query .gz-stock-main-table .el-table__body tr.gz-stock-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
</style>

<style scoped>
.app-container.gz-stock-query-page {
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
.gz-stock-query-page >>> .app-container.first-inventory-page {
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
.more-search-short-select {
  width: 140px;
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

.gz-stock-tab-panel {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
</style>
