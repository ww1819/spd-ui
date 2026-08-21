<template>
  <div class="app-container list-page first-inventory-page material-usage-rank-report">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form
        :model="searchParams"
        ref="queryForm"
        size="small"
        :inline="true"
        class="query-form"
      >
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
                <SelectWarehouse v-model="searchParams.warehouseId" clearable />
              </div>
            </template>
            <el-input
              v-else-if="t === 'supplierKeyword'"
              v-model="searchParams.supplierKeyword"
              placeholder="供应商名称/编码/简码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="searchParams.materialName"
              placeholder="耗材名称/编码/拼音模糊"
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
                v-model="searchParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="searchParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker query-date-end"
              />
            </el-form-item>
            <el-form-item label="高值" prop="isGz" class="query-item-inline">
              <el-select
                v-model="searchParams.isGz"
                placeholder="是否高值"
                clearable
                class="more-search-short-select"
              >
                <el-option label="是" value="1" />
                <el-option label="否" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="是否计费" prop="isBilling" class="query-item-inline">
              <el-select
                v-model="searchParams.isBilling"
                placeholder="请选择"
                clearable
                class="more-search-short-select"
              >
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="handleExport">导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="loadReport" />
      </div>
    </el-row>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tableList"
        height="60vh"
        border
        size="small"
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" label="序号" width="70" align="center" fixed="left">
          <template slot-scope="scope">
            {{ (searchParams.pageNum - 1) * searchParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column
          label="耗材名称"
          prop="materialName"
          width="185"
          min-width="170"
          align="center"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
        />
        <el-table-column label="规格" prop="specification" width="110" min-width="100" align="center" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="型号" prop="model" width="100" min-width="90" align="center" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="单位" prop="unitName" width="100" min-width="90" align="center" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="单价" prop="unitPrice" width="130" min-width="120" align="center" resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">{{ formatAmount(scope.row.unitPrice) }}</template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" width="110" min-width="100" align="center" resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">{{ formatQty(scope.row.quantity) }}</template>
        </el-table-column>
        <el-table-column label="金额" prop="amount" width="130" min-width="120" align="center" resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">{{ formatAmount(scope.row.amount) }}</template>
        </el-table-column>
        <el-table-column
          label="生产厂家"
          prop="factoryName"
          width="180"
          min-width="160"
          align="center"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
        />
        <el-table-column
          label="供应商"
          prop="supplierName"
          width="200"
          min-width="180"
          align="center"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
        />
        <el-table-column label="占比" width="100" align="center" resizable>
          <template slot-scope="scope">{{ formatPercent(scope.row.ratioPercent) }}</template>
        </el-table-column>
        <el-table-column label="高值" prop="isGzLabel" width="80" align="center" resizable />
        <el-table-column label="备注" prop="remark" min-width="120" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.remark || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>
        总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，
        总金额: {{ totalAmtFormatted }}，
        当前页数量: {{ pageTotalQty }}，
        当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <pagination
        :total="total"
        :page.sync="searchParams.pageNum"
        :limit.sync="searchParams.pageSize"
        @pagination="applyPagination"
      />
    </div>
  </div>
</template>

<script>
import { listMaterialUsageRank } from "@/api/warehouse/outWarehouse";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "MaterialUsageRankReport",
  components: { SelectWarehouse, RightToolbar },
  props: {
    queryParams: { type: Object, default: () => ({}) },
    inline: { type: Boolean, default: false }
  },
  data() {
    return {
      loading: false,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "耗材名称", value: "materialName" },
        { label: "仓库", value: "warehouse" },
        { label: "供应商", value: "supplierKeyword" }
      ],
      allRows: [],
      tableList: [],
      total: 0,
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      searchParams: {
        pageNum: 1,
        pageSize: 10,
        beginDate: null,
        endDate: null,
        warehouseId: null,
        supplierKeyword: null,
        materialName: null,
        isGz: null,
        isBilling: null
      },
      sortProp: null,
      sortOrder: null,
      numericSortProps: ['unitPrice', 'quantity', 'amount']
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.shared.materialUsageRank.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    },
    sortedAllRows() {
      const list = [...(this.allRows || [])];
      if (!this.sortProp || !this.sortOrder) {
        return list;
      }
      const prop = this.sortProp;
      const asc = this.sortOrder === 'ascending';
      const isNumeric = this.numericSortProps.includes(prop);
      list.sort((a, b) => {
        let va = a[prop];
        let vb = b[prop];
        if (isNumeric) {
          va = this.toNum(va);
          vb = this.toNum(vb);
          return asc ? va - vb : vb - va;
        }
        va = va != null ? String(va) : '';
        vb = vb != null ? String(vb) : '';
        const cmp = va.localeCompare(vb, 'zh-CN');
        return asc ? cmp : -cmp;
      });
      return list;
    },
    totalAmtFormatted() {
      const amt = this.totalInfo.totalAmt != null ? this.totalInfo.totalAmt : 0;
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : Number(amt).toFixed(2);
    },
    pageTotalQty() {
      return (this.tableList || []).reduce((s, r) => s + this.toNum(r.quantity), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.tableList || []).reduce((s, r) => s + this.toNum(r.amount), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : Number(amt).toFixed(2);
    }
  },
  mounted() {
    this.initSearchForm();
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.ensureIncomingMoreSearchTypes();
    this.onMoreSearchTypesChange();
    if (this.inline) this.loadReport();
  },
  methods: {
    defaultBeginDate() {
      const now = new Date();
      const y = now.getFullYear();
      const m = `${now.getMonth() + 1}`.padStart(2, "0");
      return `${y}-${m}-01`;
    },
    defaultEndDate() {
      return this.fmtDate(new Date());
    },
    initSearchForm() {
      const q = this.$props.queryParams || {};
      this.searchParams.beginDate = q.beginDate ? String(q.beginDate).slice(0, 10) : this.defaultBeginDate();
      this.searchParams.endDate = q.endDate ? String(q.endDate).slice(0, 10) : this.defaultEndDate();
      this.searchParams.warehouseId = q.warehouseId != null ? q.warehouseId : null;
      this.searchParams.supplierKeyword = q.supplierKeyword ? String(q.supplierKeyword) : null;
      this.searchParams.materialName = q.materialName ? String(q.materialName) : null;
      this.searchParams.isGz = q.isGz != null ? String(q.isGz) : null;
      this.searchParams.isBilling = q.isBilling != null ? String(q.isBilling) : null;
    },
    handleQuery() {
      this.searchParams.pageNum = 1;
      this.loadReport();
    },
    resetQuery() {
      this.searchParams.beginDate = this.defaultBeginDate();
      this.searchParams.endDate = this.defaultEndDate();
      this.searchParams.warehouseId = null;
      this.searchParams.supplierKeyword = null;
      this.searchParams.materialName = null;
      this.searchParams.isGz = null;
      this.searchParams.isBilling = null;
      this.searchParams.pageNum = 1;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.loadReport();
    },
    fmtDate(d) {
      const x = new Date(d);
      if (Number.isNaN(x.getTime())) return "";
      const y = x.getFullYear();
      const m = `${x.getMonth() + 1}`.padStart(2, "0");
      const day = `${x.getDate()}`.padStart(2, "0");
      return `${y}-${m}-${day}`;
    },
    normalizeQuery() {
      const form = { ...this.searchParams };
      this.applyMoreSearchToQueryParams(form);
      const q = { ...(this.$props.queryParams || {}) };
      const begin = form.beginDate || this.defaultBeginDate();
      const end = form.endDate || this.defaultEndDate();
      q.beginDate = begin.length === 10 ? `${begin} 00:00:00` : begin;
      q.endDate = end.length === 10 ? `${end} 23:59:59` : end;
      q.warehouseId = form.warehouseId != null ? form.warehouseId : null;
      q.supplerId = null;
      q.supplierKeyword = form.supplierKeyword
        ? String(form.supplierKeyword).trim()
        : null;
      const materialKw = form.materialName
        ? String(form.materialName).trim()
        : null;
      q.materialName = materialKw;
      q.materialNameLike = materialKw;
      q.isGz = form.isGz != null && form.isGz !== ""
        ? String(form.isGz)
        : null;
      q.isBilling = form.isBilling != null && form.isBilling !== ""
        ? String(form.isBilling)
        : null;
      Object.keys(q).forEach((k) => {
        if (q[k] === "") q[k] = null;
      });
      return q;
    },
    toNum(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    },
    formatAmount(v) {
      if (v == null || v === "") return "--";
      return this.toNum(v).toFixed(2);
    },
    formatQty(v) {
      if (v == null || v === "") return "--";
      const n = this.toNum(v);
      return Number.isInteger(n) ? String(n) : n.toFixed(2);
    },
    formatPercent(v) {
      if (v == null || v === "") return "--";
      return `${this.toNum(v).toFixed(2)}%`;
    },
    applyPagination() {
      const { pageNum, pageSize } = this.searchParams;
      const start = (pageNum - 1) * pageSize;
      this.tableList = this.sortedAllRows.slice(start, start + pageSize);
    },
    handleSortChange({ prop, order }) {
      this.sortProp = order ? prop : null;
      this.sortOrder = order || null;
      this.searchParams.pageNum = 1;
      this.applyPagination();
    },
    async loadReport() {
      this.loading = true;
      try {
        const q = this.normalizeQuery();
        const backendRows = await listMaterialUsageRank(q);
        const rows = (Array.isArray(backendRows) ? backendRows : []).map((r) => ({
          materialId: r.materialId,
          materialName: r.materialName || "--",
          specification: r.specification || "--",
          model: r.model || "--",
          unitName: r.unitName || "--",
          unitPrice: r.unitPrice,
          quantity: r.quantity,
          amount: r.amount,
          factoryName: r.factoryName || "--",
          supplierName: r.supplierName || "--",
          ratioPercent: r.ratioPercent,
          isGzLabel: r.isGzLabel || "否",
          remark: r.remark || ""
        }));
        this.allRows = rows;
        this.total = rows.length;
        this.totalInfo = rows.reduce(
          (acc, r) => {
            acc.totalQty += this.toNum(r.quantity);
            acc.totalAmt += this.toNum(r.amount);
            return acc;
          },
          { totalQty: 0, totalAmt: 0 }
        );
        this.applyPagination();
      } catch (e) {
        this.allRows = [];
        this.tableList = [];
        this.total = 0;
        this.totalInfo = { totalQty: 0, totalAmt: 0 };
        this.$message && this.$message.error("耗材使用排名加载失败");
      } finally {
        this.loading = false;
      }
    },
    handleExport() {
      const q = this.normalizeQuery();
      this.download(
        "warehouse/rthWarehouse/materialUsageRank/export",
        q,
        `耗材使用排名_${new Date().getTime()}.xlsx`
      );
    },
    moreSearchFieldClass(t) {
      if (t === "warehouse") {
        return "more-search-field--select";
      }
      return "more-search-field--text";
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
        materialName: "materialName",
        warehouse: "warehouseId",
        supplierKeyword: "supplierKeyword"
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.searchParams);
    },
    ensureIncomingMoreSearchTypes() {
      const q = this.$props.queryParams || {};
      const extra = [];
      if (q.warehouseId != null && q.warehouseId !== "") extra.push("warehouse");
      if (q.materialName) extra.push("materialName");
      if (q.supplierKeyword) extra.push("supplierKeyword");
      if (!extra.length) return;
      const set = new Set(this.moreSearchTypes || []);
      extra.forEach(t => set.add(t));
      this.moreSearchTypes = Array.from(set);
    }
  }
};
</script>

<style>
.app-container.first-inventory-page.material-usage-rank-report {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.material-usage-rank-report.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.material-usage-rank-report.first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
.material-usage-rank-report.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.material-usage-rank-report.first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.material-usage-rank-report.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}
</style>

<style scoped>
.material-usage-rank-report {
  margin-top: -10px;
}

.list-query-panel {
  margin-top: -20px;
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

.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  min-width: 0;
}

.table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 16px;
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}

.first-inventory-page {
  position: relative;
  min-height: 400px;
}
</style>
