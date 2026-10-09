import { getUserUiConfig, saveUserUiConfig } from "@/api/system/userUiConfig";

/**
 * 表格列设置（显隐 / 列宽 / 对齐 / 排序开关 / 顺序），与库存明细「列设置」同口径。
 * @param {Object} options
 * @param {() => Array} options.createDefaultColumns 默认列工厂
 * @param {string} options.configKey 用户 UI 配置键
 * @param {string} [options.tableRef='table'] 表格 ref，用于 doLayout
 */
export function createTableColumnSettingsMixin(options) {
  const createDefaultColumns = options.createDefaultColumns;
  const configKey = options.configKey;
  const tableRef = options.tableRef || "table";

  function createDefaultColumnOrder() {
    return createDefaultColumns().map(c => c.key);
  }

  return {
    data() {
      return {
        columns: createDefaultColumns(),
        columnOrder: createDefaultColumnOrder(),
        tableColumnEpoch: 0,
        columnDialogVisible: false,
        columnActiveKey: null,
        columnConfigKey: configKey
      };
    },
    computed: {
      orderedColumns() {
        const map = {};
        (this.columns || []).forEach(c => {
          map[String(c.key)] = c;
        });
        const order =
          this.columnOrder && this.columnOrder.length
            ? this.columnOrder
            : createDefaultColumnOrder();
        const list = [];
        order.forEach(k => {
          const c = map[String(k)];
          if (c) list.push(c);
        });
        (this.columns || []).forEach(c => {
          if (!list.some(x => String(x.key) === String(c.key))) list.push(c);
        });
        return list;
      },
      visibleColumnList() {
        return this.orderedColumns.filter(c => c.visible);
      },
      canMoveColumnUp() {
        if (!this.columnActiveKey) return false;
        const list = this.orderedColumns;
        return list.findIndex(c => String(c.key) === this.columnActiveKey) > 0;
      },
      canMoveColumnDown() {
        if (!this.columnActiveKey) return false;
        const list = this.orderedColumns;
        const i = list.findIndex(c => String(c.key) === this.columnActiveKey);
        return i >= 0 && i < list.length - 1;
      },
      /** 按顺序的可见列（供表格 v-for） */
      tableColumnItems() {
        return this.orderedColumns
          .filter(col => col.visible)
          .map(col => ({ type: "col", col }));
      }
    },
    methods: {
      openColumnDialog() {
        this.columnActiveKey = null;
        this.columnDialogVisible = true;
      },
      selectColumnRow(key) {
        const k = String(key);
        this.columnActiveKey = this.columnActiveKey === k ? null : k;
      },
      setColumnVisible(key, val) {
        const col = this.columns.find(c => String(c.key) === String(key));
        if (!col) return;
        col.visible = !!val;
      },
      setColumnSortable(key, val) {
        const col = this.columns.find(c => String(c.key) === String(key));
        if (!col) return;
        col.sortable = !!val;
        this.refreshTableColumns();
      },
      moveColumn(delta) {
        const key = this.columnActiveKey;
        if (!key) return;
        const list = this.orderedColumns;
        const i = list.findIndex(c => String(c.key) === key);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= list.length) return;
        const keyA = String(list[i].key);
        const keyB = String(list[j].key);
        const order =
          this.columnOrder && this.columnOrder.length
            ? this.columnOrder.slice()
            : createDefaultColumnOrder();
        const ia = order.findIndex(k => String(k) === keyA);
        const ib = order.findIndex(k => String(k) === keyB);
        if (ia < 0 || ib < 0) return;
        const tmp = order[ia];
        order[ia] = order[ib];
        order[ib] = tmp;
        this.columnOrder = order;
        this.tableColumnEpoch += 1;
      },
      setColumnWidth(key, val) {
        const col = this.columns.find(c => String(c.key) === String(key));
        if (!col) return;
        const n = Number(val);
        col.width = Number.isFinite(n)
          ? Math.min(800, Math.max(40, Math.round(n)))
          : 120;
      },
      setColumnAlign(key, val) {
        const col = this.columns.find(c => String(c.key) === String(key));
        if (!col) return;
        col.align =
          val === "left" || val === "right" || val === "center" ? val : "center";
      },
      refreshTableColumns() {
        this.tableColumnEpoch += 1;
        this.$nextTick(() => {
          const t = this.$refs[tableRef];
          if (t && t.doLayout) t.doLayout();
        });
      },
      loadUserColumnConfig() {
        return getUserUiConfig(this.columnConfigKey)
          .then(res => {
            const payload = res && res.data;
            const val = payload && payload.configValue;
            if (!val || String(val).trim() === "") return;
            try {
              const o = typeof val === "string" ? JSON.parse(val) : val;
              const hidden = o.hiddenKeys || [];
              const hiddenSet = new Set(hidden.map(k => String(k)));
              const widths = o.widths || {};
              const aligns = o.aligns || {};
              const sortables = o.sortables || {};
              const hasSortables = o.sortables != null;
              this.columns.forEach(c => {
                c.visible = !hiddenSet.has(String(c.key));
                const w = widths[String(c.key)];
                if (w != null && w !== "") {
                  const n = Number(w);
                  if (Number.isFinite(n) && n >= 40) {
                    c.width = Math.min(800, Math.round(n));
                  }
                }
                const a = aligns[String(c.key)];
                if (a === "left" || a === "right" || a === "center") {
                  c.align = a;
                } else if (!c.align) {
                  c.align = "center";
                }
                if (hasSortables) {
                  const s = sortables[String(c.key)];
                  c.sortable =
                    s === true || s === "true" || s === 1 || s === "1";
                } else if (c.sortable == null) {
                  c.sortable = false;
                }
              });
              const orderKeys = o.orderKeys;
              if (Array.isArray(orderKeys) && orderKeys.length) {
                const valid = new Set(this.columns.map(c => String(c.key)));
                const seen = new Set();
                const next = [];
                orderKeys.forEach(k => {
                  const s = String(k);
                  if (!valid.has(s) || seen.has(s)) return;
                  seen.add(s);
                  const n = Number(k);
                  next.push(Number.isFinite(n) ? n : k);
                });
                this.columns.forEach(c => {
                  const s = String(c.key);
                  if (!seen.has(s)) {
                    seen.add(s);
                    next.push(c.key);
                  }
                });
                this.columnOrder = next;
              }
              this.refreshTableColumns();
            } catch (e) {
              console.warn("loadUserColumnConfig", e);
            }
          })
          .catch(() => {});
      },
      saveColumnConfig() {
        const hiddenKeys = this.columns.filter(c => !c.visible).map(c => c.key);
        const widths = {};
        const aligns = {};
        const sortables = {};
        this.columns.forEach(c => {
          widths[String(c.key)] = Number(c.width) || 120;
          aligns[String(c.key)] = c.align || "center";
          sortables[String(c.key)] = !!c.sortable;
        });
        const orderKeys =
          this.columnOrder && this.columnOrder.length
            ? this.columnOrder.slice()
            : createDefaultColumnOrder();
        saveUserUiConfig({
          configKey: this.columnConfigKey,
          configValue: JSON.stringify({
            hiddenKeys,
            widths,
            aligns,
            sortables,
            orderKeys
          })
        })
          .then(() => {
            this.$modal.msgSuccess("保存成功");
            this.columnDialogVisible = false;
            this.refreshTableColumns();
          })
          .catch(err => {
            const m = err && err.message ? String(err.message) : "";
            if (m.includes("404")) {
              this.$modal.msgError(
                "保存失败（404）：服务器上还没有「用户界面配置」接口。请先重新编译并部署最新 spd-admin；再在数据库执行脚本 spd/sql/create_sys_user_ui_config.sql。仅执行建表不能消除 404。"
              );
            } else if (m.includes("500")) {
              this.$modal.msgError(
                "保存失败：可能是未建表。请在数据库执行 spd/sql/create_sys_user_ui_config.sql 后重试。"
              );
            } else {
              this.$modal.msgError(
                m ? `保存失败：${m}` : "保存失败，请检查网络或稍后重试"
              );
            }
          });
      },
      initColumnConfig() {
        this.columns = createDefaultColumns();
        this.columnOrder = createDefaultColumnOrder();
        this.columnActiveKey = null;
        this.refreshTableColumns();
        saveUserUiConfig({
          configKey: this.columnConfigKey,
          configValue: ""
        })
          .then(() => {
            this.$modal.msgSuccess("已初始化为系统默认");
            this.columnDialogVisible = false;
          })
          .catch(() => {
            this.$modal.msgSuccess("已初始化为系统默认（本地）");
            this.columnDialogVisible = false;
          });
      }
    }
  };
}
