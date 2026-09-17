<template>
  <div class="app-container list-page first-inventory-page material-usage-rank-report ctk-usage-rank-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form
        :model="searchParams"
        ref="queryForm"
        size="small"
        :inline="true"
        class="query-form"
      >
        <div class="ctk-query-top-fields">
          <div class="more-search-dynamic-field more-search-field--text">
            <el-input
              v-model="searchParams.supplierKeyword"
              placeholder="供应商编码/名称"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="t === 'warehouse' ? 'more-search-field--select' : 'more-search-field--text'"
          >
            <template v-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse
                  v-model="searchParams.warehouseId"
                  clearable
                  placeholder="仓库编码/名称/简码搜索"
                />
              </div>
            </template>
            <el-input
              v-else
              v-model="searchParams.materialName"
              placeholder="产品名称/编码/拼音模糊"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </div>
        <!-- 仅用于读写「更多检索」本地默认，界面不展示 -->
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
            <el-form-item label="日期" class="query-item-inline query-item-date-range">
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
            <el-form-item prop="isGz" class="query-item-inline">
              <el-select
                v-model="searchParams.isGz"
                placeholder="高值"
                clearable
                class="more-search-short-select"
              >
                <el-option label="是" value="1" />
                <el-option label="否" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item prop="isBilling" class="query-item-inline">
              <el-select
                v-model="searchParams.isBilling"
                placeholder="计费"
                clearable
                class="more-search-short-select"
              >
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
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
        <el-button
          type="warning"
          size="small"
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <div
          class="toolbar-more-search"
          @mouseenter="onToolbarMoreEnter"
          @mouseleave="onToolbarMoreLeave"
        >
          <span class="more-search-label">更多检索</span>
          <el-select
            ref="toolbarMoreSelect"
            v-model="moreSearchTypes"
            multiple
            collapse-tags
            filterable
            size="small"
            :popper-append-to-body="false"
            placeholder="选择检索条件（可多选）"
            class="more-search-type"
            @change="onMoreSearchTypesChange"
            @visible-change="onToolbarMoreVisibleChange"
          >
            <el-option
              v-for="opt in moreSearchOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <el-button
          type="success"
          size="small"
          icon="el-icon-check"
          class="spd-btn"
          @click="saveMoreSearchDefaults"
        >保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="loadReport" />
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="mainTable"
        class="ctk-usage-rank-main-table"
        v-loading="loading"
        :data="tableList"
        :row-key="getRowKey"
        :row-class-name="ctkRowClassName"
        :height="tableHeight"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblclick"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" header-align="center" class-name="ctk-select-col col-serial-center" />
        <el-table-column type="index" label="序号" width="80" align="center" header-align="center" class-name="col-serial-center">
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (searchParams.pageNum - 1) * searchParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="产品编码"
          prop="materialCode"
          width="145"
          min-width="130"
          align="left"
          header-align="center"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
          class-name="ctk-col-left"
        />
        <el-table-column
          label="产品名称"
          prop="materialName"
          width="185"
          min-width="170"
          align="left"
          header-align="center"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
          class-name="ctk-col-left"
        />
        <el-table-column label="规格" prop="specification" width="110" min-width="100" align="left" header-align="center" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" class-name="ctk-col-left" />
        <el-table-column label="型号" prop="model" width="100" min-width="90" align="left" header-align="center" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" class-name="ctk-col-left" />
        <el-table-column label="单位" prop="unitName" width="100" min-width="90" align="left" header-align="center" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" class-name="ctk-col-left" />
        <el-table-column label="单价" prop="unitPrice" width="130" min-width="120" align="center" resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">{{ formatPrice(scope.row.unitPrice) }}</template>
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
          align="left"
          header-align="center"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
          class-name="ctk-col-left"
        />
        <el-table-column
          label="供应商"
          prop="supplierName"
          width="200"
          min-width="180"
          align="left"
          header-align="center"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
          class-name="ctk-col-left"
        />
        <el-table-column label="占比" width="100" align="center" resizable>
          <template slot-scope="scope">{{ formatPercent(scope.row.ratioPercent) }}</template>
        </el-table-column>
        <el-table-column label="高值" prop="isGzLabel" width="80" align="center" resizable />
        <el-table-column label="备注" prop="remark" min-width="120" align="left" header-align="center" show-overflow-tooltip resizable class-name="ctk-col-left">
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
      <div class="pagination-container">
        <el-pagination
          background
          :current-page="searchParams.pageNum"
          :page-size="searchParams.pageSize"
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
import { listMaterialUsageRank } from "@/api/warehouse/outWarehouse";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import RightToolbar from "@/components/RightToolbar";
import { formatAmount as formatAmountByTenant, formatPrice as formatPriceByTenant } from "@/utils/moneyFormat";
import { formatQuantity } from "@/utils/format-quantity";

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
        { label: "产品名称", value: "materialName" },
        { label: "仓库", value: "warehouse" }
      ],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      selectedRowKeys: [],
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
      numericSortProps: ['unitPrice', 'quantity', 'amount'],
      tableHeight: 400
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.shared.materialUsageRank.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return [];
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
        : this.formatAmount(amt);
    },
    pageTotalQty() {
      return (this.tableList || []).reduce((s, r) => s + this.toNum(r.quantity), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.tableList || []).reduce((s, r) => s + this.toNum(r.amount), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : this.formatAmount(amt);
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateTableHeight());
    }
  },
  mounted() {
    this.initSearchForm();
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.ensureIncomingMoreSearchTypes();
    this.onMoreSearchTypesChange();
    if (this.inline) this.loadReport();
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
  methods: {
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        const h = Math.floor(panel.clientHeight);
        if (h > 120) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.mainTable && this.$refs.mainTable.doLayout) {
              this.$refs.mainTable.doLayout();
            }
          });
        }
      });
    },
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
    handleSizeChange(val) {
      this.searchParams.pageSize = val;
      this.searchParams.pageNum = 1;
      this.applyPagination();
    },
    handleCurrentChange(val) {
      this.searchParams.pageNum = val;
      this.applyPagination();
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
      const supplierKw = form.supplierKeyword != null ? String(form.supplierKeyword).trim() : '';
      q.supplierKeyword = supplierKw || null;
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
      return formatAmountByTenant(this.toNum(v), "--");
    },
    formatPrice(v) {
      if (v == null || v === "") return "--";
      return formatPriceByTenant(this.toNum(v), "--");
    },
    formatQty(v) {
      if (v == null || v === "") return "--";
      const s = formatQuantity(this.toNum(v));
      return s === "" ? "--" : s;
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
    getRowKey(row) {
      if (!row) return '';
      if (row._rowKey) return row._rowKey;
      if (row.materialId != null && row.materialId !== '') return `id:${row.materialId}`;
      return `code:${row.materialCode || ''}|name:${row.materialName || ''}`;
    },
    handleSelectionChange(selection) {
      this.selectedRowKeys = (selection || []).map(row => this.getRowKey(row));
    },
    /** 双击行：切换勾选（已选则取消，未选则选中） */
    handleRowDblclick(row) {
      const table = this.$refs.mainTable;
      if (!table || !row) return;
      const key = this.getRowKey(row);
      const selected = key && this.selectedRowKeys.indexOf(key) !== -1;
      table.toggleRowSelection(row, !selected);
    },
    ctkRowClassName({ row }) {
      const key = this.getRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'ctk-row-selected';
      }
      return '';
    },
    async loadReport() {
      this.loading = true;
      try {
        const q = this.normalizeQuery();
        const res = await listMaterialUsageRank(q);
        const backendRows = Array.isArray(res)
          ? res
          : (Array.isArray(res && res.data) ? res.data : []);
        const rows = backendRows.map((r, idx) => {
          const codeRaw = r.materialCode != null ? r.materialCode : r.code;
          const code = codeRaw != null ? String(codeRaw).trim() : '';
          const row = {
            materialId: r.materialId,
            materialCode: code || "--",
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
          };
          row._rowKey = row.materialId != null && row.materialId !== ''
            ? `id:${row.materialId}`
            : `idx:${idx}|code:${row.materialCode}|name:${row.materialName}`;
          return row;
        });
        this.allRows = rows;
        this.total = rows.length;
        this.selectedRowKeys = [];
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
        this.selectedRowKeys = [];
        this.totalInfo = { totalQty: 0, totalAmt: 0 };
        this.$message && this.$message.error("耗材使用排名加载失败");
      } finally {
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
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
        // 兼容旧缓存：供应商已固定首行，从更多检索中剔除
        const cleaned = parsed.filter(v => allow.has(v) && v !== 'supplierKeyword');
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
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
      }, 120);
    },
    onToolbarMoreVisibleChange(visible) {
      if (!visible) {
        this.toolbarMoreHover = false;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      if (!set.has('materialName')) {
        target.materialName = null;
      }
      if (!set.has('warehouse')) {
        target.warehouseId = null;
      }
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.searchParams);
      this.$nextTick(() => this.updateTableHeight());
    },
    ensureIncomingMoreSearchTypes() {
      const q = this.$props.queryParams || {};
      const extra = [];
      if (q.warehouseId != null && q.warehouseId !== "") extra.push("warehouse");
      if (q.materialName) extra.push("materialName");
      if (!extra.length) return;
      const set = new Set(this.moreSearchTypes || []);
      extra.forEach(t => set.add(t));
      this.moreSearchTypes = Array.from(set);
    }
  }
};
</script>

