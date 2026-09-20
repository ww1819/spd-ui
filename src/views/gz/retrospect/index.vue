<template>
  <div class="app-container out-warehouse-query-page gz-retrospect-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="使用追溯明细表" name="detail"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(执行科室)" name="execDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(开单科室)" name="applyDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(供应商)" name="supplier"></el-tab-pane>
      <el-tab-pane label="高值耗材使用情况报表" name="usageReport"></el-tab-pane>
    </el-tabs>

    <div class="app-container list-page first-inventory-page gz-retrospect-query">
      <div class="form-fields-container list-query-panel" v-show="showSearch">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
          <div class="ctk-query-top-fields">
            <div class="more-search-dynamic-field more-search-field--select">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectSupplier
                  v-model="queryParams.supplierId"
                  :keyword.sync="queryParams.supplierKeyword"
                  allow-keyword-blur
                  placeholder="供应商编码/名称/简码搜索"
                />
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
                  <SelectWarehouse
                    v-model="queryParams.warehouseId"
                    includeWarehouseType="高值"
                    placeholder="仓库编码/名称/简码搜索"
                  />
                </div>
              </template>
              <template v-else-if="t === 'factoryId'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectFactory v-model="queryParams.factoryId" placeholder="厂家名称/编码/简码搜索" />
                </div>
              </template>
              <el-input
                v-else
                v-model="queryParams[t]"
                :placeholder="moreSearchPlaceholderFor(t)"
                clearable
                class="more-search-input more-search-input--dynamic"
                @input="val => onMoreSearchInput(t, val)"
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
                  v-model="queryParams.startDate"
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
                <el-select v-model="queryParams.orderStatus" placeholder="状态" clearable class="more-search-short-select">
                  <el-option label="已审核" :value="2" />
                  <el-option label="未审核" :value="1" />
                </el-select>
              </el-form-item>
              <el-form-item prop="isBilling" class="query-item-inline">
                <el-select v-model="queryParams.isBilling" placeholder="计费" clearable class="more-search-short-select">
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'billing-' + dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item prop="isProcure" class="query-item-inline">
                <el-select v-model="queryParams.isProcure" placeholder="集采" clearable class="more-search-short-select">
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'procure-' + dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item prop="isMonitor" class="query-item-inline">
                <el-select v-model="queryParams.isMonitor" placeholder="重点耗材" clearable class="more-search-short-select">
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'monitor-' + dict.value"
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
            v-hasPermi="['gz:retrospect:export']"
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

      <UseTraceDetail
        v-if="activeName === 'detail'"
        ref="detailTable"
        class="gz-retrospect-tab-panel"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <UseTraceSummaryExecDept
        v-if="activeName === 'execDept'"
        ref="execDeptTable"
        class="gz-retrospect-tab-panel"
        :query-params="queryParams"
      />
      <UseTraceSummaryApplyDept
        v-if="activeName === 'applyDept'"
        ref="applyDeptTable"
        class="gz-retrospect-tab-panel"
        :query-params="queryParams"
      />
      <UseTraceSummarySupplier
        v-if="activeName === 'supplier'"
        ref="supplierTable"
        class="gz-retrospect-tab-panel"
        :query-params="queryParams"
      />
      <UseTraceMaterialUsageReport
        v-if="activeName === 'usageReport'"
        ref="usageReportTable"
        class="gz-retrospect-tab-panel"
        :query-params="queryParams"
      />
    </div>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectFactory from "@/components/SelectModel/SelectFactory";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import RightToolbar from "@/components/RightToolbar";
import UseTraceDetail from "./components/UseTraceDetail.vue";
import UseTraceSummaryExecDept from "./components/UseTraceSummaryExecDept.vue";
import UseTraceSummaryApplyDept from "./components/UseTraceSummaryApplyDept.vue";
import UseTraceSummarySupplier from "./components/UseTraceSummarySupplier.vue";
import UseTraceMaterialUsageReport from "./components/UseTraceMaterialUsageReport.vue";

