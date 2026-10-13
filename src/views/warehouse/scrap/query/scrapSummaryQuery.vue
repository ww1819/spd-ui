<template>
  <div class="app-container list-page first-inventory-page scrap-summary-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div class="more-search-dynamic-field more-search-field--text">
            <el-input
              v-model="queryParams.billNo"
              placeholder="报损单号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
          <div class="more-search-dynamic-field more-search-field--select">
            <div class="query-select-wrapper more-search-select-wrap">
              <SelectWarehouse
                v-model="queryParams.warehouseId"
                :excludeWarehouseType="['高值', '设备']"
                placeholder="仓库"
              />
            </div>
          </div>
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field more-search-field--text"
          >
            <el-input
              v-model="moreSearchKeywords[t]"
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
            <el-form-item class="query-item-inline query-item-date-range">
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
            <el-form-item prop="billStatus" class="query-item-inline">
              <el-select v-model="queryParams.billStatus" placeholder="单据状态" clearable class="more-search-short-select">
                <el-option v-for="item in billStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-button type="warning" size="small" icon="el-icon-download" class="spd-btn" @click="handleExport">导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <div class="toolbar-more-search">
          <span class="more-search-label">更多检索</span>
          <el-select
            v-model="moreSearchTypes"
            multiple
            collapse-tags
            filterable
            size="small"
            placeholder="选择检索条件（可多选）"
            class="more-search-type"
            @change="onMoreSearchTypesChange"
          >
            <el-option v-for="opt in moreSearchOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <el-button type="success" size="small" icon="el-icon-check" class="spd-btn" @click="saveMoreSearchDefaults">保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="summaryTable"
        v-loading="loading"
        :data="dataList"
        class="table-compact inv-detail-main-table"
        border
        stripe
        :height="tableHeight"
      >
        <el-table-column label="序号" type="index" width="55" align="center" :index="indexMethod" />
        <el-table-column label="仓库" prop="warehouseName" min-width="130" show-overflow-tooltip />
        <el-table-column label="产品编码" prop="materialCode" min-width="120" show-overflow-tooltip sortable />
        <el-table-column label="产品名称" prop="materialName" min-width="150" show-overflow-tooltip />
        <el-table-column label="规格" prop="speci" min-width="100" show-overflow-tooltip />
        <el-table-column label="型号" prop="model" min-width="100" show-overflow-tooltip />
        <el-table-column label="生产厂家" prop="manufacturer" min-width="130" show-overflow-tooltip />
        <el-table-column label="单位" prop="unitName" width="70" align="center" />
        <el-table-column label="报损数量" prop="qty" min-width="110" align="right" sortable>
          <template slot-scope="scope">{{ scope.row.qty != null ? scope.row.qty : '--' }}</template>
        </el-table-column>
        <el-table-column label="报损金额" prop="amount" min-width="120" align="right" sortable>
          <template slot-scope="scope">{{ formatAmount(scope.row.amount) }}</template>
        </el-table-column>
        <el-table-column label="报损单数" prop="billCount" min-width="100" align="center" sortable />
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>
        总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，
        总金额: {{ formatAmount(totalInfo.totalAmt) }}，
        当前页数量: {{ pageTotalQty }}，
        当前页金额: {{ formatAmount(pageTotalAmt) }}
      </div>
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script>
import { listScrapSummaryQuery } from "@/api/warehouse/scrap";

const MORE_SEARCH_OPTIONS = [
  { value: "createByName", label: "制单人" },
  { value: "scrapReason", label: "报损原因" },
  { value: "materialCode", label: "产品编码" },
  { value: "materialName", label: "产品名称" },
  { value: "speci", label: "规格" },
  { value: "batchNo", label: "批号" },
  { value: "manufacturer", label: "生产厂家" }
];