<style>
/* 取消内层 app-container 的左右 padding；高度由外层 flex 分配，勿再套 100vh
 * 注意：根节点不要写 display:!important，否则会盖掉 v-show 的 display:none，导致多页签叠在一起 */
.app-container.first-inventory-page.material-usage-rank-report {
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

/* 本页「更多检索」多选：与明细表同宽（覆盖 list-page 190px） */
.ctk-usage-rank-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.ctk-usage-rank-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.ctk-usage-rank-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 148px !important;
  min-width: 148px !important;
  max-width: 148px !important;
}
.ctk-usage-rank-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.ctk-usage-rank-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 148px !important;
  max-width: 148px !important;
}
.ctk-usage-rank-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 148px !important;
}

/* 分页行：合计左、翻页右同一行，完整显示不被裁切 */
.material-usage-rank-report.first-inventory-page .pagination-wrapper {
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
.material-usage-rank-report.first-inventory-page .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.material-usage-rank-report.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.material-usage-rank-report.first-inventory-page .pagination-wrapper .pagination-container {
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
.material-usage-rank-report.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

/* 表头样式对齐出/退库明细表 */
.first-inventory-page .ctk-usage-rank-main-table .el-table__header-wrapper th,
.first-inventory-page .ctk-usage-rank-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .ctk-usage-rank-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.first-inventory-page .ctk-usage-rank-main-table th.ctk-col-left .cell {
  text-align: center !important;
  justify-content: center !important;
}
.first-inventory-page .ctk-usage-rank-main-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
}
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr.ctk-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr.ctk-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.first-inventory-page .ctk-usage-rank-main-table th.ctk-select-col,
.first-inventory-page .ctk-usage-rank-main-table td.ctk-select-col,
.first-inventory-page .ctk-usage-rank-main-table th.el-table-column--selection,
.first-inventory-page .ctk-usage-rank-main-table td.el-table-column--selection {
  position: sticky;
  left: 0;
  z-index: 2;
  box-shadow: 2px 0 0 0 #e2e8f0;
}
.first-inventory-page .ctk-usage-rank-main-table th.ctk-select-col,
.first-inventory-page .ctk-usage-rank-main-table th.el-table-column--selection {
  z-index: 3;
  background-color: #f1f5f9;
}
.first-inventory-page .ctk-usage-rank-main-table td.ctk-select-col,
.first-inventory-page .ctk-usage-rank-main-table td.el-table-column--selection {
  background-color: #fff;
}
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr.el-table__row--striped td.ctk-select-col,
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa;
}
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr:hover > td.ctk-select-col,
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF;
}
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr.ctk-row-selected > td.ctk-select-col,
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr.ctk-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF;
}
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr.ctk-row-selected:hover > td.ctk-select-col,
.first-inventory-page .ctk-usage-rank-main-table .el-table__body tr.ctk-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF;
}
</style>

<style scoped>
.app-container {
  margin-top: 0;
  padding-top: 0 !important;
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

.more-search-label {
  color: #606266;
  font-size: 12px;
  line-height: 32px;
  white-space: nowrap;
}
.more-search-type {
  min-width: 148px;
  width: 148px;
  max-width: 148px;
}
.more-search-input--dynamic {
  width: 180px;
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

.table-container ::v-deep .ctk-usage-rank-main-table .el-table__body-wrapper {
  padding-bottom: 0;
  overflow-x: auto !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
}
.table-container ::v-deep .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.table-container ::v-deep .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.table-container ::v-deep .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}
.table-container ::v-deep .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}
.table-container ::v-deep .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #888 !important;
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
/* 指定列：表头居中，明细靠左 */
.table-container ::v-deep .el-table th.ctk-col-left .cell {
  text-align: center !important;
  justify-content: center !important;
}
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
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
</style>
