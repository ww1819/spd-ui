/**
 * 备货验收（gzOrder/apply）列表页 UI 对齐到货验收 inWarehouse/apply
 */
const fs = require('fs');

const TARGET = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
const AUDIT_PATH = 'e:/workspace/spd-ui/src/views/caigou/jihua/audit/index.vue';
const REF_PATH = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';

let vue = fs.readFileSync(TARGET, 'utf8');
const audit = fs.readFileSync(AUDIT_PATH, 'utf8');
const ref = fs.readFileSync(REF_PATH, 'utf8');

const modalFooterRules = vue.match(
  /\.app-container\.gz-order-apply-page \.local-modal-content \.modal-detail-section[\s\S]*?z-index: 31 !important;\s*\}/
);
const modalFooterCss = modalFooterRules ? modalFooterRules[0] : '';

const searchNew = `<div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.orderNo"
              placeholder="入库单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectSupplier v-model="queryParams.supplerId"/>
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值"/>
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
              <el-radio-group v-model="queryParams.timeField" size="small" class="apply-date-type-group">
                <el-radio-button label="createTime">制单时间</el-radio-button>
                <el-radio-button label="auditDate">审核时间</el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-model="queryParams.beginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item class="query-item-inline query-item-status">
              <el-select v-model="queryParams.orderStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option label="未审核" value="1" />
                <el-option label="已审核" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>`;

const searchOld = vue.match(
  /<div class="form-fields-container list-query-panel"[\s\S]*?<\/el-form>\s*<\/div>/
);
if (!searchOld) throw new Error('search block not found');
vue = vue.replace(searchOld[0], searchNew);

const tableOld = vue.match(
  /<el-table v-loading="loading" :data="orderList"[\s\S]*?<pagination[\s\S]*?\/>\s*/
);
if (!tableOld) throw new Error('table block not found');

let tableInner = tableOld[0];
tableInner = tableInner
  .replace(
    '<el-table v-loading="loading" :data="orderList"',
    `<div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="orderList"`
  )
  .replace('class="table-compact"', 'class="table-compact apply-main-table"')
  .replace(
    ':row-class-name="orderListIndex"',
    `row-key="id"
              :row-class-name="applyMainRowClassName"`
  )
  .replace(/\s*ref="orderTable"\s*\n/g, '\n')
  .replace('height="calc(100vh - 340px)"', ':height="mainTableHeight"')
  .replace(
    '<el-table-column type="selection" width="55" align="center" />',
    '<el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />'
  )
  .replace(
    'label="序号" align="center" prop="index" width="80"',
    'label="序号" align="center" prop="index" width="60" min-width="60"'
  )
  .replace(
    'label="单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable',
    'label="单号" align="center" prop="orderNo" width="180" min-width="160" show-overflow-tooltip resizable sortable'
  )
  .replace(
    'label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable',
    'label="仓库" align="center" prop="warehouse.name" width="180" min-width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,\'warehouse.name\')"'
  )
  .replace(
    'label="供应商" align="center" prop="supplier.name" width="250" show-overflow-tooltip resizable/>',
    'label="供应商" align="center" prop="supplier.name" width="220" min-width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,\'supplier.name\')" />'
  )
  .replace(
    'label="制单人" align="center" prop="createBy" width="100" show-overflow-tooltip resizable',
    'label="制单人" align="center" width="120" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName"'
  )
  .replace(
    'label="制单日期" align="center" prop="orderDate" width="160" show-overflow-tooltip resizable',
    'label="制单日期" align="center" prop="orderDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByOrderDate"'
  )
  .replace(
    'label="总金额" align="center" prop="totalAmt" width="120" show-overflow-tooltip resizable',
    'label="总金额" align="center" prop="totalAmt" width="150" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByTotalAmt"'
  )
  .replace(
    'label="单据状态" align="center" prop="orderStatus" width="100" show-overflow-tooltip resizable',
    'label="单据状态" align="center" prop="orderStatus" width="120" min-width="120" show-overflow-tooltip resizable sortable'
  )
  .replace(
    'label="审核人" align="center" prop="auditBy" width="100" show-overflow-tooltip resizable',
    'label="审核人" align="center" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByAuditorName"'
  )
  .replace(
    'label="审核日期" align="center" prop="auditDate" width="160" show-overflow-tooltip resizable',
    'label="审核日期" align="center" prop="auditDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate"'
  )
  .replace(
    'label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable',
    'label="备注" align="center" prop="remark" min-width="100" show-overflow-tooltip resizable sortable'
  )
  .replace(
    'class-name="small-padding fixed-width" width="200" fixed="right"',
    'class-name="apply-action-col small-padding fixed-width" width="200"'
  )
  .replace('<pagination\n      v-show="total>0"', '<div class="apply-pagination-wrap" ref="paginationWrap">\n    <pagination')
  .replace(
    /@pagination="getList"\s*\/>/,
    `@pagination="getList"
    />
    </div>
    </div>

`
  );

