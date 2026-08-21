<template>
  <div class="app-container out-warehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="备货入/退货表" name="inbound"></el-tab-pane>
      <el-tab-pane label="备货出/退库表" name="outbound"></el-tab-pane>
      <el-tab-pane label="跟台表" name="follow"></el-tab-pane>
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
              :class="(t === 'warehouse' || t === 'supplier' || t === 'department') ? 'more-search-field--select' : 'more-search-field--text'"
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
          </more-search-bar>
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
                <el-select v-model="queryParams.orderStatus" placeholder="单据状态" clearable class="more-search-select-wrap">
                  <el-option
                    v-for="dict in dict.type.biz_status"
                    :key="dict.value"
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
            v-hasPermi="['gz:stockQuery:export']"
          >导出</el-button>
        </div>
        <div class="list-toolbar-right">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
        </div>
      </el-row>

      <InboundRefundTable
        v-if="activeName === 'inbound'"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <OutboundRefundTable
        v-if="activeName === 'outbound'"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <FollowTable
        v-if="activeName === 'follow'"
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
        { value: "supplier", label: "供应商" },
        { value: "materialKeyword", label: "耗材" },
        { value: "inHospitalCode", label: "院内码" },
        { value: "orderNo", label: "单号" },
        { value: "department", label: "科室" }
      ],
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
      return ["warehouse", "supplier", "materialKeyword", "inHospitalCode", "orderNo", "department"];
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
    moreSearchPlaceholderFor(t) {
      const map = {
        materialKeyword: "耗材编码/名称/规格/首字母",
        inHospitalCode: "院内码",
        orderNo: this.activeName === "outbound" ? "出库/退库单号" : "单号"
      };
      return map[t] || "请输入";
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
      if (!set.has("warehouse")) target.warehouseId = null;
      if (!set.has("supplier")) target.supplierId = null;
      if (!set.has("department")) target.departmentId = null;
      if (!set.has("materialKeyword")) target.materialKeyword = null;
      if (!set.has("inHospitalCode")) target.inHospitalCode = null;
      if (!set.has("orderNo")) target.orderNo = null;
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
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
    handleTabClick() {
      this.resetQuery();
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
/* 备货查询页：与出/退库查询一致，固定页面不滚动 */
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
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
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
.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
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

.form-fields-container {
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
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
