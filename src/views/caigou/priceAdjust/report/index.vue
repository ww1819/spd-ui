<template>
  <div class="app-container price-adjust-report-shell">
    <el-tabs v-model="activeTab" type="card" class="inventory-tabs-compact" @tab-click="onTabClick">
      <el-tab-pane label="调价明细表" name="detail" />
      <el-tab-pane label="调价汇总表" name="summary" />
    </el-tabs>

    <div class="app-container list-page price-adjust-report-page">
      <div class="form-fields-container list-query-panel" v-show="showSearch">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
          <!-- 第一行：供应商 / 单号 / 产品名称 / 规格 / 生产厂家 -->
          <div class="ctk-query-top-fields">
            <el-input
              v-model="queryParams.supplierKeyword"
              placeholder="供应商"
              clearable
              class="report-query-input"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.billNo"
              placeholder="单号"
              clearable
              class="report-query-input"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.materialName"
              placeholder="产品名称"
              clearable
              class="report-query-input"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.materialSpeci"
              placeholder="规格"
              clearable
              class="report-query-input"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.factoryKeyword"
              placeholder="生产厂家"
              clearable
              class="report-query-input"
              @keyup.enter.native="handleQuery"
            />
          </div>
          <!-- 第二行：日期 + 调价类型 / 财务/库房分类 + 搜索重置 -->
          <el-row :gutter="16" class="query-row-second">
            <el-col :span="24" class="query-row-second-inner">
              <el-radio-group v-model="queryParams.dateQueryType" size="small" class="apply-date-type-group">
                <el-radio-button label="bill">制单日期</el-radio-button>
                <el-radio-button label="audit">审核日期</el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker report-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker report-query-date"
              />
              <el-select
                v-model="queryParams.adjustType"
                placeholder="调价类型"
                clearable
                class="report-query-select"
              >
                <el-option
                  v-for="item in adjustTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <div class="report-query-category">
                <SelectFinanceCategoryLow
                  v-model="queryParams.financeCategoryIds"
                  :multiple="true"
                  placeholder="财务分类"
                />
              </div>
              <div class="report-query-category">
                <SelectWarehouseCategory
                  v-model="queryParams.warehouseCategoryId"
                  placeholder="库房分类"
                />
              </div>
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
          >导出</el-button>
        </div>
        <div class="list-toolbar-right">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </div>
      </el-row>

      <div class="table-container apply-table-panel" ref="tablePanel">
        <!-- 调价明细表：样式对齐库存明细 inv-detail-main-table -->
        <el-table
          v-show="activeTab === 'detail'"
          ref="detailTable"
          v-loading="loading"
          :data="detailList"
          class="report-detail-main-table"
          row-key="id"
          :row-class-name="detailRowClassName"
          :height="mainTableHeight"
          border
          stripe
          @selection-change="handleSelectionChange"
          @row-dblclick="handleDetailRowDblclick"
        >
          <el-table-column type="selection" width="55" align="center" header-align="center" fixed="left" class-name="report-select-col col-serial-center" />
          <el-table-column label="序号" align="center" prop="index" width="60" fixed="left" show-overflow-tooltip resizable />
          <el-table-column label="调价类型" align="center" prop="adjustTypeName" min-width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.adjustTypeName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单号" align="center" prop="billNo" min-width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.billNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="产品编码" align="center" prop="materialCode" min-width="120" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="产品名称" align="left" header-align="center" prop="materialName" min-width="160" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" align="center" prop="speci" min-width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.speci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="model" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="unitName" width="70" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="原价" align="center" prop="oldPrice" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span class="price-cell-red">{{ formatPrice(scope.row.oldPrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="现价" align="center" prop="newPrice" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span class="price-cell-red">{{ formatPrice(scope.row.newPrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="差价" align="center" prop="priceDiff" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span class="price-cell-red">{{ formatPriceDiff(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" prop="financeClass" min-width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.financeClass || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" prop="warehouseClass" min-width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.warehouseClass || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="manufacturer" min-width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.manufacturer || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" prop="supplierName" min-width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.supplierName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="调价原因" align="center" prop="adjustReason" min-width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.adjustReason || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="regNo" min-width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.regNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证有效期" align="center" prop="regValidDate" min-width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.regValidDate || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" prop="packSpeci" min-width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.packSpeci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="制单人" align="center" prop="createByName" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.createByName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="制单日期" align="center" prop="billDate" min-width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatDateOnly(scope.row.billDate) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="审核人" align="center" prop="auditByName" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.auditByName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="审核日期" align="center" prop="auditDate" min-width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatDateTime(scope.row.auditDate) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 调价汇总表：同表明细样式 -->
        <el-table
          v-show="activeTab === 'summary'"
          ref="summaryTable"
          v-loading="loading"
          :data="summaryList"
          class="report-detail-main-table"
          :row-key="summaryRowKey"
          :height="mainTableHeight"
          border
          stripe
        >
          <el-table-column label="序号" align="center" prop="index" width="80" fixed="left" show-overflow-tooltip resizable />
          <el-table-column label="产品编码" align="center" prop="materialCode" min-width="160" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="产品名称" align="left" header-align="center" prop="materialName" min-width="220" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialName || '--' }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="apply-pagination-wrap apply-pager-bar" ref="paginationWrap">
          <div class="pagination-summary" />
          <pagination
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  listPriceAdjustReportDetail,
  listPriceAdjustReportSummary
} from '@/api/caigou/priceAdjust';
import SelectFinanceCategoryLow from '@/components/SelectModel/SelectFinanceCategoryLow';
import SelectWarehouseCategory from '@/components/SelectModel/SelectWarehouseCategory';

export default {
  name: "PriceAdjustReport",
  components: { SelectFinanceCategoryLow, SelectWarehouseCategory },
  data() {
    return {
      activeTab: "detail",
      loading: false,
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      detailList: [],
      summaryList: [],
      selectedRows: [],
      adjustTypeOptions: [
        { label: "档案调价", value: "archive" },
        { label: "仓库调价", value: "warehouse" },
        { label: "科室调价", value: "department" }
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        adjustType: null,
        materialName: null,
        materialSpeci: null,
        factoryKeyword: null,
        supplierKeyword: null,
        financeCategoryIds: [],
        warehouseCategoryId: null,
        billStatus: "2",
        dateQueryType: "bill",
        beginDate: this.getStatDate(),
        endDate: this.getEndDate()
      }
    };
  },
  mounted() {
    this.getList();
    this.$nextTick(() => this.updateMainTableHeight());
    window.addEventListener("resize", this.onWindowResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onWindowResize);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    activeTab() {
      this.$nextTick(() => {
        this.updateMainTableHeight();
        this.doLayoutCurrentTable();
      });
    }
  },
  methods: {
    summaryRowKey(row) {
      return row.materialId != null ? "m-" + row.materialId : "i-" + row.index;
    },
    formatPrice(v) {
      if (v === "" || v == null) return "--";
      return v;
    },
    /** 差价 = 现价 - 原价 */
    formatPriceDiff(row) {
      if (!row) return "--";
      const oldP = row.oldPrice;
      const newP = row.newPrice;
      if (oldP === "" || oldP == null || newP === "" || newP == null) return "--";
      const a = Number(oldP);
      const b = Number(newP);
      if (Number.isNaN(a) || Number.isNaN(b)) return "--";
      const diff = b - a;
      // 去掉多余尾零，最多保留 4 位小数
      return Number(diff.toFixed(4));
    },
    formatDateOnly(v) {
      if (v === "" || v == null) return "--";
      const s = String(v);
      return s.length >= 10 ? s.substring(0, 10) : s;
    },
    formatDateTime(v) {
      if (v === "" || v == null) return "--";
      return String(v);
    },
    getStatDate() {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return this.formatDate(d);
    },
    getEndDate() {
      return this.formatDate(new Date());
    },
    formatDate(d) {
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    },
    buildQueryParams() {
      const params = { ...this.queryParams, billStatus: "2" };
      const trimOrNull = (v) => {
        const s = v != null ? String(v).trim() : "";
        return s || null;
      };
      params.materialName = trimOrNull(params.materialName);
      params.materialSpeci = trimOrNull(params.materialSpeci);
      params.factoryKeyword = trimOrNull(params.factoryKeyword);
      params.supplierKeyword = trimOrNull(params.supplierKeyword);
      params.billNo = trimOrNull(params.billNo);
      if (!params.financeCategoryIds || !params.financeCategoryIds.length) {
        params.financeCategoryIds = null;
      }
      return params;
    },
    onWindowResize() {
      this.updateMainTableHeight();
    },
    doLayoutCurrentTable() {
      const table = this.activeTab === "summary" ? this.$refs.summaryTable : this.$refs.detailTable;
      if (table && table.doLayout) table.doLayout();
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const height = Math.max(200, Math.floor(panelH - pagH));
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => this.doLayoutCurrentTable());
    },
    onTabClick() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleSelectionChange(selection) {
      this.selectedRows = selection || [];
    },
    detailRowClassName({ row }) {
      if (!row || !this.selectedRows || !this.selectedRows.length) return "";
      const hit = this.selectedRows.some((r) => r && r.id === row.id);
      return hit ? "report-row-selected" : "";
    },
    handleDetailRowDblclick(row) {
      if (!row || !this.$refs.detailTable) return;
      this.$refs.detailTable.toggleRowSelection(row);
    },
    getList() {
      this.loading = true;
      const params = this.buildQueryParams();
      const req =
        this.activeTab === "summary"
          ? listPriceAdjustReportSummary(params)
          : listPriceAdjustReportDetail(params);
      req
        .then((res) => {
          const rows = (res && res.rows) || [];
          const mapped = rows.map((r, idx) => ({
            ...r,
            index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + idx + 1
          }));
          if (this.activeTab === "summary") {
            this.summaryList = mapped;
          } else {
            this.detailList = mapped;
          }
          this.total = (res && res.total) || 0;
        })
        .finally(() => {
          this.loading = false;
          this.$nextTick(() => this.updateMainTableHeight());
        });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        adjustType: null,
        materialName: null,
        materialSpeci: null,
        factoryKeyword: null,
        supplierKeyword: null,
        financeCategoryIds: [],
        warehouseCategoryId: null,
        billStatus: "2",
        dateQueryType: "bill",
        beginDate: this.getStatDate(),
        endDate: this.getEndDate()
      };
      this.getList();
    },
    handleExport() {
      this.$modal.msg("导出功能开发中");
    }
  }
};
</script>

<style scoped>
/* 外层壳：与库存查询 out-warehouse-query-page 一致，顶/左/右 8px */
.price-adjust-report-shell {
  display: flex !important;
  flex-direction: column !important;
  height: calc(100vh - 92px) !important;
  max-height: calc(100vh - 92px) !important;
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 0 !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  min-height: 0 !important;
}
.inventory-tabs-compact {
  margin-top: 0;
  flex: 0 0 auto;
}
.inventory-tabs-compact >>> .el-tabs__header {
  margin: 0 0 4px !important;
}
.inventory-tabs-compact >>> .el-tabs__nav-wrap {
  margin-bottom: 0;
}

/* 内层：对齐 first-inventory-page，取消二次 padding，由外层统一留白 */
.price-adjust-report-shell >>> .app-container.price-adjust-report-page {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

/* 查询区与工具栏间距：与库存明细 4px 一致 */
.price-adjust-report-page .list-query-panel,
.price-adjust-report-page .form-fields-container {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  flex: 0 0 auto;
}
.price-adjust-report-page .ctk-list-toolbar.list-toolbar {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  flex: 0 0 auto;
  flex-wrap: nowrap !important;
  align-items: center !important;
}

/* 检索两行：对齐库存明细 ctk-query-top-fields + query-row-second */
.ctk-query-top-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.query-row-second {
  margin: 0 !important;
}
.query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.report-query-input {
  width: 180px !important;
  flex-shrink: 0;
}
.report-query-input >>> .el-input__inner {
  width: 180px !important;
}
.report-query-select {
  width: 160px !important;
  flex-shrink: 0;
}
.report-query-select >>> .el-input,
.report-query-select >>> .el-input__inner {
  width: 160px !important;
}
.report-query-date {
  width: 138px !important;
  flex-shrink: 0;
}
.report-query-category {
  width: 180px !important;
  flex-shrink: 0;
}
.report-query-category >>> .el-select,
.report-query-category >>> .el-input,
.report-query-category >>> .el-input__inner {
  width: 180px !important;
}
.apply-date-type-group {
  flex-shrink: 0;
  margin-right: 0;
}
.query-date-sep {
  flex-shrink: 0;
  color: #606266;
  line-height: 32px;
}
.ctk-query-actions.query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 0;
}

/* 表格容器：占满剩余高度，白卡片样式与库存明细表区域一致 */
.price-adjust-report-page .table-container.apply-table-panel {
  margin: 0 !important;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}
.price-adjust-report-page .table-container .report-detail-main-table {
  flex: 0 0 auto;
  margin: 0 !important;
  margin-bottom: 0 !important;
  border-radius: 10px 10px 0 0;
  box-shadow: none !important;
}

/* ========== 以下对齐 firstInventory 库存明细表 ========== */

/* 覆盖全局 th height:50px / td padding:12px */
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__header-wrapper th,
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
  padding: 4px 6px !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  white-space: nowrap;
  line-height: 23px;
}

.price-adjust-report-page .table-container >>> .report-detail-main-table td.el-table__cell {
  padding: 10px 6px !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table thead th.el-table__cell > .cell,
.price-adjust-report-page .table-container >>> .report-detail-main-table tbody td.el-table__cell > .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 23px;
  word-break: normal;
  padding: 0 4px;
}

/* 悬停 / 选中：与库存明细 #D6EBFF 一致（覆盖全局浅灰） */
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body tr > td,
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body tr > td .cell {
  transition: none !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body tr.el-table__row {
  transform: none !important;
  box-shadow: none !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body tr.report-row-selected > td {
  background-color: #B8DAFF !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body tr.report-row-selected:hover > td {
  background-color: #A0CBFF !important;
}

/* 横向滚动条加粗：对齐库存明细 12px */
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body-wrapper::-webkit-scrollbar,
.price-adjust-report-page .table-container >>> .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.price-adjust-report-page .table-container >>> .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.price-adjust-report-page .table-container >>> .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.price-adjust-report-page .table-container >>> .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.price-adjust-report-page .table-container >>> .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
.price-adjust-report-page .table-container >>> .report-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.price-adjust-report-page .table-container >>> .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
}

.apply-pager-bar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between;
  flex-wrap: nowrap !important;
  flex: 0 0 auto !important;
  gap: 12px !important;
  min-height: 40px !important;
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding: 4px 0 6px !important;
  box-sizing: border-box;
  border-top: 1px solid #e2e8f0;
}
.apply-pager-bar .pagination-summary {
  flex: 1 1 auto;
  min-width: 120px;
  margin-left: 14px;
}
.apply-pager-bar .pagination-container {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  margin-left: auto !important;
  padding: 0 4px !important;
}
.price-cell-red {
  color: #f56c6c;
}
</style>
