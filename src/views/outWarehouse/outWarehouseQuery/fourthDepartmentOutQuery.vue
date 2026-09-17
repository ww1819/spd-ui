<template>
  <div class="app-container list-page first-inventory-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div
          class="ctk-more-search-fields"
          :class="{ 'ctk-more-search-fields--empty': !moreSearchTypes.length }"
        >
          <more-search-bar
            ref="moreSearchBar"
            v-model="moreSearchTypes"
            :options="moreSearchOptions"
            :storage-key="moreSearchStorageKey"
            :default-types="builtInMoreSearchDefaults"
            :auto-load="false"
            :show-picker="false"
            :show-save="false"
            :show-search-actions="false"
            @change="onMoreSearchTypesChange"
            @search="handleQuery"
            @reset="resetQuery"
          >
            <div
              v-for="t in moreSearchTypes"
              :key="t"
              class="more-search-dynamic-field more-search-field--select"
            >
              <template v-if="t === 'warehouse'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="高值"/>
                </div>
              </template>
              <template v-else-if="t === 'department'">
                <div class="query-select-wrapper more-search-select-wrap">
                  <SelectDepartment v-model="queryParams.departmentId" />
                </div>
              </template>
            </div>
          </more-search-bar>
        </div>

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

            <el-form-item label="供应商" prop="supplerId" class="query-item-inline">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectSupplier v-model="queryParams.supplerId" />
              </div>
            </el-form-item>
            <div class="ctk-query-actions query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
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
          class="spd-btn"
          @click="saveMoreSearchDefaults"
        >保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="mainTable"
        v-loading="loading"
        :data="pagedList"
        show-summary
        :summary-method="getTotalSummaries"
        :height="tableHeight"
        border
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="科室" align="center" prop="departmentName" width="200" min-width="180" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">
            <span>{{ scope.row.departmentName || (scope.row.department && scope.row.department.name) || '未维护科室' }}</span>
          </template>
        </el-table-column>
        <!-- 按耗材档案「是否高值」(isGz=1) 分列：高值耗材 / 低值耗材（净金额：出库加、退库减） -->
        <el-table-column
          label="高值耗材"
          prop="catAmt_0"
          align="center"
          width="120"
          min-width="110"
          show-overflow-tooltip
          resizable
        >
          <template slot-scope="scope">
            <span>{{ formatCategoryCell(scope.row, 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="低值耗材"
          prop="catAmt_1"
          align="center"
          width="120"
          min-width="110"
          show-overflow-tooltip
          resizable
        >
          <template slot-scope="scope">
            <span>{{ formatCategoryCell(scope.row, 1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="净出库数量" align="center" prop="netQty" width="155" min-width="145" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']"/>
        <el-table-column label="净出库金额" align="center" prop="netAmt" width="165" min-width="155" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
          <template slot-scope="scope">
            <span>{{ formatNetCurrency(scope.row.netAmt) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>净出库数量: {{ totalNetQty }}，净出库金额: {{ totalNetAmtFormatted }}，当前页净出库数量: {{ pageNetQty }}，当前页净出库金额: {{ pageNetAmtFormatted }}
      </div>
      <div class="pagination-container">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          :pager-count="11"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { listCTKWarehouseSummary } from "@/api/warehouse/outWarehouse";
import { exportDepartmentSummaryStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "fourthDepartmentOutQuery",
  components: { SelectWarehouse, SelectDepartment, SelectSupplier, RightToolbar },
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      totalInfo: {
        outQty: 0,
        outAmt: 0,
        retQty: 0,
        retAmt: 0,
        netQty: 0,
        netAmt: 0
      },
      // 后端返回的明细（汇总表数据行）
      rawList: [],
      // 科室聚合后的全量列表（用于前端分页）
      departmentAggList: [],
      /** 出/退库汇总(科室) 金额分列：高值耗材 catAmt_0、低值耗材 catAmt_1（与耗材档案 isGz 一致） */
      gzLowColumnLabels: ['高值耗材', '低值耗材'],
      moreSearchTypes: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      moreSearchOptions: [
        { value: "warehouse", label: "仓库" },
        { value: "department", label: "出库科室" }
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        supplerId: null,
        warehouseId: null,
        departmentId: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      sortProp: null,
      sortOrder: null,
      numericSortProps: ['catAmt_0', 'catAmt_1', 'netQty', 'netAmt'],
      tableHeight: 400
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.outWarehouse.query.fourth.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["warehouse", "department"];
    },
    sortedDepartmentAggList() {
      const list = [...(this.departmentAggList || [])];
      if (!this.sortProp || !this.sortOrder) {
        return list;
      }
      const prop = this.sortProp;
      const asc = this.sortOrder === 'ascending';
      if (prop === 'departmentName') {
        list.sort((a, b) => {
          const va = (a.departmentName || (a.department && a.department.name) || '').toString();
          const vb = (b.departmentName || (b.department && b.department.name) || '').toString();
          const cmp = va.localeCompare(vb, 'zh-CN');
          return asc ? cmp : -cmp;
        });
        return list;
      }
      const isNumeric = this.numericSortProps.includes(prop);
      list.sort((a, b) => {
        let va = a[prop];
        let vb = b[prop];
        if (isNumeric) {
          va = Number(va) || 0;
          vb = Number(vb) || 0;
          return asc ? va - vb : vb - va;
        }
        va = va != null ? String(va) : '';
        vb = vb != null ? String(vb) : '';
        const cmp = va.localeCompare(vb, 'zh-CN');
        return asc ? cmp : -cmp;
      });
      return list;
    },
    pagedList() {
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
      const end = start + this.queryParams.pageSize;
      return this.sortedDepartmentAggList.slice(start, end);
    },
    /** 全量净出库数量 */
    totalNetQty() {
      return Number(this.totalInfo.netQty || 0);
    },
    /** 全量净出库金额（格式化） */
    totalNetAmtFormatted() {
      return this.formatNetCurrency(this.totalInfo.netAmt || 0);
    },
    /** 当前页净出库数量 */
    pageNetQty() {
      return (this.pagedList || []).reduce((s, r) => s + Number(r.netQty || 0), 0);
    },
    /** 当前页净出库金额（格式化） */
    pageNetAmtFormatted() {
      const amt = (this.pagedList || []).reduce((s, r) => s + Number(r.netAmt || 0), 0);
      return this.formatNetCurrency(amt);
    },
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateTableHeight());
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
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
    handleSortChange({ prop, order }) {
      this.sortProp = order ? prop : null;
      this.sortOrder = order || null;
      this.queryParams.pageNum = 1;
    },
    /** 汇总行金额展示（分类净额，可为负；0 显示 0.00 而非全局 formatCurrency 的「-」） */
    formatCategoryCell(row, catIdx) {
      const v = row && row[`catAmt_${catIdx}`] != null ? Number(row[`catAmt_${catIdx}`]) : 0;
      if (!Number.isFinite(v) || v === 0) {
        return '0.00';
      }
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      return fmt ? fmt(v) : this.formatAmount(v);
    },
    /** 净出库金额：0 显示 0.00（避免 formatCurrency 将 0 当成空） */
    formatNetCurrency(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n === 0) {
        return '0.00';
      }
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      return fmt ? fmt(n) : this.formatAmount(n);
    },
    /**
     * 是否高值耗材：产品档案 isGz=1 为高值，其余归入低值列
     * （汇总接口 materialIsGz / material.isGz，与 fd_material.is_gz 一致）
     */
    isMaterialHighValue(r) {
      const raw =
        r.materialIsGz != null && r.materialIsGz !== ''
          ? r.materialIsGz
          : (r.material && r.material.isGz != null && r.material.isGz !== '' ? r.material.isGz : null);
      if (raw === null || raw === undefined || raw === '') return false;
      const s = String(raw).trim();
      return s === '1';
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill('');
      if (sums.length > 0) sums[0] = '合计';

      const totalNetQty = (data || []).reduce((acc, r) => acc + Number(r.netQty || 0), 0);
      const totalNetAmt = (data || []).reduce((acc, r) => acc + Number(r.netAmt || 0), 0);

      const fmt = this.$options.filters && this.$options.filters.formatCurrency;

      columns.forEach((column, index) => {
        const prop = column.property;
        if (prop && String(prop).startsWith('catAmt_')) {
          const idx = parseInt(String(prop).replace('catAmt_', ''), 10);
          if (!Number.isNaN(idx)) {
            const t = (data || []).reduce((acc, r) => acc + Number((r && r[`catAmt_${idx}`]) || 0), 0);
            sums[index] = !Number.isFinite(t) || t === 0 ? '0.00' : fmt ? fmt(t) : this.formatAmount(t);
          }
          return;
        }
        switch (prop) {
          case 'netQty':
            sums[index] = this.formatQty(totalNetQty);
            break;
          case 'netAmt':
            sums[index] = this.formatNetCurrency(totalNetAmt);
            break;
          default:
            break;
        }
      });
      return sums;
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
      if (!set.has("department")) target.departmentId = null;
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
      this.$nextTick(() => this.updateTableHeight());
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
    normalizeQueryParams() {
      const queryParams = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(queryParams);
      if (!queryParams.beginDate) queryParams.beginDate = null;
      if (!queryParams.endDate) {
        queryParams.endDate = null;
      } else if (queryParams.endDate && queryParams.endDate.length === 10) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '') queryParams[key] = null;
      });
      return queryParams;
    },
    getList() {
      this.loading = true;
      const queryParams = this.normalizeQueryParams();
      // 为了科室汇总准确性，优先拉取较大 pageSize 做前端分组，再前端分页
      const requestParams = {
        ...queryParams,
        pageNum: 1,
        pageSize: 10000,
      };
      listCTKWarehouseSummary(requestParams).then(response => {
        const rows = (response && response.rows) ? response.rows : (Array.isArray(response) ? response : []);
        this.rawList = rows.map(item => ({
          ...item,
          materialAmt: item.materialAmt != null ? Number(item.materialAmt) : 0,
          materialQty: item.materialQty != null ? Number(item.materialQty) : 0,
          billType: item.billType != null ? Number(item.billType) : null,
          materialIsGz: item.materialIsGz != null && item.materialIsGz !== ''
            ? item.materialIsGz
            : (item.material && item.material.isGz),
        }));
        this.buildDepartmentAgg();
        this.total = this.departmentAggList.length;
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      }).catch(() => {
        this.rawList = [];
        this.departmentAggList = [];
        this.total = 0;
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      });
    },
    buildDepartmentAgg() {
      const BILL_OUT = 201;
      const BILL_RET = 401;
      const IDX_HIGH = 0;
      const IDX_LOW = 1;

      const map = new Map();
      (this.rawList || []).forEach(r => {
        const did = r.departmentId != null && r.departmentId !== '' ? String(r.departmentId) : null;
        const departmentName = (r.departmentName || (r.department && r.department.name) || '').trim() || '未维护科室';
        const key = did != null ? `id:${did}` : `name:${departmentName}`;
        if (!map.has(key)) {
          const init = {
            departmentId: r.departmentId,
            departmentName,
            outQty: 0,
            outAmt: 0,
            retQty: 0,
            retAmt: 0,
            catAmt_0: 0,
            catAmt_1: 0,
          };
          map.set(key, init);
        }
        const agg = map.get(key);
        const bt = r.billType != null ? Number(r.billType) : null;
        const qty = Number(r.materialQty || 0);
        const amt = Number(r.materialAmt || 0);
        const ci = this.isMaterialHighValue(r) ? IDX_HIGH : IDX_LOW;
        if (agg[`catAmt_${ci}`] != null) {
          // 高值/低值列净金额：出库加、退库减（与本科室净出库金额口径一致）
          if (bt === BILL_RET) {
            agg[`catAmt_${ci}`] -= amt;
          } else {
            agg[`catAmt_${ci}`] += amt;
          }
        }
        if (bt === BILL_OUT) {
          agg.outQty += qty;
          agg.outAmt += amt;
        } else if (bt === BILL_RET) {
          agg.retQty += qty;
          agg.retAmt += amt;
        } else {
          agg.outQty += qty;
          agg.outAmt += amt;
        }
      });
      this.departmentAggList = Array.from(map.values())
        .map((row) => ({
          ...row,
          netQty: row.outQty - row.retQty,
          netAmt: row.outAmt - row.retAmt,
        }))
        .sort((a, b) => b.netAmt - a.netAmt);
      this.totalInfo = this.departmentAggList.reduce(
        (acc, r) => {
          acc.outQty += r.outQty;
          acc.outAmt += r.outAmt;
          acc.retQty += r.retQty;
          acc.retAmt += r.retAmt;
          acc.netQty += r.netQty;
          acc.netAmt += r.netAmt;
          return acc;
        },
        { outQty: 0, outAmt: 0, retQty: 0, retAmt: 0, netQty: 0, netAmt: 0 }
      );
      this.queryParams.pageNum = 1;
    },
    handleQuery() {
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
    },
    /** 导出按钮操作：xlsx，合并标题、边框、合计行红色数字 */
    async handleExport() {
      const rows = this.departmentAggList || [];
      if (!rows.length) {
        this.$message && this.$message.warning('暂无数据可导出');
        return;
      }
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `出退库汇总(科室)${dateStr}.xlsx`;
      try {
        await exportDepartmentSummaryStyledXlsx({
          warehouseCategoryNames: this.gzLowColumnLabels || [],
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      }
    },
    getStatDate() {
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
    },
    getEndDate() {
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
    },
  },
};
</script>

<style scoped>
/* 与库存明细查询保持一致的顶部偏移 */
.app-container {
  margin-top: 0;
  padding-top: 0 !important;
}

/* 查询条件样式（与 secondOutQuery.vue 完全一致） */
.query-row-left {
  margin-bottom: 2px;
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
  margin-top: 8px;
  margin-bottom: 0;
}

/* 第二行：固定条件 + 搜索/重置，与耗材产品维护底行一致 */
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

.ctk-more-search-fields {
  margin-bottom: 0;
}
.ctk-more-search-fields--empty {
  display: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}
.ctk-more-search-fields:not(.ctk-more-search-fields--empty) + .query-row-second {
  margin-top: 8px;
}
.ctk-more-search-fields--empty + .query-row-second {
  margin-top: 0;
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

/* 查询条件容器框样式：由外层 inventory-query-page 统一左右 8px，此处占满内容区 */
.form-fields-container {
  margin-bottom: 4px;
  margin-top: 0;
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
}

/* 工具栏与表间距：与明细/汇总一致（4px） */
.ctk-list-toolbar.list-toolbar {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  flex: 0 0 auto;
}

/* 导出/搜索/重置：与顶部搜索框、底部明细框间距均为 8px */
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

/* 明细表底部合计行：给表体底部留空间，并把 footer-wrapper 抬高，避免横向滚动条遮挡 */
.table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 32px;
}

.table-container ::v-deep .el-table__footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 3;
  background: #fff;
}

.table-container ::v-deep .el-table__fixed-footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 4;
  background: #fff;
}

.table-container ::v-deep .el-table thead th.el-table__cell > .cell {
  white-space: nowrap;
  line-height: 23px;
}

/* 合计行数量/金额等单元格不要自动换行，避免合计撑高 */
.table-container ::v-deep .el-table__footer-wrapper td.el-table__cell,
.table-container ::v-deep .el-table__footer-wrapper .cell {
  white-space: nowrap;
  overflow: visible;
  text-overflow: initial;
}
.table-container ::v-deep .el-table__fixed-footer-wrapper td.el-table__cell,
.table-container ::v-deep .el-table__fixed-footer-wrapper .cell {
  white-space: nowrap;
  overflow: visible;
  text-overflow: initial;
}

/* 表格底部横向滚动条：默认 6px，鼠标悬停自动变粗 12px */
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 6px;
  transition: height 0.2s ease;
}
.table-container:hover ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 3px;
  margin: 0 2px;
  cursor: pointer;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 3px;
  cursor: grab;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #808080;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #606060;
  cursor: grabbing;
}

/* 优化表格列间距 */
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}
</style>

<style>
/* 取消内层 app-container 的左右 padding；高度由外层 flex 分配，勿再套 100vh
 * 注意：根节点不要写 display:!important，否则会盖掉 v-show 的 display:none，导致多页签叠在一起 */
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

/* 本页「更多检索」多选：尽量 148px */
.first-inventory-page .ctk-list-toolbar .toolbar-more-search .more-search-type,
.first-inventory-page .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.first-inventory-page .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 148px !important;
  min-width: 148px !important;
  max-width: 148px !important;
}
.first-inventory-page .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.first-inventory-page .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 148px !important;
  max-width: 148px !important;
}
.first-inventory-page .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 148px !important;
}

/* 分页行：合计左、翻页右同一行，完整显示不被裁切 */
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
</style>

