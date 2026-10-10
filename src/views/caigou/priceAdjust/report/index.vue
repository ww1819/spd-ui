<template>
  <div class="app-container price-adjust-report-shell">
    <el-tabs v-model="activeTab" type="card" class="inventory-tabs-compact" @tab-click="onTabClick">
      <el-tab-pane label="调价明细表" name="detail" />
      <el-tab-pane label="调价汇总表" name="summary" />
    </el-tabs>

    <div class="app-container list-page price-adjust-report-page">
      <div class="form-fields-container list-query-panel" v-show="showSearch">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
          <el-row :gutter="16" class="query-row-first">
            <el-col :span="24" class="query-row-first-inner">
              <el-input
                v-model="queryParams.billNo"
                placeholder="单号"
                clearable
                class="apply-query-input apply-query-field"
                @keyup.enter.native="handleQuery"
              />
              <el-select
                v-model="queryParams.adjustType"
                placeholder="调价类型"
                clearable
                class="apply-query-field"
              >
                <el-option
                  v-for="item in adjustTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-input
                v-model="queryParams.createByName"
                placeholder="制单人"
                clearable
                class="apply-query-input apply-query-field"
                @keyup.enter.native="handleQuery"
              />
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
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <div class="query-actions">
                <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <el-row :gutter="0" class="mb8 list-toolbar">
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

      <div class="apply-table-panel" ref="tablePanel">
        <!-- 调价明细表 -->
        <el-table
          v-show="activeTab === 'detail'"
          ref="detailTable"
          v-loading="loading"
          :data="detailList"
          class="table-compact apply-main-table"
          row-key="id"
          :height="mainTableHeight"
          border
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable />
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
        </el-table>

        <!-- 调价汇总表 -->
        <el-table
          v-show="activeTab === 'summary'"
          ref="summaryTable"
          v-loading="loading"
          :data="summaryList"
          class="table-compact apply-main-table"
          :row-key="summaryRowKey"
          :height="mainTableHeight"
          border
          stripe
        >
          <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
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

export default {
  name: "PriceAdjustReport",
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
        createByName: null,
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
    getList() {
      this.loading = true;
      const params = { ...this.queryParams, billStatus: "2" };
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
        createByName: null,
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
.price-adjust-report-shell {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 92px);
  max-height: calc(100vh - 92px);
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 0 !important;
  box-sizing: border-box;
  overflow: hidden;
}
.inventory-tabs-compact {
  margin-top: 0;
  flex: 0 0 auto;
}
.inventory-tabs-compact >>> .el-tabs__header {
  margin: 0 0 4px !important;
}
.price-adjust-report-shell >>> .app-container.price-adjust-report-page {
  flex: 1 1 auto;
  min-height: 0;
  height: auto !important;
  max-height: none !important;
}
.query-row-first-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.apply-pager-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  min-height: 40px;
  padding: 4px 0;
  box-sizing: border-box;
}
.apply-pager-bar .pagination-summary {
  flex: 1 1 auto;
  min-width: 120px;
}
.apply-pager-bar .pagination-container {
  margin-top: 0 !important;
  margin-left: auto;
}
.price-cell-red {
  color: #f56c6c;
}
</style>
