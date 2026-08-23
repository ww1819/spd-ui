const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('  computed: {');
const end = s.indexOf('  created() {', start);
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const fixed = `  computed: {
    /** 与到货验收弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    },
    isAudited() {
      return this.form.orderStatus == 2 || this.form.orderStatus == '2';
    },
    udiScanPreviewTableData() {
      return this.udiScanDialog.previewEntry ? [this.udiScanDialog.previewEntry] : [];
    }
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
        this.$nextTick(() => {
          const t = this.$refs.gzOrderEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    },
    gzOrderEntryList: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          const t = this.$refs.gzOrderEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    }
  },
`;

s = s.slice(0, start) + fixed + s.slice(end);
fs.writeFileSync(p, s, 'utf8');
console.log('ok', s.includes('detailTableHeight()'), !s.includes('computed: {\n    watch:'));
