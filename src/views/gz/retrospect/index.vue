<template>
  <div class="app-container out-warehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="使用追溯明细表" name="detail"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(执行科室)" name="execDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(开单科室)" name="applyDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(供应商)" name="supplier"></el-tab-pane>
      <el-tab-pane label="高值耗材使用情况报表" name="usageReport"></el-tab-pane>
    </el-tabs>

    <div class="app-container list-page first-inventory-page">
      <div class="form-fields-container list-query-panel" v-show="showSearch">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
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
              <template v-else-if="t === 'supplierId'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectSupplier
                    v-model="queryParams.supplierId"
                    :keyword.sync="queryParams.supplierKeyword"
                    allow-keyword-blur
                    placeholder="供应商编码/名称/简码搜索"
                  />
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
          </more-search-bar>

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
                <el-select
                  v-model="queryParams.orderStatus"
                  placeholder="状态"
                  clearable
                  class="more-search-select-wrap"
                >
                  <el-option label="已审核" :value="2" />
                  <el-option label="未审核" :value="1" />
                </el-select>
              </el-form-item>
              <el-form-item prop="isBilling" class="query-item-inline">
                <el-select
                  v-model="queryParams.isBilling"
                  placeholder="计费"
                  clearable
                  class="more-search-short-select"
                >
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'billing-' + dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item prop="isProcure" class="query-item-inline">
                <el-select
                  v-model="queryParams.isProcure"
                  placeholder="集采"
                  clearable
                  class="more-search-short-select"
                >
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'procure-' + dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item prop="isMonitor" class="query-item-inline">
                <el-select
                  v-model="queryParams.isMonitor"
                  placeholder="重点耗材"
                  clearable
                  class="more-search-short-select"
                >
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'monitor-' + dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <el-row :gutter="0" class="mb8 list-toolbar">
        <div class="list-toolbar-left">
          <el-button
            size="small"
            class="spd-btn spd-btn--secondary"
            @click="handleExport"
            v-hasPermi="['gz:retrospect:export']"
          >导出</el-button>
        </div>
        <div class="list-toolbar-right">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
        </div>
      </el-row>

      <UseTraceDetail
        v-if="activeName === 'detail'"
        ref="detailTable"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <UseTraceSummaryExecDept
        v-if="activeName === 'execDept'"
        ref="execDeptTable"
        :query-params="queryParams"
      />
      <UseTraceSummaryApplyDept
        v-if="activeName === 'applyDept'"
        ref="applyDeptTable"
        :query-params="queryParams"
      />
      <UseTraceSummarySupplier
        v-if="activeName === 'supplier'"
        ref="supplierTable"
        :query-params="queryParams"
      />
      <UseTraceMaterialUsageReport
        v-if="activeName === 'usageReport'"
        ref="usageReportTable"
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
        { label: "耗材名称", value: "materialKeyword" },
        { label: "规格", value: "materialSpeci" },
        { label: "仓库", value: "warehouse" },
        { label: "生产厂家", value: "factoryId" },
        { label: "供应商", value: "supplierId" },
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
      return this.moreSearchOptions.map(o => o.value);
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.initDefaultScanDateRange();
  },
  activated() {
    document.body.classList.add('inventory-query-fixed');
  },
  deactivated() {
    document.body.classList.remove('inventory-query-fixed');
  },
  mounted() {
    document.body.classList.add('inventory-query-fixed');
  },
  beforeDestroy() {
    document.body.classList.remove('inventory-query-fixed');
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
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    moreSearchFieldClass(t) {
      if (['warehouse', 'factoryId', 'supplierId'].includes(t)) {
        return 'more-search-field--select';
      }
      return 'more-search-field--text';
    },
    moreSearchPlaceholderFor(t) {
      const map = {
        inHospitalCode: '院内码模糊',
        materialKeyword: '耗材编码/名称/简码',
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
    handleTabClick(tab) {
      this.$nextTick(() => {
        const refMap = {
          detail: 'detailTable',
          execDept: 'execDeptTable',
          applyDept: 'applyDeptTable',
          supplier: 'supplierTable',
          usageReport: 'usageReportTable'
        };
        const refName = refMap[tab.name];
        const ref = refName && this.$refs[refName];
        if (ref && typeof ref.getList === 'function') {
          ref.getList();
        }
      });
    },
    refreshActiveTable() {
      const refMap = {
        detail: 'detailTable',
        execDept: 'execDeptTable',
        applyDept: 'applyDeptTable',
        supplier: 'supplierTable',
        usageReport: 'usageReportTable'
      };
      const refName = refMap[this.activeName];
      const ref = refName && this.$refs[refName];
      if (ref && typeof ref.getList === 'function') {
        ref.getList();
      }
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    async handleExport() {
      const refMap = {
        detail: 'detailTable',
        execDept: 'execDeptTable',
        applyDept: 'applyDeptTable',
        supplier: 'supplierTable',
        usageReport: 'usageReportTable'
      };
      const refName = refMap[this.activeName];
      const ref = refName && this.$refs[refName];
      if (!ref || typeof ref.exportTable !== 'function') {
        this.$modal.msgError('当前页签不支持导出');
        return;
      }
      await ref.exportTable();
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
        inHospitalCode: 'inHospitalCode',
        materialKeyword: 'materialKeyword',
        materialSpeci: 'materialSpeci',
        warehouse: 'warehouseId',
        factoryId: 'factoryId',
        supplierId: 'supplierId',
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
      if (!set.has('supplierId')) {
        target.supplierKeyword = null;
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

.app-container.first-inventory-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.out-warehouse-query-page .first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}

.out-warehouse-query-page .first-inventory-page .table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  min-width: 0;
  position: relative;
}

.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 16px;
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 10px;
  transition: height 0.2s ease;
}
.out-warehouse-query-page .first-inventory-page .table-container:hover ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 14px;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 3px;
  margin: 0 2px;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 3px;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}
</style>

<style scoped>
.app-container.out-warehouse-query-page {
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  height: calc(100vh - 92px) !important;
  overflow-y: hidden !important;
  overflow-x: hidden !important;
}
.inventory-tabs-compact {
  margin-top: 0;
}

.app-container.first-inventory-page {
  margin-top: -10px;
  padding-left: 0 !important;
  padding-right: 0 !important;
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

.list-query-panel {
  margin-top: -20px;
}
</style>
