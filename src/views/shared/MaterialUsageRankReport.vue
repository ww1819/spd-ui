<template>
  <div class="app-container first-inventory-page material-usage-rank-report">
    <div class="form-fields-container">
      <el-form
        :model="searchParams"
        ref="queryForm"
        size="small"
        :inline="true"
        v-show="showSearch"
        class="query-form"
      >
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="耗材名称" prop="materialName" class="query-item-inline">
              <el-input
                v-model="searchParams.materialName"
                placeholder="名称/编码/拼音模糊"
                clearable
                class="query-input-material-name"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="高值" prop="isGz" class="query-item-inline">
              <el-select
                v-model="searchParams.isGz"
                placeholder="是否高值"
                clearable
                class="query-select-gz"
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
                class="query-select-billing"
              >
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="searchParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="searchParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-end"
              />
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="searchParams.warehouseId" clearable />
              </div>
            </el-form-item>
            <el-form-item label="供应商" prop="supplierKeyword" class="query-item-inline">
              <el-input
                v-model="searchParams.supplierKeyword"
                placeholder="名称/编码/简码"
                clearable
                class="query-input-supplier"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory button-row-inventory-flex">
      <div class="button-row-left">
        <el-button type="warning" icon="el-icon-download" size="medium" @click="handleExport">导出</el-button>
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </div>
      <div class="button-row-right">
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
      const q = { ...(this.$props.queryParams || {}) };
      const begin = this.searchParams.beginDate || this.defaultBeginDate();
      const end = this.searchParams.endDate || this.defaultEndDate();
      q.beginDate = begin.length === 10 ? `${begin} 00:00:00` : begin;
      q.endDate = end.length === 10 ? `${end} 23:59:59` : end;
      q.warehouseId = this.searchParams.warehouseId != null ? this.searchParams.warehouseId : null;
      q.supplerId = null;
      q.supplierKeyword = this.searchParams.supplierKeyword
        ? String(this.searchParams.supplierKeyword).trim()
        : null;
      const materialKw = this.searchParams.materialName
        ? String(this.searchParams.materialName).trim()
        : null;
      q.materialName = materialKw;
      q.materialNameLike = materialKw;
      q.isGz = this.searchParams.isGz != null && this.searchParams.isGz !== ""
        ? String(this.searchParams.isGz)
        : null;
      q.isBilling = this.searchParams.isBilling != null && this.searchParams.isBilling !== ""
        ? String(this.searchParams.isBilling)
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

.query-row-left {
  margin-bottom: 2px;
}

.query-row-second {
  margin-bottom: 2px;
  position: relative;
}

.query-input-material-name {
  width: 170px;
}

.query-select-gz {
  width: 130px;
}

.query-select-billing {
  width: 120px;
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
.query-item-date-range .query-date-sep {
  margin: 0 2px;
  flex-shrink: 0;
}

.query-select-wrapper {
  width: 180px;
}

.query-input-supplier {
  width: 200px;
}

.form-fields-container {
  background: #fff;
  padding: 6px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
  border: 1px solid #ebeef5;
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
