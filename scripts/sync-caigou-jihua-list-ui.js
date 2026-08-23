/**
 * 采购计划列表页 UI 对齐到货验收 inWarehouse/apply
 */
const fs = require('fs');

const JIHUA_PATH = 'e:/workspace/spd-ui/src/views/caigou/jihua/index.vue';
const REF_PATH = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';

let jihua = fs.readFileSync(JIHUA_PATH, 'utf8');
const ref = fs.readFileSync(REF_PATH, 'utf8');

// --- 搜索区 ---
const searchNew = `<div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.planNo"
              placeholder="计划单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="设备"/>
            </div>
            <div class="query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
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
            </el-form-item>
            <el-form-item prop="planStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.planStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option v-for="dict in planStatusFilterOptions"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="isGz" class="query-item-inline">
              <el-select v-model="queryParams.isGz" placeholder="高值/低值" clearable class="apply-query-field">
                <el-option label="高值" value="1" />
                <el-option label="低值" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item prop="totalAmount" class="query-item-inline">
              <el-input v-model="queryParams.totalAmount"
                        placeholder="金额"
                        clearable
                        class="apply-query-input apply-query-field"
                        @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item prop="planSource" class="query-item-inline">
              <el-select v-model="queryParams.planSource" placeholder="计划来源"
                         clearable class="apply-query-field">
                <el-option label="手工制单" value="手工制单" />
                <el-option label="科室计划" value="科室计划" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>`;

const searchOld = jihua.match(
  /<div class="form-fields-container list-query-panel"[\s\S]*?<\/el-form>\s*<\/div>/
);
if (!searchOld) throw new Error('search block not found');
jihua = jihua.replace(searchOld[0], searchNew);

// --- 主表 + 分页 ---
const tableOld = jihua.match(
  /<el-table v-loading="loading" :data="warehouseList"[\s\S]*?<\/el-table>\s*\n\s*<pagination[\s\S]*?\/>\s*/
);
if (!tableOld) throw new Error('table block not found');

const tableNew = `<div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="warehouseList"
              class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.planNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="高值/低值" align="center" width="90" show-overflow-tooltip resizable sortable :sort-method="sortByIsGz">
        <template slot-scope="scope">
          <span>{{ formatIsGzLabel(scope.row.isGz) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="totalAmount" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByAmount">
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount != null && scope.row.totalAmount !== ''">{{ formatPrice4(scope.row.totalAmount) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="planStatus" width="110" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.plan_status" :value="scope.row.planStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createByName" width="130" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName" class-name="plan-creator-col" label-class-name="plan-creator-col">
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByCreateTime">
        <template slot-scope="scope">
          <span>{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : (scope.row.planDate ? parseTime(scope.row.planDate, '{y}-{m}-{d} {h}:{i}:{s}') : '--') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" align="center" width="180" show-overflow-tooltip resizable sortable :sort-method="sortBySubmitTime">
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="提交人" align="center" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName">
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" show-overflow-tooltip resizable sortable :sort-method="sortByAuditorName">
        <template slot-scope="scope">
          {{ getAuditorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="计划来源" align="center" prop="planSource" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.planSource">{{ scope.row.planSource }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核意见" align="center" prop="auditOpinion" show-overflow-tooltip resizable sortable />
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width plan-op-col" fixed="right" width="220" resizable>
        <template slot-scope="scope">
          <div class="plan-table-actions">
            <el-button
              size="small"
              type="text"
              class="plan-table-action-btn"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['caigou:jihua:edit']"
              v-if="isPlanEditable(scope.row)"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              class="plan-table-action-btn"
              @click="handleView(scope.row)"
              v-if="!isPlanEditable(scope.row)"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              class="plan-table-action-btn"
              @click="handleDelete(scope.row)"
              v-hasPermi="['caigou:jihua:remove']"
              v-if="isPlanEditable(scope.row)"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              class="plan-table-action-btn"
              @click="handleProgress(scope.row)"
            >进度</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
    </div>
    </div>

`;

