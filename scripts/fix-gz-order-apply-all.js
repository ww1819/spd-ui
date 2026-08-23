const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
let s = fs.readFileSync(p, 'utf8');

s = s.replace(/\s*ref="orderTable"\s*/g, '\n              ');

if (s.includes('v-show="total>0"')) {
  s = s.replace(
    '<pagination\n      v-show="total>0"',
    '<div class="apply-pagination-wrap" ref="paginationWrap">\n    <pagination'
  );
}
if (!s.includes('class="apply-pagination-wrap"')) {
  s = s.replace(
    /(@pagination="getList"\s*\/>)(\s*\n\s*<\/div>\s*\n\s*<\/div>)/,
    '$1\n    </div>$2'
  );
}

s = s.replace(
  /this\.\$confirm\('当前修改尚未保存，请先保存再操作[^']*', '提示'/,
  "this.$confirm('当前修改尚未保存，请先保存再操作。', '提示'"
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

if (!s.includes('applyMainRowClassName({ row, rowIndex })')) {
  s = s.replace(/methods: \{\r?\n    buildSnapshot\(\)/, `methods: {\n    ${layoutMethods}buildSnapshot()`);
}

s = s.replace(/\s*this\.applyMoreSearchToQueryParams\([^)]+\);\s*/g, '\n      ');
s = s.replace(
  /if \(this\.\$refs\.orderTable\) \{\s*this\.\$refs\.orderTable\.doLayout\(\);\s*\}/g,
  'this.restoreMainPageSelection();\n          this.scheduleApplyLayoutRefresh();'
);

if (!s.includes('scheduleApplyLayoutRefresh();\n        this.$modal.msgError')) {
  s = s.replace(
    /this\.loading = false;\s*this\.\$modal\.msgError\('查询失败/,
    `this.loading = false;
        this.scheduleApplyLayoutRefresh();
        this.$modal.msgError('查询失败`
  );
}

// brace balance fix
const lines = s.split('\n');
const start = lines.findIndex((l) => l.includes('export default {'));
const end = lines.findIndex((l, i) => i > start && l.trim() === '};' && lines[i + 1] && lines[i + 1].includes('</script>'));
let d = 0;
for (let i = start; i <= end; i++) {
  for (const c of lines[i]) {
    if (c === '{') d++;
    if (c === '}') d--;
  }
}
if (d === 1) {
  s = s.replace(/\r?\n\};\r?\n<\/script>/, '\n}\n};\n</script>');
}

fs.writeFileSync(p, s);
console.log(JSON.stringify({
  orderTable: /ref="orderTable"/.test(s),
  applyMain: /ref="applyMainTable"/.test(s),
  hasMethods: s.includes('applyMainRowClassName({ row, rowIndex })'),
  pagWrap: s.includes('apply-pagination-wrap'),
}, null, 2));
