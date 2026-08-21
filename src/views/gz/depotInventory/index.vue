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
              <template v-if="t === 'warehouse'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" placeholder="仓库" />
                </div>
              </template>
              <template v-else-if="t === 'supplier'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectSupplier v-model="queryParams.supplierId" />
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
                placeholder="名称"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
            </div>
          </more-search-bar>

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
            v-hasPermi="['gz:depotInventory:export']"
          >导出</el-button>
        </div>
        <div class="list-toolbar-right">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
        </div>
      </el-row>

      <DepotInventoryDetail
        v-show="activeName === 'detail'"
        ref="detailTable"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <DepotInventorySummary
        v-show="activeName === 'summary'"
        ref="summaryTable"
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
        { label: "供应商", value: "supplier" },
        { label: "单号", value: "orderNo" },
        { label: "收费编码", value: "hisChargeItemId" },
        { label: "名称", value: "materialKeyword" },
        { label: "院内码", value: "inHospitalCode" }
      ],
      /** 是否显示零库存明细（默认不显示） */
      showZeroStock: false,
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
      return this.moreSearchOptions.map(o => o.value);
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.initDefaultDateRange();
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
      this.queryParams.warehouseName = null;
      this.queryParams.materialKeyword = null;
      this.queryParams.orderNo = null;
      this.queryParams.inHospitalCode = null;
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
      if (['warehouse', 'supplier'].includes(t)) {
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
        warehouse: 'warehouseId',
        supplier: 'supplierId',
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
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    }
  }
};
</script>

<style>
/* 高值备货库存：与库存/出退库查询一致，固定页面不滚动 */
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
