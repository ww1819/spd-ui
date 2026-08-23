/**
 * 盘点审核（科室）列表页 UI 对齐到货验收 inWarehouse/apply
 */
const fs = require('fs');

const AUDIT_PATH = 'e:/workspace/spd-ui/src/views/department/stocktakingAudit/index.vue';
const REF_PATH = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';

let audit = fs.readFileSync(AUDIT_PATH, 'utf8');
const ref = fs.readFileSync(REF_PATH, 'utf8');

// --- 根节点 ---
audit = audit.replace(
  '<div class="app-container list-page stocktaking-audit-page">',
  '<div class="app-container list-page stocktaking-audit-page" :class="{ \'is-modal-open\': open }">'
);

// --- 搜索区 ---
const searchNew = `<div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.stockNo"
              placeholder="业务单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectDepartment v-model="queryParams.departmentId" field-placeholder="科室" />
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
            <el-form-item prop="stockStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.stockStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option label="未审核" :value="1" />
                <el-option label="已审核" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>`;

const searchOld = audit.match(
  /<div class="form-fields-container list-query-panel"[\s\S]*?<\/el-form>\s*<\/div>/
);
if (!searchOld) throw new Error('search block not found');
audit = audit.replace(searchOld[0], searchNew);

// --- 主表 + 分页 ---
const tableNew = `<div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="stocktakingList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="盘点单号" align="center" prop="stockNo" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" class="stock-no-link" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="制单人" align="center" prop="createBy" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreaterName">
        <template slot-scope="scope">
          <span>{{ scope.row.createUserNickName || scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column
        label="单据状态"
        align="center"
        prop="stockStatus"
        width="120"
        min-width="112"
        show-overflow-tooltip
        resizable
        sortable
        label-class-name="stocktaking-col-stock-status"
        class-name="stocktaking-col-stock-status"
      >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="updateBy" width="110" show-overflow-tooltip resizable sortable :sort-method="sortByAuditPerson">
        <template slot-scope="scope">
          <span v-if="scope.row.stockStatus == 2">{{ scope.row.auditUserNickName || scope.row.updateBy || '--' }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span v-if="scope.row.stockStatus == 2 && scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else-if="scope.row.stockStatus == 2 && scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmount">
        <template slot-scope="scope">
          <span>{{ formatStocktakingListAmount(scope.row.totalAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByProfitAmount">
        <template slot-scope="scope">
          <span>{{ formatStocktakingListProfitAmount(scope.row.profitAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="300">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              v-if="scope.row.stockStatus == 2"
              size="small"
              type="text"
              v-hasPermi="['department:stocktakingAudit:export', 'department:stocktaking:export']"
              @click="handleExportRow(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleAudit(scope.row)"
              v-hasPermi="['department:stocktakingAudit:audit']"
              v-if="scope.row.stockStatus == 1"
              style="padding: 0 5px; margin: 0; color: #67C23A;"
            >审核</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleReject(scope.row)"
              v-hasPermi="['department:stocktakingAudit:reject']"
              v-if="scope.row.stockStatus == 1"
              style="padding: 0 5px; margin: 0; color: #F56C6C;"
            >驳回</el-button>
          </span>
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
    </div>`;

const tableOld = audit.match(
  /<el-table v-loading="loading"[\s\S]*?<pagination[\s\S]*?@pagination="getList"\s*\/>/
);
if (!tableOld) throw new Error('table block not found');
audit = audit.replace(tableOld[0], tableNew);

// --- data ---
audit = audit.replace(
  /showSearch: true,\s*moreSearchTypes:[\s\S]*?moreSearchOptions:[\s\S]*?\],\s*/,
  'showSearch: true,\n      mainTableHeight: 400,\n      selectedRowMap: {},\n      '
);

// --- lifecycle ---
audit = audit.replace(
  /created\(\) \{\s*this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.getList\(\);\s*\},\s*computed:/,
  `created() {
    this.getList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    },
    open(val) {
      if (val) {
        this.$nextTick(() => this.scheduleApplyLayoutRefresh());
      }
    }
  },
  computed:`
);

