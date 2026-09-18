export default {
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
    initDeptConsumeLayout() {
      this.$nextTick(() => {
        this.updateTableHeight();
        setTimeout(() => this.updateTableHeight(), 80);
      });
      window.addEventListener('resize', this.updateTableHeight);
    },
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
    getDeptConsumeRowKey(row) {
      return (row && row._rowKey) || '';
    },
    deptConsumeRowClassName({ row }) {
      const key = this.getDeptConsumeRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'dept-consume-row-selected';
      }
      return '';
    },
    handleSelectionChange(selection) {
      this.selectedRowKeys = (selection || []).map(row => this.getDeptConsumeRowKey(row));
    },
    handleDeptConsumeRowDblclick(row) {
      const table = this.$refs.reportTable;
      if (!table || !row) return;
      const key = this.getDeptConsumeRowKey(row);
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || [];
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getDeptConsumeRowKey(r) === key)
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
    }
  }
};
