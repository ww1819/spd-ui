/**
 * 订单发布列表页 UI 对齐到货验收 inWarehouse/apply
 */
const fs = require('fs');

const PUBLISH_PATH = 'e:/workspace/spd-ui/src/views/caigou/publish/index.vue';
const AUDIT_PATH = 'e:/workspace/spd-ui/src/views/caigou/jihua/audit/index.vue';
const REF_PATH = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';

let publish = fs.readFileSync(PUBLISH_PATH, 'utf8');
const audit = fs.readFileSync(AUDIT_PATH, 'utf8');
const ref = fs.readFileSync(REF_PATH, 'utf8');

const searchNew = `<div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.orderNo"
              placeholder="订单单号"
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
              <el-select v-model="queryParams.dateType" placeholder="时间类型" class="apply-query-field query-date-type-select">
                <el-option label="制单时间" value="createTime" />
                <el-option label="审核时间" value="auditDate" />
                <el-option label="发布时间" value="pushTime" />
              </el-select>
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
              <el-select v-model="queryParams.orderStatus" placeholder="单据状态" clearable class="apply-query-field">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item class="query-item-inline query-item-status">
              <el-select v-model="queryParams.pushStatus" placeholder="是否发布" clearable class="apply-query-field">
                <el-option label="已发布" value="1" />
                <el-option label="未发布" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>`;

const searchOld = publish.match(
  /<div class="form-fields-container list-query-panel"[\s\S]*?<\/el-form>\s*<\/div>/
);
if (!searchOld) throw new Error('search block not found');
publish = publish.replace(searchOld[0], searchNew);

const tableOld = publish.match(
  /<el-table ref="mainListTable"[\s\S]*?<pagination[\s\S]*?\/>\s*/
);
if (!tableOld) throw new Error('table block not found');

let tableInner = tableOld[0];
tableInner = tableInner
  .replace(
    '<el-table ref="mainListTable"',
    `<div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable"`
  )
  .replace(
    'class="table-compact"',
    'class="table-compact apply-main-table"'
  )
  .replace(
    '@selection-change="handleSelectionChange"',
    `row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"`
  )
  .replace('mainListTableHeight', 'mainTableHeight')
  .replace(
    '<el-table-column type="selection" width="55" align="center" />',
    '<el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />'
  )
  .replace(
    `<el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>`,
    '<el-table-column label="序号" align="center" prop="index" width="60" min-width="60" show-overflow-tooltip resizable />'
  )
  .replace(
    'class-name="small-padding fixed-width" width="150" fixed="right"',
    'class-name="apply-action-col small-padding fixed-width" width="140"'
  )
  .replace(
    '<pagination',
    `<div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination`
  )
  .replace(
    /@pagination="getList"\s*\/>/,
    `@pagination="getList"
    />
    </div>
    </div>

`
  );

publish = publish.replace(tableOld[0], tableInner);

publish = publish.replace(
  /showSearch: true,\s*moreSearchTypes: \[\],\s*moreSearchOptions: \[[\s\S]*?\],\s*/,
  'showSearch: true,\n      mainTableHeight: 400,\n      selectedRowMap: {},\n      mainListSelectionTick: 0,\n      '
);

publish = publish.replace(
  /\/\*\* 主列表表格高度[\s\S]*?mainListTableHeight: 400\s*\}/,
  ''
);

if (!publish.includes('_lastSidebarNavTick')) {
  publish = publish.replace(
    /(planDetail: null,)\s*/,
    '$1\n      _lastSidebarNavTick: null,\n      '
  );
}

publish = publish.replace(
  /created\(\) \{\s*this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.getList\(\);\s*this\.getUserList\(\);\s*this\.\$nextTick\(\(\) => this\.syncMainListTableHeight\(\)\);\s*\},\s*mounted\(\) \{\s*this\.syncMainListTableHeight\(\);\s*window\.addEventListener\('resize', this\.syncMainListTableHeight\);\s*\},\s*activated\(\) \{\s*this\.\$nextTick\(\(\) => this\.syncMainListTableHeight\(\)\);\s*\},\s*beforeDestroy\(\) \{\s*window\.removeEventListener\('resize', this\.syncMainListTableHeight\);\s*\},\s*watch: \{\s*showSearch\(\) \{\s*this\.\$nextTick\(\(\) => this\.syncMainListTableHeight\(\)\);\s*\}\s*\},\s*computed: \{\s*moreSearchStorageKey\(\) \{[\s\S]*?builtInMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/,
  `created() {
    this.getList();
    this.getUserList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  activated() {
    this.$nextTick(() => this.scheduleApplyLayoutRefresh());
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
  computed: {
    `
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
    `;

publish = publish.replace('methods: {\n    /** 单价/金额：四位小数', `methods: {\n    ${layoutMethods}/** 单价/金额：四位小数`);

publish = publish.replace(/\s*syncMainListTableHeight\(\) \{[\s\S]*?\},\s*/m, '\n');

publish = publish.replace(
  /getTotalSummaries\(param\) \{[\s\S]*?if\(index === 4\)\{[\s\S]*?\}\s*\}\s*\}\);\s*return sums;\s*\},/,
  `getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'totalAmount') {
          const values = data.map(item => Number(item.totalAmount));
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) return prev + curr;
              return prev;
            }, 0);
            sums[index] = Number(sums[index]).toFixed(2);
          }
        }
      });
      return sums;
    },`
);