export default {
  name: "RetrospectInventory",
  dicts: ['is_yes_no'],
  components: {
    SelectWarehouse,
    SelectFactory,
    SelectSupplier,
    RightToolbar,
    UseTraceDetail,
    UseTraceSummaryExecDept,
    UseTraceSummaryApplyDept,
    UseTraceSummarySupplier,
    UseTraceMaterialUsageReport
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
        { label: "院内码", value: "inHospitalCode" },
        { label: "产品", value: "materialKeyword" },
        { label: "规格", value: "materialSpeci" },
        { label: "仓库", value: "warehouse" },
        { label: "生产厂家", value: "factoryId" },
        { label: "批号", value: "materialNo" },
        { label: "收费编码", value: "chargeCodeKeyword" },
        { label: "门诊号/住院号", value: "hospitalNumber" },
        { label: "病人姓名", value: "patientName" },
        { label: "主条码", value: "masterBarcode" },
        { label: "辅条码", value: "secondaryBarcode" },
        { label: "UDI码", value: "udiKeyword" },
        { label: "阳光平台编码", value: "sunshineCodeKeyword" },
        { label: "医保编码", value: "medicalNoKeyword" }
      ],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        inHospitalCode: null,
        materialKeyword: null,
        materialSpeci: null,
        factoryId: null,
        warehouseId: null,
        warehouseName: null,
        supplierId: null,
        supplierKeyword: null,
        materialNo: null,
        chargeCodeKeyword: null,
        hospitalNumber: null,
        patientName: null,
        masterBarcode: null,
        secondaryBarcode: null,
        udiKeyword: null,
        sunshineCodeKeyword: null,
        medicalNoKeyword: null,
        startDate: null,
        endDate: null,
        orderStatus: 2,
        isBilling: null,
        isProcure: null,
        isMonitor: null
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.gz.retrospect.moreSearchTypes";
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
    this.initDefaultScanDateRange();
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
    formatScanDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    initDefaultScanDateRange() {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 5);
      this.queryParams.startDate = this.formatScanDate(start);
      this.queryParams.endDate = this.formatScanDate(end);
    },
    onMoreSearchTypesChange(val) {
      const allow = new Set(this.moreSearchOptions.map(o => o.value));
      const cleaned = (val || this.moreSearchTypes || []).filter(v => allow.has(v) && v !== 'supplierId');
      if (cleaned.length !== (this.moreSearchTypes || []).length) {
        this.moreSearchTypes = cleaned;
      }
      this.applyMoreSearchToQueryParams(this.queryParams);
      this.$nextTick(() => this.refreshActiveTableHeight());
    },
    moreSearchFieldClass(t) {
      if (['warehouse', 'factoryId'].includes(t)) {
        return 'more-search-field--select';
      }
      return 'more-search-field--text';
    },
    moreSearchPlaceholderFor(t) {
      const map = {
        inHospitalCode: '院内码模糊',
        materialKeyword: '产品编码/名称/简码',
        materialSpeci: '规格模糊',
        materialNo: '批号模糊',
        chargeCodeKeyword: '收费编码模糊',
        hospitalNumber: '门诊号/住院号模糊',
        patientName: '病人姓名模糊',
        masterBarcode: '主条码模糊',
        secondaryBarcode: '辅条码模糊',
        udiKeyword: 'UDI码模糊',
        sunshineCodeKeyword: '阳光平台编码模糊',
        medicalNoKeyword: '医保编码模糊'
      };
      return map[t] || '请输入关键字';
    },
    trimLeadingSpaces(val) {
      if (val === null || val === undefined) {
        return val;
      }
      return String(val).replace(/^\s+/, '');
    },
    onMoreSearchInput(field, val) {
      const trimmed = this.trimLeadingSpaces(val);
      if (trimmed !== val) {
        this.queryParams[field] = trimmed;
      }
    },
    normalizeSearchTextParams() {
      const fields = [
        'inHospitalCode', 'materialKeyword', 'materialSpeci', 'materialNo', 'supplierKeyword',
        'chargeCodeKeyword', 'hospitalNumber', 'patientName', 'masterBarcode', 'secondaryBarcode',
        'udiKeyword', 'sunshineCodeKeyword', 'medicalNoKeyword'
      ];
      fields.forEach((f) => {
        const v = this.queryParams[f];
        if (v != null && v !== '') {
          const trimmed = this.trimLeadingSpaces(v);
          this.queryParams[f] = trimmed === '' ? null : trimmed;
        }
      });
    },
    handleQuery() {
      this.normalizeSearchTextParams();
      this.queryParams.pageNum = 1;
      this.refreshActiveTable();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.inHospitalCode = null;
      this.queryParams.materialKeyword = null;
      this.queryParams.materialSpeci = null;
      this.queryParams.factoryId = null;
      this.queryParams.warehouseName = null;
      this.queryParams.warehouseId = null;
      this.queryParams.supplierId = null;
      this.queryParams.supplierKeyword = null;
      this.queryParams.materialNo = null;
      this.queryParams.chargeCodeKeyword = null;
      this.queryParams.hospitalNumber = null;
      this.queryParams.patientName = null;
      this.queryParams.masterBarcode = null;
      this.queryParams.secondaryBarcode = null;
      this.queryParams.udiKeyword = null;
      this.queryParams.sunshineCodeKeyword = null;
      this.queryParams.medicalNoKeyword = null;
      this.queryParams.orderStatus = 2;
      this.queryParams.isBilling = null;
      this.queryParams.isProcure = null;
      this.queryParams.isMonitor = null;
      this.queryParams.pageNum = 1;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.initDefaultScanDateRange();
      this.handleQuery();
    },
    activeTableRef() {
      const refMap = {
        detail: 'detailTable',
        execDept: 'execDeptTable',
        applyDept: 'applyDeptTable',
        supplier: 'supplierTable',
        usageReport: 'usageReportTable'
      };
      return this.$refs[refMap[this.activeName]];
    },
    handleTabClick(tab) {
      this.$nextTick(() => {
        const ref = this.activeTableRef();
        if (ref && typeof ref.getList === 'function') {
          ref.getList();
        }
        this.refreshActiveTableHeight();
        setTimeout(() => this.refreshActiveTableHeight(), 80);
      });
    },
    refreshActiveTable() {
      const ref = this.activeTableRef();
      if (ref && typeof ref.getList === 'function') {
        ref.getList();
      }
    },
    refreshActiveTableHeight() {
      const ref = this.activeTableRef();
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
      const ref = this.activeTableRef();
      if (!ref || typeof ref.exportTable !== 'function') {
        this.$modal.msgError('当前页签不支持导出');
        return;
      }
      await ref.exportTable();
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
        return (loaded || []).filter(v => v !== 'supplierId');
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v) && v !== 'supplierId');
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      const map = {
        inHospitalCode: 'inHospitalCode',
        materialKeyword: 'materialKeyword',
        materialSpeci: 'materialSpeci',
        warehouse: 'warehouseId',
        factoryId: 'factoryId',
        materialNo: 'materialNo',
        chargeCodeKeyword: 'chargeCodeKeyword',
        hospitalNumber: 'hospitalNumber',
        patientName: 'patientName',
        masterBarcode: 'masterBarcode',
        secondaryBarcode: 'secondaryBarcode',
        udiKeyword: 'udiKeyword',
        sunshineCodeKeyword: 'sunshineCodeKeyword',
        medicalNoKeyword: 'medicalNoKeyword'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
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

.app-container.first-inventory-page.gz-retrospect-query {
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

.gz-retrospect-query .pagination-wrapper {
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
.gz-retrospect-query .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gz-retrospect-query .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.gz-retrospect-query .pagination-wrapper .pagination-container {
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
.gz-retrospect-query .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.gz-retrospect-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.gz-retrospect-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.gz-retrospect-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
}
.gz-retrospect-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.gz-retrospect-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
}

.gz-retrospect-query .gz-retrospect-main-table .el-table__header-wrapper th,
.gz-retrospect-query .gz-retrospect-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.gz-retrospect-query .gz-retrospect-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.gz-retrospect-query .gz-retrospect-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.gz-retrospect-query .gz-retrospect-main-table .el-table__body tr.gz-retrospect-row-selected > td {
  background-color: #B8DAFF !important;
}
.gz-retrospect-query .gz-retrospect-main-table .el-table__body tr.gz-retrospect-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
</style>

<style scoped>
.app-container.gz-retrospect-page {
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
.gz-retrospect-page >>> .app-container.first-inventory-page {
  flex: 1 1 auto !important;
  height: 100% !important;
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
  width: 120px;
}

.more-search-dynamic-field {
  display: inline-flex;
  align-items: center;
  height: 32px;
  gap: 6px;
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
  margin: 0;
}
.query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  gap: 8px;
}
.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 0;
  white-space: nowrap;
}
.ctk-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.form-fields-container {
  margin: 0 0 4px;
  flex: 0 0 auto;
}
.ctk-list-toolbar.list-toolbar {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  flex: 0 0 auto;
  align-items: center !important;
}
.ctk-list-toolbar .list-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.toolbar-more-search {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.gz-retrospect-tab-panel {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
</style>