audit = audit.replace(
  /computed: \{\s*moreSearchStorageKey\(\) \{[\s\S]*?builtInMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/,
  'computed: {\n    '
);

if (!audit.includes('_lastSidebarNavTick')) {
  audit = audit.replace(
    /(rules: \{[\s\S]*?\}\s*)\n(\s*\};)/,
    '$1,\n      _lastSidebarNavTick: null\n$2'
  );
}

// --- methods: layout + sort ---
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
      this.getList();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.stocktakingList || !this.stocktakingList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.stocktakingList.forEach((row) => {
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
    sortByCreaterName(a, b) {
      const va = (a && (a.createUserNickName || a.createBy)) || '';
      const vb = (b && (b.createUserNickName || b.createBy)) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditPerson(a, b) {
      const va = (a && a.stockStatus == 2 && (a.auditUserNickName || a.updateBy)) || '';
      const vb = (b && b.stockStatus == 2 && (b.auditUserNickName || b.updateBy)) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditDate(a, b) {
      const pick = (row) => {
        if (!row || row.stockStatus != 2) return '';
        return row.auditDate || row.updateTime || '';
      };
      const va = pick(a);
      const vb = pick(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAmount(a, b) {
      const va = parseFloat(a && a.totalAmount);
      const vb = parseFloat(b && b.totalAmount);
      return (Number.isFinite(va) ? va : 0) - (Number.isFinite(vb) ? vb : 0);
    },
    sortByProfitAmount(a, b) {
      const va = parseFloat(a && a.profitAmount);
      const vb = parseFloat(b && b.profitAmount);
      return (Number.isFinite(va) ? va : 0) - (Number.isFinite(vb) ? vb : 0);
    },
    `;

audit = audit.replace('methods: {\n    /** 盘点列表序号 */', `methods: {\n    ${layoutMethods}/** 盘点列表序号 */`);

audit = audit.replace(/\s*stocktakingListIndex\(\{ row, rowIndex \}\) \{[\s\S]*?\},\s*/, '\n');

audit = audit.replace(
  /getList\(\) \{\s*this\.loading = true;\s*const queryParams = \{ \.\.\.this\.queryParams \};\s*this\.applyMoreSearchToQueryParams\(queryParams\);\s*queryParams\.stockType = 502;[\s\S]*?this\.loading = false;\s*\}\);\s*\},/,
  `getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      queryParams.stockType = 502;
      listStocktakingAudit(queryParams).then(response => {
        this.stocktakingList = (response && response.rows) || [];
        this.total = (response && response.total) || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.stocktakingList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },`
);

audit = audit.replace(
  /resetQuery\(\) \{\s*this\.resetForm\("queryForm"\);\s*this\.queryParams\.stockStatus = null;\s*this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.handleQuery\(\);\s*\},/,
  `resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.stockNo = null;
      this.queryParams.departmentId = null;
      this.queryParams.stockStatus = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },`
);

audit = audit.replace(/\s*moreSearchFieldClass\(t\) \{[\s\S]*?\},\s*/m, '\n');
audit = audit.replace(/\s*loadMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/m, '\n');
audit = audit.replace(/\s*applyMoreSearchToQueryParams\(target\) \{[\s\S]*?\},\s*/m, '\n');
audit = audit.replace(/\s*onMoreSearchTypesChange\(\) \{[\s\S]*?\},\s*/m, '\n');

audit = audit.replace(
  /handleSelectionChange\(selection\) \{\s*this\.ids = selection\.map\(item => item\.id\)\s*this\.single = selection\.length!==1\s*this\.multiple = !selection\.length\s*\},/,
  `handleSelectionChange(selection) {
      const pageKeys = (this.stocktakingList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
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

audit = audit.replace(/\s*this\.applyMoreSearchToQueryParams\(exportQuery\);\s*/g, '\n');

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

const refNsStart = ref.indexOf('/* 本页主容器：顶部与标签栏留 8px 细缝');
const refNsEnd = ref.indexOf('.json-viewer-pre {', refNsStart);
let listPageNs = ref.substring(refNsStart, refNsEnd).replace(/inWarehouse-apply-page/g, 'stocktaking-audit-page');
listPageNs = listPageNs.replace(
  /\/\* 单据状态列表头不换行 \*\/\s*\.app-container\.stocktaking-audit-page \.apply-main-table thead th:nth-child\(9\) \.cell \{[\s\S]*?\}\s*/,
  `/* 单据状态列：表头与内容不换行 */
.app-container.stocktaking-audit-page .apply-main-table th.stocktaking-col-stock-status .cell,
.app-container.stocktaking-audit-page .apply-main-table td.stocktaking-col-stock-status .cell {
  white-space: nowrap !important;
}

`
);
listPageNs += `
.app-container.stocktaking-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}
`;

const styleScopedStart = audit.indexOf('<style scoped>');
const styleScopedEnd = audit.indexOf('</style>', styleScopedStart);
let modalScoped = audit.substring(styleScopedStart + '<style scoped>'.length, styleScopedEnd);

// 去掉旧列表搜索样式与 mb8 margin-top 覆盖
modalScoped = modalScoped.replace(
  /\/\* 搜索区域：与科室申领一致 \*\/[\s\S]*?\.input-total-amount-inline >>> \.el-input__inner \{[\s\S]*?\}\s*/,
  ''
);
modalScoped = modalScoped.replace(
  /\.mb8 \{\s*margin-top: 0 !important;\s*margin-bottom: 8px !important;\s*\}/,
  '.mb8 {\n  margin-bottom: 8px !important;\n}'
);

if (!modalScoped.includes('/* 搜索区域：卡片样式')) {
  modalScoped = modalScoped.trimEnd() + '\n\n' + tableScopedBlock + listQueryBlock[0].trim() + '\n\n' + applyTablePanelScoped[0].trim() + '\n';
}

const firstNsOpen = audit.indexOf('<style>', styleScopedEnd);
const scriptPrefix = audit.substring(0, firstNsOpen);
audit = scriptPrefix + '<style>\n' + listPageNs.trim() + '\n</style>\n';

const newScopedStart = audit.indexOf('<style scoped>') + '<style scoped>'.length;
const newScopedEnd = audit.indexOf('</style>', newScopedStart);
audit = audit.substring(0, newScopedStart) + modalScoped + audit.substring(newScopedEnd);

fs.writeFileSync(AUDIT_PATH, audit, 'utf8');

const ok = {
  applyTablePanel: audit.includes('apply-table-panel'),
  sortCaret: audit.includes('.sort-caret.ascending'),
  rowHl: audit.includes('apply-row-selected'),
  listQuery: audit.includes('query-row-first-inner'),
  noMoreSearch: !audit.includes('more-search-bar'),
  noBadMargin: !/margin-top:\s*-20px/.test(audit),
};
console.log(JSON.stringify(ok, null, 2));
if (!ok.applyTablePanel || !ok.sortCaret || ok.noMoreSearch) process.exit(1);