jihua = jihua.replace(tableOld[0], tableNew);

// --- data ---
jihua = jihua.replace(
  /showSearch: true,\s*moreSearchTypes: \[\],\s*moreSearchOptions: \[[\s\S]*?\],\s*/,
  'showSearch: true,\n      mainTableHeight: 400,\n      selectedRowMap: {},\n      '
);

if (!jihua.includes('_lastSidebarNavTick')) {
  jihua = jihua.replace(
    /(applyBillHeaderList: \[\]\s*)\n(\s*\};)/,
    '$1,\n      _lastSidebarNavTick: null\n$2'
  );
}

// --- lifecycle ---
jihua = jihua.replace(
  /created\(\) \{\s*console\.time\('\[Plan\] created->getList'\);\s*this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.getList\(true\);\s*this\.getUserList\(\);\s*console\.timeEnd\('\[Plan\] created->getList'\);\s*\},\s*mounted\(\) \{\s*\/\/ 预绑定防抖搜索，避免频繁请求\s*this\.debouncedQuery = this\.\$_\.debounce\(\(\) => \{\s*this\.handleQuery\(\);\s*\}, 300\);\s*\},\s*beforeDestroy\(\) \{\s*\/\/ 清理定时器\s*if \(this\.qtyChangeTimer\) \{\s*clearTimeout\(this\.qtyChangeTimer\);\s*\}\s*if \(this\.planAutoSaveTimer\) \{\s*clearTimeout\(this\.planAutoSaveTimer\);\s*\}\s*if \(this\._layoutEntryTimer\) \{\s*clearTimeout\(this\._layoutEntryTimer\);\s*\}\s*\},\s*computed: \{\s*moreSearchStorageKey\(\) \{[\s\S]*?builtInMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/,
  `created() {
    console.time('[Plan] created->getList');
    this.getList(true);
    this.getUserList();
    console.timeEnd('[Plan] created->getList');
  },
  mounted() {
    this.debouncedQuery = this.$_.debounce(() => {
      this.handleQuery();
    }, 300);
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
    if (this.qtyChangeTimer) {
      clearTimeout(this.qtyChangeTimer);
    }
    if (this.planAutoSaveTimer) {
      clearTimeout(this.planAutoSaveTimer);
    }
    if (this._layoutEntryTimer) {
      clearTimeout(this._layoutEntryTimer);
    }
  },
  computed: {
    `
);

// --- watch merge ---
jihua = jihua.replace(
  /watch: \{\s*open\(val\) \{/,
  `watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    },
    open(val) {`
);

// --- methods ---
const layoutMethods = `onApplyWindowResize() {
      this.updateMainTableHeight();
    },
    scheduleApplyLayoutRefresh() {
      const run = () => this.updateMainTableHeight();
      this.$nextTick(() => {
        run();
        requestAnimationFrame(() => {
          run();
          [50, 120, 300].forEach((ms) => setTimeout(run, ms));
        });
      });
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const next = Math.floor(panelH - pagH);
      const height = Math.max(200, next);
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.doLayout) table.doLayout();
        this.$nextTick(() => {
          this.syncApplyTableSticky();
          requestAnimationFrame(() => this.syncApplyTableSticky());
        });
      });
    },
    syncApplyTableSticky() {
      const table = this.$refs.applyMainTable;
      const root = table && table.$el;
      if (!root) return;
      const bodyWrap = root.querySelector('.el-table__body-wrapper');
      if (!bodyWrap) return;
      const sw = Math.max(0, bodyWrap.offsetWidth - bodyWrap.clientWidth);
      root.style.setProperty('--apply-v-scrollbar', \`\${sw}px\`);
    },
    normalizeRoutePath(path) {
      if (!path) return '';
      const normalized = String(path).replace(/\\\\/g, '/');
      if (normalized.length > 1 && normalized.endsWith('/')) return normalized.slice(0, -1);
      return normalized;
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path);
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) return;
      if (nav.tick === this._lastSidebarNavTick) return;
      this._lastSidebarNavTick = nav.tick;
      this.queryParams.pageNum = 1;
      this.getList(true);
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.warehouseList || !this.warehouseList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.warehouseList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) table.toggleRowSelection(row, true);
      });
    },
    applyMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) return 'apply-row-selected';
      return '';
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) v = v && v[k];
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAmount(a, b) {
      const va = parseFloat(a && a.totalAmount);
      const vb = parseFloat(b && b.totalAmount);
      return (Number.isFinite(va) ? va : 0) - (Number.isFinite(vb) ? vb : 0);
    },
    sortByIsGz(a, b) {
      const va = (a && a.isGz != null) ? String(a.isGz) : '';
      const vb = (b && b.isGz != null) ? String(b.isGz) : '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByCreatorName(a, b) {
      const va = this.getCreatorName(a) || '';
      const vb = this.getCreatorName(b) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditorName(a, b) {
      const va = this.getAuditorName(a) || '';
      const vb = this.getAuditorName(b) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByCreateTime(a, b) {
      const pick = (row) => row && (row.createTime || row.planDate) || '';
      const va = pick(a);
      const vb = pick(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortBySubmitTime(a, b) {
      const va = (a && a.createTime) || '';
      const vb = (b && b.createTime) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditDate(a, b) {
      const va = (a && a.auditDate) || '';
      const vb = (b && b.auditDate) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    `;

jihua = jihua.replace('methods: {\n    formatIsGzLabel,', `methods: {\n    ${layoutMethods}formatIsGzLabel,`);

jihua = jihua.replace(/\s*warehouseListIndex\(\{ row, rowIndex \}\) \{[\s\S]*?\},\s*/m, '\n');

jihua = jihua.replace(
  /listPurchasePlan\(queryParams\)\.then\(response => \{[\s\S]*?console\.timeEnd\('\[Plan\] getList total'\);\s*\}\);\s*\},/,
  `listPurchasePlan(queryParams).then(response => {
        const t1 = performance.now();
        const rows = response.rows || [];
        this.warehouseList = rows.map(item => ({
          ...item,
          planDateText: item.planDate ? this.parseTime(item.planDate, '{y}-{m}-{d}') : ''
        }));
        this.total = response.total;
        this.loading = false;
        const t2 = performance.now();
        console.log('[Plan] list size=', rows.length, 'network(ms)=', (t1 - t0).toFixed(1), 'assign(ms)=', (t2 - t1).toFixed(1));
        console.timeEnd('[Plan] getList total');
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.warehouseList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },`
);

jihua = jihua.replace(/\s*this\.applyMoreSearchToQueryParams\(queryParams\);\s*/g, '\n');

jihua = jihua.replace(
  /\s*\/\*\* 表头排序 \*\/\s*handleSortChange\(\{ prop, order \}\) \{[\s\S]*?\},\s*/m,
  '\n'
);

jihua = jihua.replace(
  /resetQuery\(\) \{\s*this\.resetForm\("queryForm"\);\s*this\.queryParams\.beginDate = this\.getStatDate\(\);\s*this\.queryParams\.endDate = this\.getEndDate\(\);\s*this\.queryParams\.orderByColumn = 'pp\.plan_date';\s*this\.queryParams\.isAsc = 'desc';\s*this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.handleQuery\(\);\s*\},/,
  `resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.planNo = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.planStatus = null;
      this.queryParams.isGz = null;
      this.queryParams.totalAmount = null;
      this.queryParams.planSource = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.orderByColumn = 'pp.plan_date';
      this.queryParams.isAsc = 'desc';
      this.handleQuery();
    },`
);

jihua = jihua.replace(/\s*moreSearchFieldClass\(t\) \{[\s\S]*?\},\s*/m, '\n');
jihua = jihua.replace(/\s*loadMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/m, '\n');
jihua = jihua.replace(/\s*applyMoreSearchToQueryParams\(target\) \{[\s\S]*?\},\s*/m, '\n');
jihua = jihua.replace(/\s*onMoreSearchTypesChange\(\) \{[\s\S]*?\},\s*/m, '\n');

jihua = jihua.replace(
  /handleSelectionChange\(selection\) \{\s*this\.ids = selection\.map\(item => item\.id\)\s*this\.single = selection\.length!==1\s*this\.multiple = !selection\.length\s*\},/,
  `handleSelectionChange(selection) {
      const pageKeys = (this.warehouseList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) this.$delete(this.selectedRowMap, key);
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) this.$set(this.selectedRowMap, key, row);
      });
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    },`
);

// --- styles ---
const refScopedInner = ref.substring(
  ref.indexOf('<style scoped>') + '<style scoped>'.length,
  ref.indexOf('</style>', ref.indexOf('<style scoped>'))
);
const listQueryBlock = refScopedInner.match(
  /\/\* 搜索区域：卡片样式[\s\S]*?\.list-query-panel \.el-form \.query-row-second-inner \.query-date-range-form-item \.el-form-item__content \{[\s\S]*?\}\s*/
);
const applyTablePanelScoped = refScopedInner.match(
  /\.apply-table-panel > \.apply-main-table \{[\s\S]*?margin-bottom: 0;\s*\}/
);

const refNsStart = ref.indexOf('/* 本页主容器：顶部与标签栏留 8px 细缝');
const refNsEnd = ref.indexOf('.json-viewer-pre {', refNsStart);
let listPageNs = ref.substring(refNsStart, refNsEnd).replace(/inWarehouse-apply-page/g, 'caigou-jihua-page');

listPageNs += `
.app-container.caigou-jihua-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.caigou-jihua-page .apply-main-table td.plan-creator-col .cell {
  white-space: nowrap !important;
}

.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
`;

const styleScopedStart = jihua.indexOf('<style scoped>');
const styleScopedEnd = jihua.indexOf('</style>', styleScopedStart);
let modalScoped = jihua.substring(styleScopedStart + '<style scoped>'.length, styleScopedEnd);

if (!modalScoped.includes('/* 搜索区域：卡片样式')) {
  const tableScopedBlock = `/* 表格样式优化（与到货验收 apply 列表一致） */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

`;
  modalScoped = modalScoped.trimEnd() + '\n\n' + tableScopedBlock + listQueryBlock[0].trim() + '\n\n' + applyTablePanelScoped[0].trim() + '\n';
}

const firstNsOpen = jihua.indexOf('<style>', styleScopedEnd);
const scriptPrefix = jihua.substring(0, firstNsOpen);
jihua = scriptPrefix + '<style>\n' + listPageNs.trim() + '\n</style>\n';

const newScopedStart = jihua.indexOf('<style scoped>') + '<style scoped>'.length;
const newScopedEnd = jihua.indexOf('</style>', newScopedStart);
jihua = jihua.substring(0, newScopedStart) + modalScoped + jihua.substring(newScopedEnd);

fs.writeFileSync(JIHUA_PATH, jihua, 'utf8');

const ok = {
  applyTablePanel: jihua.includes('apply-table-panel'),
  sortCaret: jihua.includes('.sort-caret.ascending'),
  rowHl: jihua.includes('apply-row-selected'),
  listQuery: jihua.includes('query-row-first-inner'),
  noMoreSearch: !jihua.includes('more-search-bar'),
  noBadMargin: !/margin-top:\s*-20px/.test(jihua),
  layoutMethods: jihua.includes('applyMainRowClassName'),
};
console.log(JSON.stringify(ok, null, 2));
if (!ok.applyTablePanel || !ok.sortCaret || !ok.noMoreSearch || !ok.layoutMethods) process.exit(1);