export default {
  name: "ScrapSummaryQuery",
  data() {
    return {
      loading: false,
      showSearch: true,
      tableHeight: 360,
      total: 0,
      dataList: [],
      totalInfo: { totalQty: 0, totalAmt: 0 },
      billStatusOptions: [
        { label: "未提交", value: "0" },
        { label: "未审核", value: "1" },
        { label: "已审核", value: "2" }
      ],
      moreSearchStorageKey: "spd.warehouse.scrap.summary.moreSearchTypes",
      moreSearchOptions: MORE_SEARCH_OPTIONS,
      builtInMoreSearchDefaults: ["materialCode", "materialName"],
      moreSearchTypes: ["materialCode", "materialName"],
      moreSearchKeywords: {},
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        warehouseId: null,
        billStatus: null,
        dateQueryType: "bill",
        beginDate: this.getStatDate(),
        endDate: this.getEndDate()
      }
    };
  },
  computed: {
    pageTotalQty() {
      return (this.dataList || []).reduce((s, r) => s + (Number(r.qty) || 0), 0);
    },
    pageTotalAmt() {
      return (this.dataList || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    }
  },
  mounted() {
    this.loadMoreSearchDefaults();
    this.$nextTick(() => this.updateTableHeight());
    window.addEventListener("resize", this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateTableHeight);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateTableHeight());
    }
  },
  methods: {
    getStatDate() {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return this.formatYmd(d);
    },
    getEndDate() {
      return this.formatYmd(new Date());
    },
    formatYmd(d) {
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    },
    formatAmount(val) {
      if (val == null || val === "") return "0.00";
      const n = Number(val);
      return Number.isNaN(n) ? "0.00" : n.toFixed(2);
    },
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1;
    },
    moreSearchPlaceholderFor(t) {
      const hit = this.moreSearchOptions.find((o) => o.value === t);
      return (hit && hit.label) || t;
    },
    onMoreSearchTypesChange() {
      const next = {};
      (this.moreSearchTypes || []).forEach((t) => {
        next[t] = this.moreSearchKeywords[t] || "";
      });
      this.moreSearchKeywords = next;
      this.$nextTick(() => this.updateTableHeight());
    },
    loadMoreSearchDefaults() {
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length) {
            this.moreSearchTypes = arr.filter((v) => this.moreSearchOptions.some((o) => o.value === v));
          }
        }
      } catch (e) { /* ignore */ }
      this.onMoreSearchTypesChange();
    },
    saveMoreSearchDefaults() {
      try {
        localStorage.setItem(this.moreSearchStorageKey, JSON.stringify(this.moreSearchTypes || []));
        this.$modal.msgSuccess("查询条件已保存");
      } catch (e) {
        this.$modal.msgError("保存失败");
      }
    },
    buildQuery() {
      const q = { ...this.queryParams };
      (this.moreSearchTypes || []).forEach((t) => {
        const v = this.moreSearchKeywords[t];
        if (v != null && String(v).trim() !== "") {
          q[t] = String(v).trim();
        }
      });
      return q;
    },
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        const h = Math.floor(panel.clientHeight);
        if (h > 120) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.summaryTable && this.$refs.summaryTable.doLayout) {
              this.$refs.summaryTable.doLayout();
            }
          });
        }
      });
    },
    getList() {
      this.loading = true;
      listScrapSummaryQuery(this.buildQuery())
        .then((res) => {
          this.dataList = res.rows || [];
          this.total = res.total || 0;
          this.totalInfo = res.totalInfo || { totalQty: 0, totalAmt: 0 };
        })
        .finally(() => {
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
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
        warehouseId: null,
        billStatus: null,
        dateQueryType: "bill",
        beginDate: this.getStatDate(),
        endDate: this.getEndDate()
      };
      this.moreSearchKeywords = {};
      this.onMoreSearchTypesChange();
      this.getList();
    },
    handleExport() {
      this.$modal.msg("导出功能开发中");
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
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  margin-left: auto !important;
  padding: 0 4px !important;
  flex: 0 0 auto !important;
  background: transparent !important;
}
.first-inventory-page .inv-detail-main-table .el-table__header-wrapper th,
.first-inventory-page .inv-detail-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  height: 34px !important;
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
.ctk-query-top-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;
}
.ctk-more-search-bar--hidden {
  display: none !important;
}
.more-search-input--dynamic {
  width: 180px;
}
.query-select-wrapper {
  width: 180px;
}
.query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  gap: 8px;
}
.query-row-second-inner .el-form-item {
  margin-bottom: 0 !important;
}
.ctk-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 138px;
}
.more-search-short-select {
  width: 120px;
}
.ctk-list-toolbar.list-toolbar {
  margin-bottom: 4px;
}
.ctk-list-toolbar .list-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.toolbar-more-search {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.more-search-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}
.more-search-type {
  width: 160px;
}
.table-container {
  margin: 0;
  overflow: hidden;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
}
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 4px 6px !important;
}
.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 6px !important;
}
</style>
