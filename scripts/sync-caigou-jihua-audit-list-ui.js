/**
 * 采购计划审核列表页 UI 对齐到货验收 inWarehouse/apply
 */
const fs = require('fs');

const AUDIT_PATH = 'e:/workspace/spd-ui/src/views/caigou/jihua/audit/index.vue';
const JIHUA_PATH = 'e:/workspace/spd-ui/src/views/caigou/jihua/index.vue';
const REF_PATH = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';

let audit = fs.readFileSync(AUDIT_PATH, 'utf8');
const jihua = fs.readFileSync(JIHUA_PATH, 'utf8');
const ref = fs.readFileSync(REF_PATH, 'utf8');

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
              <SelectWarehouse v-model="queryParams.warehouseId"/>
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
            <el-form-item class="query-item-inline query-item-status">
              <el-select v-model="queryParams.planStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option v-for="dict in planStatusFilterOptions"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
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

const tableOld = audit.match(
  /<el-table v-loading="loading" :data="warehouseList"[\s\S]*?<\/el-table>\s*\n\s*<pagination[\s\S]*?\/>\s*/
);
if (!tableOld) throw new Error('table block not found');

const tableNew = `<div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="warehouseList"
              class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" width="60" min-width="60" show-overflow-tooltip resizable />
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" min-width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.planNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="180" min-width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="金额" align="center" prop="totalAmount" width="150" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmount">
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount != null && scope.row.totalAmount !== ''">{{ formatPrice4(scope.row.totalAmount) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" width="120" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName">
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByCreateTime">
        <template slot-scope="scope">
          <span>{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : (scope.row.planDate ? parseTime(scope.row.planDate, '{y}-{m}-{d} {h}:{i}:{s}') : '--') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="planStatus" width="120" min-width="120" show-overflow-tooltip resizable sortable label-class-name="plan-col-status" class-name="plan-col-status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.plan_status" :value="scope.row.planStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核意见" align="center" prop="auditOpinion" width="160" min-width="140" show-overflow-tooltip resizable sortable />
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByAuditorName">
        <template slot-scope="scope">
          {{ getAuditorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="100" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="140">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button size="small" type="text" @click="handleView(scope.row)" style="padding: 0 5px; margin: 0;">查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleAudit(scope.row)"
              v-if="scope.row.planStatus == '1' || scope.row.planStatus == 1"
              style="padding: 0 5px; margin: 0;"
            >审核</el-button>
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
    </div>

`;

audit = audit.replace(tableOld[0], tableNew);

audit = audit.replace(
  /showSearch: true,\s*moreSearchTypes: \[\],\s*moreSearchOptions: \[[\s\S]*?\],\s*/,
  'showSearch: true,\n      mainTableHeight: 400,\n      selectedRowMap: {},\n      mainListSelectionTick: 0,\n      '
);

if (!audit.includes('_lastSidebarNavTick')) {
  audit = audit.replace(
    /(applyDetailDialogVisible: false\s*)\n(\s*\};)/,
    '$1,\n      _lastSidebarNavTick: null\n$2'
  );
}

audit = audit.replace(
  /created\(\) \{\s*this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.getList\(\);\s*this\.getUserList\(\);\s*\},\s*computed:/,
  `created() {
    this.getList();
    this.getUserList();
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
    }
  },
  computed:`
);

