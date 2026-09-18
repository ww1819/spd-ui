<template>
  <div class="app-container list-page first-inventory-page cg-report-query">
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
                <SelectWarehouse v-model="queryParams.warehouseId" />
              </div>
            </template>
            <template v-else>
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectMaterial v-model="queryParams.materialId" />
              </div>
            </template>
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
            <el-form-item label="订单日期" class="query-item-inline query-item-date-range">
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
            <el-option v-for="opt in moreSearchOptions" :key="opt.value" :label="opt.label" :value="opt.value"/>
          </el-select>
        </div>
        <el-button type="success" size="small" icon="el-icon-check" class="spd-btn" @click="saveMoreSearchDefaults">保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="reportTable"
        v-loading="loading"
        :data="reportList"
        :height="tableHeight"
        :row-key="getDetailRowKey"
        :row-class-name="cgReportRowClassName"
        border
        stripe
        class="cg-report-main-table table-compact"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleDetailRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="cg-select-col col-serial-center" />
        <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" prop="materialSpec" width="110" min-width="100" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" prop="materialUnit" width="100" min-width="90" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="供应商" align="left" header-align="center" class-name="ctk-col-left" prop="supplierName" width="200" min-width="180" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="仓库" align="left" header-align="center" class-name="ctk-col-left" prop="warehouseName" width="130" show-overflow-tooltip resizable />
        <el-table-column label="单价" align="center" prop="unitPrice" width="130" min-width="120" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="totalQty" width="110" min-width="100" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">
            <span v-if="scope.row.totalQty">{{ scope.row.totalQty }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="totalAmt" width="130" min-width="120" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmt">{{ scope.row.totalAmt | formatCurrency }}</span>
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
import { listDingdan, getDingdan } from "@/api/caigou/dingdan";
import { exportPurchaseOrderSummaryReportStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "OrderSummaryReport",
  components: { SelectSupplier, SelectMaterial, SelectWarehouse, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "仓库", value: "warehouse" },
        { label: "耗材", value: "material" }
      ],
      total: 0,
      fullSummaryList: [],
      reportList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        supplierId: null,
        warehouseId: null,
        materialId: null,
        beginDate: null,
        endDate: null
      },
      sortProp: null,
      sortOrder: null,
      numericSortProps: ["unitPrice", "totalQty", "totalAmt"],
      selectedRowKeys: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      tableHeight: 400
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.caigou.report.orderSummary.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    },
    totalInfo() {
      const list = this.fullSummaryList || [];
      const totalQty = list.reduce((s, r) => s + Number(r.totalQty || 0), 0);
      const totalAmt = list.reduce((s, r) => s + Number(r.totalAmt || 0), 0);
      return { totalQty, totalAmt };
    },
    pageTotalQty() {
      return (this.reportList || []).reduce((s, r) => s + Number(r.totalQty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.reportList || []).reduce((s, r) => s + Number(r.totalAmt || 0), 0);
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      return fmt ? fmt(amt) : String(this.formatAmount(amt));
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.queryParams.beginDate = this.getStatDate();
    this.queryParams.endDate = this.getEndDate();
    this.onMoreSearchTypesChange();
    this.getList();
  },
  mounted() {
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
    getDetailRowKey(row) {
      return (row && row._rowKey) || '';
    },
    cgReportRowClassName({ row }) {
      const key = this.getDetailRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'cg-row-selected';
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
    buildListParams() {
      const params = {
        ...this.queryParams,
        pageNum: 1,
        pageSize: 10000
      };
      this.applyMoreSearchToQueryParams(params);
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === "") {
          delete params[key];
        }
      });
      return params;
    },
    getSortedList(source) {
      const list = [...(source || [])];
      if (!this.sortProp || !this.sortOrder) {
        return list;
      }
      const prop = this.sortProp;
      const asc = this.sortOrder === "ascending";
      const isNumeric = this.numericSortProps.includes(prop);
      list.sort((a, b) => {
        let va = a[prop];
        let vb = b[prop];
        if (isNumeric) {
          va = Number(va) || 0;
          vb = Number(vb) || 0;
          return asc ? va - vb : vb - va;
        }
        va = va != null ? String(va) : "";
        vb = vb != null ? String(vb) : "";
        const cmp = va.localeCompare(vb, "zh-CN");
        return asc ? cmp : -cmp;
      });
      return list;
    },
    applyPagination() {
      const { pageNum, pageSize } = this.queryParams;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      this.reportList = this.getSortedList(this.fullSummaryList).slice(start, end);
    },
    handleSortChange({ prop, order }) {
      this.sortProp = order ? prop : null;
      this.sortOrder = order || null;
      this.queryParams.pageNum = 1;
      this.applyPagination();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      if (this.fullSummaryList.length) {
        this.applyPagination();
      }
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.applyPagination();
    },
    getList() {
      this.loading = true;
      listDingdan(this.buildListParams())
        .then(response => {
          const orderList = response.rows || [];
          if (!orderList.length) {
            this.fullSummaryList = [];
            this.reportList = [];
            this.total = 0;
            this.loading = false;
            this.$nextTick(() => this.updateTableHeight());
            return;
          }
          this.fetchOrderDetails(orderList);
        })
        .catch(() => {
          this.fullSummaryList = [];
          this.reportList = [];
          this.total = 0;
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
        });
    },
    fetchOrderDetails(orderList) {
      const detailPromises = orderList.map(order => {
        if (!order.id) {
          return Promise.resolve({
            ...order,
            purchaseOrderEntryList: []
          });
        }
        return getDingdan(order.id)
          .then(response => {
            const entryList =
              response.data?.purchaseOrderEntryList || response.data?.entryList || [];
            return {
              ...order,
              purchaseOrderEntryList: entryList
            };
          })
          .catch(() => ({
            ...order,
            purchaseOrderEntryList: []
          }));
      });

      Promise.all(detailPromises)
        .then(ordersWithDetails => {
          const summaryList = this.processSummaryData(ordersWithDetails);
          const filteredList = this.filterSummaryData(summaryList);
          this.selectedRowKeys = [];
          (filteredList || []).forEach((row, idx) => {
            if (row && !row._rowKey) {
              row._rowKey = 'cg-' + idx + '-' + [
                row.planNo, row.orderNo, row.materialCode, row.materialId,
                row.supplierName, row.warehouseName, row.qty, row.orderQty,
                row.totalQty, row.amt, row.totalAmt, row.unitPrice, row.price
              ].map(v => (v == null ? '' : String(v))).join('_');
            }
          });
          this.fullSummaryList = filteredList;
          this.total = filteredList.length;
          this.applyPagination();
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
        })
        .catch(() => {
          this.fullSummaryList = [];
          this.reportList = [];
          this.total = 0;
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
        });
    },
    filterSummaryData(summaryList) {
      if (!this.queryParams.materialId) {
        return summaryList;
      }
      const queryMaterialId = String(this.queryParams.materialId);
      return (summaryList || []).filter(item => {
        const itemMaterialId = item.materialId != null ? String(item.materialId) : "";
        return itemMaterialId === queryMaterialId;
      });
    },
    processSummaryData(orderList) {
      const summaryMap = new Map();
      if (orderList && orderList.length > 0) {
        orderList.forEach(order => {
          const entryList = order.purchaseOrderEntryList || order.entryList || [];
          if (entryList && entryList.length > 0) {
            entryList.forEach(entry => {
              const material = entry.material || {};
              const materialId = entry.materialId || material.id || "";
              const supplierId = order.supplierId || "";
              const key = `${materialId}_${order.warehouseId || ""}_${supplierId}`;
              if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                  materialId,
                  materialCode: entry.materialCode || material.code || "",
                  materialName: entry.materialName || material.name || "",
                  materialSpec: entry.materialSpec || entry.speci || material.speci || "",
                  materialUnit:
                    entry.materialUnit ||
                    (material.fdUnit && material.fdUnit.unitName) ||
                    "",
                  supplierName:
                    order.supplierName || (order.supplier && order.supplier.name) || "",
                  warehouseName:
                    order.warehouseName || (order.warehouse && order.warehouse.name) || "",
                  unitPrice: entry.unitPrice || 0,
                  totalQty: 0,
                  totalAmt: 0
                });
              }
              const item = summaryMap.get(key);
              const orderQty = Number(entry.orderQty != null ? entry.orderQty : 0);
              const totalAmount = Number(
                entry.totalAmount != null ? entry.totalAmount : orderQty * Number(entry.unitPrice || 0)
              );
              item.totalQty += orderQty;
              item.totalAmt += totalAmount;
            });
          }
        });
      }
      return Array.from(summaryMap.values());
    },
    getStatDate() {
      const myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      return myDate.getFullYear().toString() + "-" + month + "-" + "01";
    },
    getEndDate() {
      const myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      const dayEnd = new Date(myDate.getFullYear(), month, 0).getDate();
      return myDate.getFullYear().toString() + "-" + month + "-" + dayEnd;
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass() {
      return 'more-search-field--select';
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
        material: 'materialId'
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
    async handleExport() {
      const rows = this.fullSummaryList || [];
      if (!rows.length) {
        this.$message && this.$message.warning("暂无数据可导出");
        return;
      }
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      try {
        await exportPurchaseOrderSummaryReportStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `采购订单汇总表${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      }
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

.cg-report-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.cg-report-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.cg-report-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  height: 32px !important;
  overflow: visible !important;
}
.cg-report-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.cg-report-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
}
.cg-report-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 160px !important;
}

.first-inventory-page .cg-report-main-table .el-table__header-wrapper th,
.first-inventory-page .cg-report-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .cg-report-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}

.first-inventory-page .cg-report-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .cg-report-main-table .el-table__body tr.cg-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .cg-report-main-table .el-table__body tr.cg-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.first-inventory-page .cg-report-main-table th.cg-select-col,
.first-inventory-page .cg-report-main-table td.cg-select-col,
.first-inventory-page .cg-report-main-table th.el-table-column--selection,
.first-inventory-page .cg-report-main-table td.el-table-column--selection {
  position: sticky;
  left: 0;
  z-index: 2;
  box-shadow: 2px 0 0 0 #e2e8f0;
}
.first-inventory-page .cg-report-main-table th.cg-select-col,
.first-inventory-page .cg-report-main-table th.el-table-column--selection {
  z-index: 3;
  background-color: #f1f5f9;
}
.first-inventory-page .cg-report-main-table td.cg-select-col,
.first-inventory-page .cg-report-main-table td.el-table-column--selection {
  background-color: #fff;
}
.first-inventory-page .cg-report-main-table .el-table__body tr.el-table__row--striped td.cg-select-col,
.first-inventory-page .cg-report-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa;
}
.first-inventory-page .cg-report-main-table .el-table__body tr:hover > td.cg-select-col,
.first-inventory-page .cg-report-main-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF;
}
.first-inventory-page .cg-report-main-table .el-table__body tr.cg-row-selected > td.cg-select-col,
.first-inventory-page .cg-report-main-table .el-table__body tr.cg-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF;
}
.first-inventory-page .cg-report-main-table .el-table__body tr.cg-row-selected:hover > td.cg-select-col,
.first-inventory-page .cg-report-main-table .el-table__body tr.cg-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF;
}
.first-inventory-page .cg-report-main-table td.cg-select-col .cell,
.first-inventory-page .cg-report-main-table td.el-table-column--selection .cell,
.first-inventory-page .cg-report-main-table th.cg-select-col .cell,
.first-inventory-page .cg-report-main-table th.el-table-column--selection .cell {
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
.more-search-type {
  width: 160px;
  min-width: 160px;
  max-width: 160px;
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

.table-container ::v-deep .cg-report-main-table .el-table__body-wrapper::-webkit-scrollbar,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .cg-report-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.table-container ::v-deep .cg-report-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.table-container ::v-deep .cg-report-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .cg-report-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .cg-report-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
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

.table-container ::v-deep .el-table th.ctk-col-left .cell {
  text-align: center !important;
}
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
}

.table-container ::v-deep .el-table.cg-report-main-table.table-compact th .caret-wrapper {
  position: relative !important;
  display: inline-block !important;
  flex-shrink: 0 !important;
  height: 26px !important;
  width: 24px !important;
  margin-left: 4px !important;
  cursor: pointer !important;
  vertical-align: middle !important;
  overflow: visible !important;
}

.table-container ::v-deep .el-table.cg-report-main-table.table-compact th .sort-caret {
  position: absolute !important;
  left: 7px !important;
  width: 0 !important;
  height: 0 !important;
  border-style: solid !important;
  border-left-width: 5px !important;
  border-right-width: 5px !important;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
}

.table-container ::v-deep .el-table.cg-report-main-table.table-compact th .sort-caret.ascending {
  top: 3px !important;
  border-top-width: 0 !important;
  border-bottom-width: 5px !important;
  border-bottom-color: #C0C4CC !important;
}

.table-container ::v-deep .el-table.cg-report-main-table.table-compact th .sort-caret.descending {
  bottom: 3px !important;
  border-bottom-width: 0 !important;
  border-top-width: 5px !important;
  border-top-color: #C0C4CC !important;
}

.table-container ::v-deep .el-table.cg-report-main-table.table-compact th.ascending .sort-caret.ascending {
  border-bottom-color: #409EFF !important;
}

.table-container ::v-deep .el-table.cg-report-main-table.table-compact th.descending .sort-caret.descending {
  border-top-color: #409EFF !important;
}
</style>