publish = publish.replace(
  /getList\(\) \{\s*this\.loading = true;\s*const queryParams = \{ \.\.\.this\.queryParams \};\s*this\.applyMoreSearchToQueryParams\(queryParams\);\s*listDingdan\(queryParams\)\.then\(response => \{\s*this\.orderList = response\.rows;\s*this\.total = response\.total;\s*this\.loading = false;\s*this\.\$nextTick\(\(\) => this\.syncMainListTableHeight\(\)\);\s*\}\);\s*\},/,
  `getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      listDingdan(queryParams).then(response => {
        this.orderList = response.rows || [];
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.orderList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },`
);

publish = publish.replace(
  /resetQuery\(\) \{\s*this\.resetForm\("queryForm"\);\s*this\.queryParams\.dateType = 'createTime';[\s\S]*?this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.handleQuery\(\);\s*\},/,
  `resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.orderNo = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.dateType = 'createTime';
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.orderStatus = null;
      this.queryParams.pushStatus = null;
      this.queryParams.orderByColumn = 'po.create_time';
      this.queryParams.isAsc = 'desc';
      this.handleQuery();
    },`
);

publish = publish.replace(/\s*moreSearchFieldClass\(t\) \{[\s\S]*?\},\s*/m, '\n');
publish = publish.replace(/\s*loadMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/m, '\n');
publish = publish.replace(/\s*applyMoreSearchToQueryParams\(target\) \{[\s\S]*?\},\s*/m, '\n');
publish = publish.replace(/\s*onMoreSearchTypesChange\(\) \{[\s\S]*?\},\s*/m, '\n');

publish = publish.replace(
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

publish = publish.replace(
  /handleExport\(\) \{\s*const queryParams = \{ \.\.\.this\.queryParams \};\s*this\.applyMoreSearchToQueryParams\(queryParams\);\s*/,
  'handleExport() {\n      const queryParams = { ...this.queryParams };\n      '
);

// non-scoped styles from audit
const auditNsStart = audit.indexOf('/* 本页主容器：顶部与标签栏留 8px 细缝');
const auditNsEnd = audit.lastIndexOf('</style>');
let listPageNs = audit.substring(auditNsStart, auditNsEnd);
listPageNs = listPageNs.replace(/caigou-jihua-audit-page/g, 'caigou-publish-page');
listPageNs += `
.app-container.caigou-publish-page .publish-cell-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  font-size: 13px;
  line-height: 20px;
}
`;

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

const styleScopedStart = publish.indexOf('<style scoped>');
const styleScopedEnd = publish.indexOf('</style>', styleScopedStart);
let modalScoped = publish.substring(styleScopedStart + '<style scoped>'.length, styleScopedEnd);

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

modalScoped = modalScoped.replace(
  /\.local-modal-content \.form-fields-container \{[\s\S]*?border: 1px solid #EBEEF5;\s*\}/,
  `.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
}`
);

const firstNsOpen = publish.indexOf('<style>', styleScopedEnd);
const scriptPrefix = publish.substring(0, firstNsOpen);
publish = scriptPrefix + '<style>\n' + listPageNs.trim() + '\n</style>\n';
const newScopedStart = publish.indexOf('<style scoped>') + '<style scoped>'.length;
const newScopedEnd = publish.indexOf('</style>', newScopedStart);
publish = publish.substring(0, newScopedStart) + modalScoped + publish.substring(newScopedEnd);

fs.writeFileSync(PUBLISH_PATH, publish, 'utf8');

const ok = {
  applyTablePanel: publish.includes('apply-table-panel'),
  sortCaret: publish.includes('.sort-caret.ascending'),
  rowHl: publish.includes('apply-row-selected'),
  layoutMethods: publish.includes('applyMainRowClassName'),
  noMoreSearch: !publish.includes('more-search-bar'),
  noBadMargin: !/margin-top:\s*-20px/.test(publish),
  searchOverride: publish.includes('caigou-publish-page > .form-fields-container.list-query-panel'),
};
console.log(JSON.stringify(ok, null, 2));
if (!ok.applyTablePanel || !ok.layoutMethods || !ok.noMoreSearch) process.exit(1);