audit = audit.replace(
  /computed: \{\s*\/\*\* 与到货验收[\s\S]*?moreSearchStorageKey\(\) \{[\s\S]*?builtInMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/,
  'computed: {\n    '
);

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
      if (!table || !this.warehouseList || !this.warehouseList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.warehouseList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) table.toggleRowSelection(row, true);
      });
    },
    applyMainRowClassName({ row, rowIndex }) {
      void this.mainListSelectionTick;
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
    sortByAuditDate(a, b) {
      const va = (a && a.auditDate) || '';
      const vb = (b && b.auditDate) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    `;

audit = audit.replace('methods: {\n    /** 单价/金额展示', `methods: {\n    ${layoutMethods}/** 单价/金额展示`);

audit = audit.replace(/\s*warehouseListIndex\(\{ row, rowIndex \}\) \{[\s\S]*?\},\s*/m, '\n');

audit = audit.replace(
  /getList\(\) \{\s*this\.loading = true;\s*const params = \{ \.\.\.this\.queryParams \};\s*this\.applyMoreSearchToQueryParams\(params\);\s*listPurchasePlan\(params\)\.then\(response => \{\s*this\.warehouseList = response\.rows \|\| \[\];\s*this\.total = response\.total;\s*this\.loading = false;\s*\}\);\s*\},/,
  `getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      listPurchasePlan(params).then(response => {
        this.warehouseList = response.rows || [];
        this.total = response.total;
        this.loading = false;
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

audit = audit.replace(/\s*moreSearchFieldClass\(t\) \{[\s\S]*?\},\s*/m, '\n');
audit = audit.replace(/\s*loadMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/m, '\n');
audit = audit.replace(/\s*applyMoreSearchToQueryParams\(target\) \{[\s\S]*?\},\s*/m, '\n');
audit = audit.replace(/\s*onMoreSearchTypesChange\(\) \{[\s\S]*?\},\s*/m, '\n');

audit = audit.replace(
  /resetQuery\(\) \{\s*this\.resetForm\("queryForm"\);\s*this\.queryParams\.beginDate = this\.getStatDate\(\);\s*this\.queryParams\.endDate = this\.getEndDate\(\);\s*this\.queryParams\.planStatus = '1';[\s\S]*?this\.handleQuery\(\);\s*\},/,
  `resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.planNo = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.planStatus = '1';
      this.handleQuery();
    },`
);

audit = audit.replace(
  /handleSelectionChange\(selection\) \{\s*this\.ids = \(selection \|\| \[\]\)\.map\(item => item\.id != null \? item\.id : item\.planId\)\.filter\(id => id != null && id !== ''\)\s*this\.single = this\.ids\.length !== 1\s*this\.multiple = this\.ids\.length === 0\s*\},/,
  `handleSelectionChange(selection) {
      const pageKeys = (this.warehouseList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) this.$delete(this.selectedRowMap, key);
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) this.$set(this.selectedRowMap, key, row);
      });
      const ids = Object.keys(this.selectedRowMap || []).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
      this.mainListSelectionTick += 1;
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.$forceUpdate) table.$forceUpdate();
        if (table && table.doLayout) table.doLayout();
      });
    },`
);

// Fix typo in handleSelectionChange - Object.keys returns array, should be Object.keys(selectedRowMap || {})
audit = audit.replace(
  'const ids = Object.keys(this.selectedRowMap || []).map',
  'const ids = Object.keys(this.selectedRowMap || {}).map'
);

// styles from jihua non-scoped block
const jihuaNsStart = jihua.indexOf('/* 本页主容器：顶部与标签栏留 8px 细缝');
const jihuaNsEnd = jihua.lastIndexOf('</style>');
let listPageNs = jihua.substring(jihuaNsStart, jihuaNsEnd);
listPageNs = listPageNs.replace(/caigou-jihua-page/g, 'caigou-jihua-audit-page');
// remove jihua-only modal nested rules if too long - keep all, just namespace swap

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

const styleScopedStart = audit.indexOf('<style scoped>');
const styleScopedEnd = audit.indexOf('</style>', styleScopedStart);
let modalScoped = audit.substring(styleScopedStart + '<style scoped>'.length, styleScopedEnd);

modalScoped = modalScoped.replace(
  /\/\* 表格样式优化 \*\/\s*\.el-table \{[\s\S]*?border-bottom: 1px solid #EBEEF5;\s*\}\s*/,
  ''
);
modalScoped = modalScoped.replace(
  /\/\* 确保表格滚动条正常显示 \*\/[\s\S]*?\.el-table tr:hover > td \{[\s\S]*?transition: all 0\.3s;\s*\}\s*/,
  ''
);

if (!modalScoped.includes('/* 搜索区域：卡片样式')) {
  const tableScopedBlock = `/* 表格样式优化（弹窗内表格，勿影响主列表 apply-main-table） */
.local-modal-content .el-table:not(.apply-main-table):not(.apply-detail-table) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.local-modal-content .el-table:not(.apply-main-table):not(.apply-detail-table) td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

`;
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
  layoutMethods: audit.includes('applyMainRowClassName'),
  noMoreSearch: !audit.includes('more-search-bar'),
  noBadMargin: !/margin-top:\s*-20px/.test(audit),
  searchOverride: audit.includes('caigou-jihua-audit-page > .form-fields-container.list-query-panel'),
};
console.log(JSON.stringify(ok, null, 2));
if (!ok.applyTablePanel || !ok.layoutMethods || !ok.noMoreSearch) process.exit(1);
