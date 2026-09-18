<template>
  <div class="app-container list-page first-inventory-page dep-inv-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'department'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </template>
            <template v-else-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseId" />
              </div>
            </template>
            <el-input
              v-else
              v-model="queryParams.materialKeyword"
              placeholder="产品名称/编码"
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
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-end"
              />
            </el-form-item>
            <el-form-item label="单据类型" prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="请选择单据类型" clearable class="query-select-bill-type">
                <el-option label="全部" :value="null" />
                <el-option label="出库" :value="201" />
                <el-option label="退库" :value="401" />
                <el-option label="消耗" :value="601" />
                <el-option label="盘点" :value="602" />
                <el-option label="转科" :value="603" />
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
            <el-option v-for="opt in moreSearchOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <el-button type="success" size="small" icon="el-icon-check" class="spd-btn" @click="saveMoreSearchDefaults">保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="reportTable"
        class="dep-inv-main-table"
        v-loading="loading"
        :data="inOutList"
        :height="tableHeight"
        :row-key="getDetailRowKey"
        :row-class-name="depInvRowClassName"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleDetailRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="dep-select-col col-serial-center" />
        <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单据编号" align="left" header-align="center" class-name="ctk-col-left" prop="billNo" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <el-button type="text" @click="handleView(scope.row)">
              <span>{{ scope.row.billNo }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="单据类型" align="left" header-align="center" class-name="ctk-col-left" prop="billTypeName" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.billTypeName || resolveBillTypeLabel(scope.row.billType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单日期" align="center" prop="billDate" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode"/>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" />
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" prop="specification" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci"/>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" prop="model" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByModel"/>
        <el-table-column label="科室" align="left" header-align="center" class-name="ctk-col-left" prop="departmentName" width="160" min-width="140" show-overflow-tooltip resizable sortable :sort-method="sortByDepartment"/>
        <el-table-column label="仓库" align="left" header-align="center" class-name="ctk-col-left" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="单价" align="center" prop="unitPrice" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice">
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="qty" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByQty">
          <template slot-scope="scope">
            <span :style="{ color: Number(scope.row.qty) >= 0 ? '#67C23A' : '#F56C6C' }">
              {{ Number(scope.row.qty) > 0 ? '+' : '' }}{{ scope.row.qty }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="amount" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.amount">{{ scope.row.amount | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" align="left" header-align="center" class-name="ctk-col-left batch-col-wrap" prop="batchNo" width="150" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByBatchNo"/>
        <el-table-column label="操作人" align="left" header-align="center" class-name="ctk-col-left" prop="createBy" width="100" show-overflow-tooltip resizable />
        <el-table-column label="备注" align="left" header-align="center" class-name="ctk-col-left" prop="remark" min-width="120" show-overflow-tooltip resizable />
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
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

    <el-dialog :title="title" :visible.sync="open" width="80%" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="单据编号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单据类型" prop="billType">
              <el-input :value="form.billTypeName || resolveBillTypeLabel(form.billType)" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单据状态" prop="billStatus">
              <el-select v-model="form.billStatus" :disabled="true" clearable>
                <el-option v-for="dict in dict.type.biz_status"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="制单日期" prop="billDate">
              <el-date-picker v-model="form.billDate" type="date" :disabled="true" value-format="yyyy-MM-dd" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="6">
            <el-form-item label="科室" prop="departmentId">
              <SelectDepartment v-model="form.departmentId" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="操作人" prop="createBy">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" class="spd-btn" @click="cancel">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDepartmentInOutDetail } from "@/api/department/depInventory";
import { exportDepartmentInOutDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "DepartmentInOutDetail",
  dicts: ["biz_status"],
  components: { SelectDepartment, SelectWarehouse, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "耗材", value: "materialKeyword" },
        { label: "科室", value: "department" },
        { label: "仓库", value: "warehouse" }
      ],
      selectedRowKeys: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      tableHeight: 400,
      total: 0,
      inOutList: [],
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      title: "",
      open: false,
      form: {},
      rules: {},
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialKeyword: '',
        departmentId: null,
        warehouseId: null,
        billType: null,
        billStatus: null,
        beginDate: null,
        endDate: null
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.department.depInventory.inout.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    },
    pageTotalQty() {
      return (this.inOutList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.inOutList || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    }
  },
  mounted() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
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
    getDetailRowKey(row) {
      return (row && row._rowKey) || '';
    },
    depInvRowClassName({ row }) {
      const key = this.getDetailRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'dep-row-selected';
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
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByNum(a, b, prop) {
      const va = Number(a[prop]);
      const vb = Number(b[prop]);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortByMaterialCode(a, b) { return this.sortByStr(a, b, r => r.materialCode || ''); },
    sortByMaterialName(a, b) { return this.sortByStr(a, b, r => r.materialName || ''); },
    sortBySpeci(a, b) { return this.sortByStr(a, b, r => r.specification || ''); },
    sortByModel(a, b) { return this.sortByStr(a, b, r => r.model || ''); },
    sortByDepartment(a, b) { return this.sortByStr(a, b, r => r.departmentName || ''); },
    sortByUnitPrice(a, b) { return this.sortByNum(a, b, 'unitPrice'); },
    sortByQty(a, b) { return this.sortByNum(a, b, 'qty'); },
    sortByBatchNo(a, b) { return this.sortByStr(a, b, r => r.batchNo || ''); },
    resolveBillTypeLabel(v) {
      const map = { 201: '出库', 401: '退库', 601: '消耗', 602: '盘点', 603: '转科' };
      if (v == null || v === '') return '';
      return map[v] || String(v);
    },
    getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(queryParams);
      listDepartmentInOutDetail(queryParams).then(response => {
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        this.inOutList = (response.rows || []).map((row, idx) => {
          if (row && !row._rowKey) {
            row._rowKey = `dep-inout-${pageBase + idx}-${row.billNo || ''}-${row.materialCode || ''}-${idx}`;
          }
          return row;
        });
        this.total = response.total != null ? response.total : 0;
        this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      }).catch(() => {
        this.inOutList = [];
        this.total = 0;
        this.totalInfo = { totalQty: 0, totalAmt: 0 };
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass(t) {
      if (['department', 'warehouse'].includes(t)) {
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
        materialKeyword: 'materialKeyword',
        department: 'departmentId',
        warehouse: 'warehouseId'
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
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 };
      this.applyMoreSearchToQueryParams(requestParams);
      this.loading = true;
      try {
        const response = await listDepartmentInOutDetail(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const resolveBillType = (v) => {
          if (v == null || v === "") return "";
          if (typeof v === "string" && !/^\d+$/.test(String(v))) return v;
          return this.resolveBillTypeLabel(v);
        };
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDepartmentInOutDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室进销存明细查询表${dateStr}.xlsx`,
          resolveBillType,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    },
    handleView(row) {
      this.form = { ...row };
      this.open = true;
      this.title = "查看单据";
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: null,
        billNo: null,
        billType: null,
        billStatus: null,
        billDate: null,
        departmentId: null,
        warehouseId: null,
        createBy: null,
        totalAmount: null
      };
      this.resetForm("form");
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
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

.dep-inv-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
}
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
}
.dep-inv-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 160px !important;
}

.first-inventory-page .dep-inv-main-table .el-table__header-wrapper th,
.first-inventory-page .dep-inv-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .dep-inv-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}

.first-inventory-page .dep-inv-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected:hover > td {
  background-color: #A0CBFF !important;
}

.first-inventory-page .dep-inv-main-table th.dep-select-col,
.first-inventory-page .dep-inv-main-table td.dep-select-col,
.first-inventory-page .dep-inv-main-table th.el-table-column--selection,
.first-inventory-page .dep-inv-main-table td.el-table-column--selection {
  position: sticky;
  left: 0;
  z-index: 2;
  box-shadow: 2px 0 0 0 #e2e8f0;
}
.first-inventory-page .dep-inv-main-table th.dep-select-col,
.first-inventory-page .dep-inv-main-table th.el-table-column--selection {
  z-index: 3;
  background-color: #f1f5f9;
}
.first-inventory-page .dep-inv-main-table td.dep-select-col,
.first-inventory-page .dep-inv-main-table td.el-table-column--selection {
  background-color: #fff;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.el-table__row--striped td.dep-select-col,
.first-inventory-page .dep-inv-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr:hover > td.dep-select-col,
.first-inventory-page .dep-inv-main-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected > td.dep-select-col,
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF;
}
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected:hover > td.dep-select-col,
.first-inventory-page .dep-inv-main-table .el-table__body tr.dep-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF;
}
.first-inventory-page .dep-inv-main-table td.dep-select-col .cell,
.first-inventory-page .dep-inv-main-table td.el-table-column--selection .cell,
.first-inventory-page .dep-inv-main-table th.dep-select-col .cell,
.first-inventory-page .dep-inv-main-table th.el-table-column--selection .cell {
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

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-item-inline .el-form-item {
  margin-bottom: 0;
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
.more-search-input--dynamic {
  width: 180px;
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

.query-select-bill-type {
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

.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}
.table-container ::v-deep .dep-inv-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
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

.table-container ::v-deep .el-table td.batch-col-wrap .cell {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}

.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}

.table-container ::v-deep .el-table th.ctk-col-left .cell {
  text-align: center !important;
}
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
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