vue = vue.replace(tableOld[0], tableInner);

vue = vue.replace(
  /showSearch: true,\s*moreSearchTypes: \[\],\s*moreSearchOptions: \[[\s\S]*?\],\s*/,
  'showSearch: true,\n      mainTableHeight: 400,\n      selectedRowMap: {},\n      mainListSelectionTick: 0,\n      '
);

if (!vue.includes('_lastSidebarNavTick')) {
  vue = vue.replace(
    /(savedSnapshot: '',)\s*/,
    '$1\n      _lastSidebarNavTick: null,\n      '
  );
}

vue = vue.replace(
  /computed: \{\s*\/\*\* 与到货验收[\s\S]*?builtInMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/,
  'computed: {\n    '
);

vue = vue.replace(
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

vue = vue.replace(
  /created\(\) \{\s*\/\/ 设置订单类型为入库[\s\S]*?this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.getList\(\);\s*this\.getUserList\(\);\s*window\.addEventListener\('beforeunload', this\.handleBeforeUnload\);\s*\},\s*beforeDestroy\(\) \{\s*window\.removeEventListener\('beforeunload', this\.handleBeforeUnload\);\s*\},/,
  `created() {
    this.setOrderTypeByRoute();
    this.getList();
    this.getUserList();
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('resize', this.onApplyWindowResize);
  },`
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
      if (!table || !this.orderList || !this.orderList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.orderList.forEach((row) => {
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
    sortByOrderDate(a, b) {
      const pick = (row) => row && (row.orderDate || row.createTime) || '';
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
    sortByTotalAmt(a, b) {
      const va = parseFloat(a && a.totalAmt);
      const vb = parseFloat(b && b.totalAmt);
      return (Number.isFinite(va) ? va : 0) - (Number.isFinite(vb) ? vb : 0);
    },
    `;

vue = vue.replace(/methods: \{\r?\n    buildSnapshot\(\)/, `methods: {\n    ${layoutMethods}buildSnapshot()`);

vue = vue.replace(/\s*orderListIndex\(\{ row, rowIndex \}\) \{[\s\S]*?\},\s*/m, '\n');

vue = vue.replace(
  /,getList\(\) \{[\s\S]*?this\.applyMoreSearchToQueryParams\(query\);[\s\S]*?if \(this\.\$refs\.orderTable\) \{[\s\S]*?\}\);\s*\}\)\.catch\(error\) => \{[\s\S]*?\}\);\s*\},/,
  `,getList() {
      this.loading = true;
      this.setOrderTypeByRoute();
      if (!this.queryParams.orderType) {
        this.queryParams.orderType = 101;
        this.isOutbound = false;
      }
      const query = { ...this.queryParams };
      const params = this.normalizeQueryDateTime(query);
      listOrder(params).then(response => {
        this.orderList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(error => {
        console.error('查询失败:', error);
        this.orderList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
        this.$modal.msgError('查询失败：' + (error.message || '未知错误'));
      });
    },`
);

vue = vue.replace(/\s*moreSearchFieldClass\(t\) \{[\s\S]*?\},\s*/m, '\n');
vue = vue.replace(/\s*loadMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/m, '\n');
vue = vue.replace(/\s*applyMoreSearchToQueryParams\(target\) \{[\s\S]*?\},\s*/m, '\n');
vue = vue.replace(/\s*onMoreSearchTypesChange\(\) \{[\s\S]*?\},\s*/m, '\n');

vue = vue.replace(
  /resetQuery\(\) \{\s*this\.resetForm\("queryForm"\);\s*this\.queryParams\.beginDate = null;[\s\S]*?this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.handleQuery\(\);\s*\},/,
  `resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.orderNo = null;
      this.queryParams.supplerId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.timeField = 'createTime';
      this.queryParams.orderStatus = null;
      this.setOrderTypeByRoute();
      this.handleQuery();
    },`
);

vue = vue.replace(
  /handleSelectionChange\(selection\) \{\s*this\.ids = selection\.map\(item => item\.id\)\s*this\.single = selection\.length!==1\s*this\.multiple = !selection\.length\s*\},/,
  `handleSelectionChange(selection) {
      const pageKeys = (this.orderList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
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
      this.mainListSelectionTick += 1;
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.$forceUpdate) table.$forceUpdate();
        if (table && table.doLayout) table.doLayout();
      });
    },`
);

vue = vue.replace(
  /handleExport\(\) \{\s*const query = \{ \.\.\.this\.queryParams \};\s*this\.applyMoreSearchToQueryParams\(query\);\s*/,
  'handleExport() {\n      const query = { ...this.queryParams };\n      '
);

// non-scoped styles
const auditNsStart = audit.indexOf('/* 本页主容器：顶部与标签栏留 8px 细缝');
const auditNsEnd = audit.lastIndexOf('</style>');
let listPageNs = audit.substring(auditNsStart, auditNsEnd);
listPageNs = listPageNs.replace(/caigou-jihua-audit-page/g, 'gz-order-apply-page');

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

const styleScopedStart = vue.indexOf('<style scoped>');
const styleScopedEnd = vue.indexOf('</style>', styleScopedStart);
let modalScoped = vue.substring(styleScopedStart + '<style scoped>'.length, styleScopedEnd);

modalScoped = modalScoped.replace(
  /\.gz-order-apply-page > \.el-table\.table-compact[\s\S]*?transition: all 0\.3s;\s*\}\s*/,
  ''
);

if (!modalScoped.includes('/* 搜索区域：卡片样式')) {
  const tableScopedBlock = `/* 表格样式优化（弹窗内表格，勿影响主列表 apply-main-table） */
.local-modal-content .el-table:not(.apply-main-table):not(.apply-detail-table) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

`;
  modalScoped = modalScoped.trimEnd() + '\n\n' + tableScopedBlock + listQueryBlock[0].trim() + '\n\n' + applyTablePanelScoped[0].trim() + '\n';
}

const firstNsOpen = vue.indexOf('<style>', styleScopedEnd);
const scriptPrefix = vue.substring(0, firstNsOpen);
vue = scriptPrefix + '<style>\n' + listPageNs.trim() + '\n\n' + modalFooterCss + '\n</style>\n';

const newScopedStart = vue.indexOf('<style scoped>') + '<style scoped>'.length;
const newScopedEnd = vue.indexOf('</style>', newScopedStart);
vue = vue.substring(0, newScopedStart) + modalScoped + vue.substring(newScopedEnd);

fs.writeFileSync(TARGET, vue, 'utf8');

const ok = {
  applyTablePanel: vue.includes('apply-table-panel'),
  sortCaret: vue.includes('.sort-caret.ascending'),
  rowHl: vue.includes('apply-row-selected'),
  layoutMethods: vue.includes('applyMainRowClassName({'),
  noMoreSearch: !vue.includes('more-search-bar'),
  noBadMargin: !/margin-top:\s*-20px/.test(vue),
  searchOverride: vue.includes('gz-order-apply-page > .form-fields-container.list-query-panel'),
};
console.log(JSON.stringify(ok, null, 2));
if (!ok.applyTablePanel || !ok.layoutMethods || !ok.noMoreSearch) process.exit(1);
