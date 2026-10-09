<template>
  <el-dialog
    v-dialogDrag
    title="列设置"
    :visible.sync="dialogVisible"
    width="720px"
    top="0"
    append-to-body
    :modal="false"
    :close-on-click-modal="false"
    custom-class="inventory-column-dialog"
    :show-close="false"
  >
    <div class="column-panels column-panels--single">
      <div class="column-panel">
        <div class="column-panel-head">
          <span class="column-panel-head-title">
            <span>列设置 {{ visibleCount }}/{{ totalCount }} 显示</span>
            <el-tooltip
              placement="bottom-start"
              effect="light"
              popper-class="column-dialog-help-tooltip"
            >
              <div slot="content" class="column-dialog-help-content">
                勾选为显示、取消勾选为隐藏；「排序」勾选后该列可升/降序，未勾选则不可排序；点击行后可点上移/下移调整顺序；可设置列宽与明细对齐（左/中/右）。表头固定居中。「初始化」恢复系统默认且不保留本次修改。
              </div>
              <i class="el-icon-question column-dialog-help-icon" />
            </el-tooltip>
          </span>
          <span class="column-panel-head-actions">
            <el-button
              type="text"
              icon="el-icon-arrow-up"
              :disabled="!canMoveUp"
              @click.stop="$emit('move', -1)"
            >上移</el-button>
            <el-button
              type="text"
              icon="el-icon-arrow-down"
              :disabled="!canMoveDown"
              @click.stop="$emit('move', 1)"
            >下移</el-button>
          </span>
        </div>
        <div class="column-panel-body">
          <div
            v-for="c in orderedColumns"
            :key="'col-' + c.key"
            class="column-row"
            :class="{ 'is-selected': activeKey === String(c.key) }"
            @click="$emit('select-row', c.key)"
          >
            <el-checkbox
              :value="!!c.visible"
              @change="(val) => $emit('set-visible', c.key, val)"
              @click.native.stop
            />
            <span class="column-row-label" :title="c.label">{{ c.label }}</span>
            <el-checkbox
              class="column-row-sortable"
              :value="!!c.sortable"
              @change="(val) => $emit('set-sortable', c.key, val)"
              @click.native.stop
            >排序</el-checkbox>
            <el-input-number
              class="column-row-width"
              size="mini"
              :min="40"
              :max="800"
              :step="10"
              controls-position="right"
              :value="c.width"
              @change="(val) => $emit('set-width', c.key, val)"
              @click.native.stop
            />
            <el-radio-group
              class="column-row-align"
              size="mini"
              :value="c.align || 'center'"
              @input="(val) => $emit('set-align', c.key, val)"
              @click.native.stop
            >
              <el-radio-button label="left">左</el-radio-button>
              <el-radio-button label="center">中</el-radio-button>
              <el-radio-button label="right">右</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="!orderedColumns.length" class="column-panel-empty">无列</div>
        </div>
      </div>
    </div>
    <div slot="footer" class="column-dialog-footer">
      <el-button
        type="primary"
        size="small"
        icon="el-icon-check"
        class="spd-btn spd-btn--primary"
        @click="$emit('save')"
      >保 存</el-button>
      <el-button
        type="success"
        size="small"
        icon="el-icon-refresh"
        class="spd-btn"
        @click="$emit('init')"
      >初始化</el-button>
      <el-button
        type="danger"
        size="small"
        icon="el-icon-close"
        class="spd-btn"
        @click="dialogVisible = false"
      >关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "TableColumnSettingDialog",
  props: {
    visible: { type: Boolean, default: false },
    orderedColumns: { type: Array, default: () => [] },
    visibleCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    activeKey: { type: String, default: null },
    canMoveUp: { type: Boolean, default: false },
    canMoveDown: { type: Boolean, default: false }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(v) {
        this.$emit("update:visible", v);
      }
    }
  }
};
</script>

<style>
.column-dialog-help-tooltip .column-dialog-help-content {
  max-width: 360px;
  font-size: 13px;
  line-height: 1.5;
  color: #f56c6c;
}

.inventory-column-dialog {
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  margin-top: 0 !important;
}
.inventory-column-dialog .el-dialog__header {
  cursor: move;
  padding: 12px 16px 8px;
  flex-shrink: 0;
}
.inventory-column-dialog .el-dialog__body {
  flex: 1 1 auto;
  overflow: hidden;
  padding: 8px 16px 4px;
  min-height: 0;
}
.inventory-column-dialog .column-panels,
.inventory-column-dialog .column-panel {
  min-height: 0;
  max-height: none;
}
.inventory-column-dialog .column-panel-body {
  max-height: min(420px, calc(100vh - 260px));
}
.inventory-column-dialog .el-dialog__footer {
  padding: 10px 16px 14px;
}
.inventory-column-dialog .column-dialog-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.inventory-column-dialog .column-dialog-footer .el-button {
  margin: 0 !important;
  min-width: 96px;
}
.el-dialog__wrapper:has(> .inventory-column-dialog) {
  pointer-events: none;
}
.el-dialog__wrapper:has(> .inventory-column-dialog) .inventory-column-dialog {
  pointer-events: auto;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
}

.column-panel-head-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.column-dialog-help-icon {
  font-size: 16px;
  color: #f56c6c;
  cursor: help;
  line-height: 1;
}
.column-dialog-help-icon:hover {
  color: #f78989;
}
.column-dialog-help-content {
  max-width: 360px;
  font-size: 13px;
  line-height: 1.5;
  color: #f56c6c;
}
.column-panels {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-height: 0;
}
.column-panels--single {
  display: block;
  min-height: 0;
}
.column-panels--single .column-panel {
  width: 100%;
}
.column-panel {
  flex: 1;
  min-width: 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.column-panel-head {
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.column-panel-head-actions .el-button {
  padding: 0 4px;
  font-size: 12px;
}
.column-panel-body {
  flex: 1;
  overflow: auto;
  max-height: 420px;
  padding: 6px 0;
}
.column-panel-empty {
  padding: 24px 12px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
.column-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
}
.column-row:hover,
.column-row.is-selected {
  background: #f0f7ff;
}
.column-row-label {
  flex: 1;
  min-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #303133;
}
.column-row-sortable {
  flex-shrink: 0;
  margin-right: 0;
  white-space: nowrap;
}
.column-row-sortable .el-checkbox__label {
  padding-left: 4px;
  font-size: 12px;
  color: #606266;
}
.column-row-width {
  width: 96px;
  flex-shrink: 0;
}
.column-row-width .el-input__inner {
  padding-left: 4px;
  padding-right: 28px;
}
.column-row-align {
  flex-shrink: 0;
}
.column-row-align .el-radio-button__inner {
  padding: 5px 8px;
}
</style>
