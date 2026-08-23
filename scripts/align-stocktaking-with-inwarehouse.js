/**
 * 盘点申请（科室）列表页对齐到货验收 / 科室批量消耗
 */
const fs = require('fs');

const STOCK_PATH = 'e:/workspace/spd-ui/src/views/department/stocktaking/index.vue';
const BC_PATH = 'e:/workspace/spd-ui/src/views/department/batchConsume/index.vue';

let content = fs.readFileSync(STOCK_PATH, 'utf8');
const bc = fs.readFileSync(BC_PATH, 'utf8');

// --- template: root ---
content = content.replace(
  '<div class="app-container list-page stocktaking-apply-page">',
  '<div class="app-container list-page stocktaking-apply-page" :class="{ \'is-modal-open\': open }">'
);

// --- template: search ---
const searchOld = content.match(
  /<div class="form-fields-container list-query-panel"[\s\S]*?<\/el-row>\s*<\/el-form>\s*<\/div>/
);
if (!searchOld) throw new Error('search block not found');
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
          </el-col>
        </el-row>
      </el-form>
    </div>`;
content = content.replace(searchOld[0], searchNew);

// --- template: table + pagination ---
const tableOld = content.match(/<el-table v-loading="loading"[\s\S]*?<\/el-table>\s*\n\s*\n\s*<pagination[\s\S]*?@pagination="getList"\s*\/>/);
if (!tableOld) throw new Error('table block not found');
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
      <el-table-column label="制单时间" align="center" prop="createTime" width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="制单人" align="center" prop="createBy" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreaterName">
        <template slot-scope="scope">
          <span>{{ scope.row.createUserNickName || scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盘点日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
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
      <el-table-column label="盘点类型" align="center" prop="stockType" show-overflow-tooltip resizable v-if="false">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.stockType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleExportRow(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row,true)"
              v-if="scope.row.stockStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:stocktaking:edit']"
              v-if="scope.row.stockStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:stocktaking:remove']"
              v-if="scope.row.stockStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
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
content = content.replace(tableOld[0], tableNew);

// --- data ---
content = content.replace(
  /showSearch: true,\s*\n\s*\/\/ 总条数/,
  'showSearch: true,\n      mainTableHeight: 400,\n      selectedRowMap: {},\n      // 总条数'
);
content = content.replace(/\s*moreSearchTypes: \[\],\s*moreSearchOptions: \[[\s\S]*?\],\s*/m, '\n');

// --- created / mounted / watch ---
content = content.replace(
  /created\(\) \{\s*this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.getList\(\);\s*\},/,
  `created() {
    this.getList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },`
);
content = content.replace(
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

// --- computed: remove moreSearch ---
content = content.replace(
  /\s*moreSearchStorageKey\(\) \{\s*return "spd\.department\.stocktaking\.moreSearchTypes";\s*\},\s*builtInMoreSearchDefaults\(\) \{\s*return this\.moreSearchOptions\.map\(o => o\.value\);\s*\},\s*/,
  '\n'
);

// --- methods: layout + sort (insert after methods: {) ---
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
        if (table && table.doLayout) {
          table.doLayout();
        }
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
      if (normalized.length > 1 && normalized.endsWith('/')) {
        return normalized.slice(0, -1);
      }
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
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    applyMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
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
      const na = Number.isFinite(va) ? va : 0;
      const nb = Number.isFinite(vb) ? vb : 0;
      return na - nb;
    },
    sortByProfitAmount(a, b) {
      const va = parseFloat(a && a.profitAmount);
      const vb = parseFloat(b && b.profitAmount);
      const na = Number.isFinite(va) ? va : 0;
      const nb = Number.isFinite(vb) ? vb : 0;
      return na - nb;
    },
    `;

content = content.replace('methods: {\n    clearEntryTableSelection()', `methods: {\n    ${layoutMethods}clearEntryTableSelection()`);

// --- getList ---
content = content.replace(
  /getList\(\) \{\s*this\.loading = true;\s*const queryParams = \{ \.\.\.this\.queryParams \};\s*this\.applyMoreSearchToQueryParams\(queryParams\);\s*queryParams\.stockStatus = "1";\s*queryParams\.stockType = "502";[\s\S]*?\.finally\(\(\) => \{\s*this\.loading = false;\s*\}\);\s*\}/,
  `getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      queryParams.stockStatus = "1";
      queryParams.stockType = "502";
      listStocktaking(queryParams)
        .then((response) => {
          this.stocktakingList = (response && response.rows) || [];
          this.total = (response && response.total) || 0;
          this.loading = false;
          this.$nextTick(() => {
            this.restoreMainPageSelection();
            this.scheduleApplyLayoutRefresh();
          });
        })
        .catch(() => {
          this.stocktakingList = [];
          this.total = 0;
          this.loading = false;
          this.scheduleApplyLayoutRefresh();
        });
    }`
);

