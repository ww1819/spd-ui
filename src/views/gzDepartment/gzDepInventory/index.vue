<template>
  <div class="app-container out-warehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
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
              <template v-if="t === 'department'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectDepartment v-model="queryParams.departmentId" />
                </div>
              </template>
              <template v-else-if="t === 'supplier'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectSupplier v-model="queryParams.supplierId" />
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
                placeholder="产品模糊查询（名称/编码/简码）"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
            </div>
          </more-search-bar>
          <el-row :gutter="16" class="query-row-second">
            <el-col :span="24" class="query-row-second-inner">
              <el-form-item label="批号" prop="materialNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.materialNo"
                  placeholder="批号"
                  clearable
                  style="width: 180px"
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
                  style="width: 150px"
                />
              </el-form-item>
              <el-form-item label="入库日期" prop="warehouseDate" class="query-item-inline">
                <el-date-picker
                  v-model="queryParams.warehouseDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="入库日期"
                  clearable
                  style="width: 150px"
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
            v-hasPermi="['gzDepartment:gzDepInventory:export']"
          >导出</el-button>
        </div>
        <div class="list-toolbar-right">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
        </div>
      </el-row>

      <GzDepInventoryDetail
        v-show="activeName === 'detail'"
        ref="detailTable"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <GzDepInventorySummary
        v-show="activeName === 'summary'"
        ref="summaryTable"
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
        { label: "供应商", value: "supplier" },
        { label: "收费项目ID", value: "hisChargeItemId" },
        { label: "批次号", value: "batchNo" },
        { label: "院内码", value: "inHospitalCode" },
        { label: "主条码", value: "masterBarcode" },
        { label: "辅条码", value: "secondaryBarcode" }
      ],
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
      return this.moreSearchOptions.map(o => o.value);
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
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
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.refreshActiveTable();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.pageNum = 1;
      this.queryParams.showZeroStock = false;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass(t) {
      if (['department', 'supplier'].includes(t)) {
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
        materialKeyword: 'materialKeyword',
        department: 'departmentId',
        supplier: 'supplierId',
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
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    handleTabClick(tab) {
      this.$nextTick(() => {
        if (tab.name === 'summary' && this.$refs.summaryTable && typeof this.$refs.summaryTable.getList === 'function') {
          this.$refs.summaryTable.getList();
        } else if (tab.name === 'detail' && this.$refs.detailTable && typeof this.$refs.detailTable.getList === 'function') {
          this.$refs.detailTable.getList();
        }
      });
    },
    refreshActiveTable() {
      const ref = this.activeName === 'summary' ? this.$refs.summaryTable : this.$refs.detailTable;
      if (ref && typeof ref.getList === 'function') {
        ref.getList();
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

.query-row-left {
  margin-bottom: 2px;
}
.query-row-first-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  gap: 4px;
  padding-bottom: 2px;
}
.query-row-first-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 8px;
  white-space: nowrap;
}
.query-row-first-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
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
.query-row-second {
  margin-bottom: 2px;
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
.query-item-switch .el-form-item__content {
  min-height: 32px;
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
</style>