// --- resetQuery ---
content = content.replace(
  /resetQuery\(\) \{\s*this\.resetForm\("queryForm"\);\s*this\.moreSearchTypes = this\.loadMoreSearchDefaults\(\);\s*this\.onMoreSearchTypesChange\(\);\s*this\.handleQuery\(\);\s*\}/,
  `resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.stockNo = null;
      this.queryParams.departmentId = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    }`
);

// --- handleSelectionChange ---
content = content.replace(
  /handleSelectionChange\(selection\) \{\s*this\.ids = selection\.map\(item => item\.id\)\s*this\.single = selection\.length!==1\s*this\.multiple = !selection\.length\s*\}/,
  `handleSelectionChange(selection) {
      const pageKeys = (this.stocktakingList || [])
        .map((row) => this.getApplyMainRowKey(row))
        .filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key);
        }
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) {
          this.$set(this.selectedRowMap, key, row);
        }
      });
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    }`
);

// --- remove stocktakingListIndex ---
content = content.replace(/\s*stocktakingListIndex\(\{ row, rowIndex \}\) \{[\s\S]*?\},\s*/m, '\n');

// --- remove moreSearch methods ---
content = content.replace(/\s*moreSearchFieldClass\(t\) \{[\s\S]*?\},\s*/m, '\n');
content = content.replace(/\s*loadMoreSearchDefaults\(\) \{[\s\S]*?\},\s*/m, '\n');
content = content.replace(/\s*applyMoreSearchToQueryParams\(target\) \{[\s\S]*?\},\s*/m, '\n');
content = content.replace(/\s*onMoreSearchTypesChange\(\) \{[\s\S]*?\},\s*/m, '\n');

// --- handleExport: drop applyMoreSearch ---
content = content.replace(/\s*this\.applyMoreSearchToQueryParams\(exportQuery\);\s*/g, '\n');

// --- styles ---
const tableOptMarker = '/* 表格样式优化 */';
const profitMarker = '/* 新增盘盈明细弹窗';

const styleScopedStart = content.indexOf('<style scoped>');
const scopedInnerStart = styleScopedStart + '<style scoped>'.length;
const tableOptInScoped = content.indexOf(tableOptMarker, styleScopedStart);
const firstScopedEnd = content.indexOf('</style>', styleScopedStart);
let modalScoped = content.substring(
  scopedInnerStart,
  tableOptInScoped >= 0 ? tableOptInScoped : firstScopedEnd
);
// 去掉旧列表页残留（全局 .mb8、主表滚动条等）
modalScoped = modalScoped.replace(/\n\.mb8\s*\{[\s\S]*?margin-bottom:\s*8px\s*!important;\s*\}\s*/m, '\n');
modalScoped = modalScoped.replace(
  /\/\* 仅列表主表滚动条[\s\S]*?::v-deep \.stocktaking-apply-page > \.el-table\.table-compact[\s\S]*?background: #a8a8a8;\s*\}\s*/m,
  ''
);

const profitStyleStart = content.lastIndexOf('<style>', content.indexOf(profitMarker));
const profitBlock = content.substring(profitStyleStart);

const bcScopedEnd = bc.indexOf('</style>', bc.indexOf('<style scoped>'));
const bcScopedShared = bc.substring(bc.indexOf(tableOptMarker), bcScopedEnd);

let nonScoped = bc.match(/<style>\r?\n\/\* 本页主容器[\s\S]*?<\/style>/)[0]
  .replace(/batch-consume-page/g, 'stocktaking-apply-page');

const stocktakingExtras = `
/* 单据状态列：表头与内容不换行 */
.app-container.stocktaking-apply-page .apply-main-table th.stocktaking-col-stock-status .cell,
.app-container.stocktaking-apply-page .apply-main-table td.stocktaking-col-stock-status .cell {
  white-space: nowrap !important;
}

.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
`;
nonScoped = nonScoped.replace('</style>', `${stocktakingExtras}\n</style>`);

const scriptEnd = content.indexOf('<style scoped>');
const prefix = content.substring(0, scriptEnd);

content = [
  prefix,
  '<style scoped>',
  modalScoped.trimEnd(),
  '',
  bcScopedShared.trimEnd(),
  '</style>',
  '',
  nonScoped.trimEnd(),
  '',
  profitBlock.trimEnd(),
  ''
].join('\n');

fs.writeFileSync(STOCK_PATH, content, 'utf8');

const blocks = [...content.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].map((m, i) => ({
  i: i + 1,
  attrs: m[1].trim(),
  len: m[2].length
}));
console.log('OK lines:', content.split(/\n/).length);
console.log('blocks:', blocks);
console.log('apply-table-panel:', content.includes('apply-table-panel'));
console.log('height: 50px:', /height:\s*50px/.test(content));
console.log('margin-top: -20px in list-query:', /\.list-query-panel\s*\{[^}]*margin-top:\s*-20px/.test(content));
