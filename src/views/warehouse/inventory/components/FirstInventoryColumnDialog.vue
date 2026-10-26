<template>
    <el-dialog
      v-dialogDrag
      title="列设置"
      :visible.sync="columnDialogVisible"
      width="720px"
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
              <span>列设置 {{ visibleColumnList.length }}/{{ columns.length }} 显示</span>
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
                :disabled="!canMoveColumnUp"
                @click.stop="moveColumn(-1)"
              >上移</el-button>
              <el-button
                type="text"
                icon="el-icon-arrow-down"
                :disabled="!canMoveColumnDown"
                @click.stop="moveColumn(1)"
              >下移</el-button>
            </span>
          </div>
          <div class="column-panel-body">
            <div
              v-for="c in orderedColumns"
              :key="'col-' + c.key"
              class="column-row"
              :class="{ 'is-selected': columnActiveKey === String(c.key) }"
              @click="selectColumnRow(c.key)"
            >
              <el-checkbox
                :value="!!c.visible"
                @change="(val) => setColumnVisible(c.key, val)"
                @click.native.stop
              />
              <span class="column-row-label" :title="c.label">{{ c.label }}</span>
              <el-checkbox
                class="column-row-sortable"
                :value="!!c.sortable"
                @change="(val) => setColumnSortable(c.key, val)"
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
                @change="(val) => setColumnWidth(c.key, val)"
                @click.native.stop
              />
              <el-radio-group
                class="column-row-align"
                size="mini"
                :value="c.align || 'center'"
                @input="(val) => setColumnAlign(c.key, val)"
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
          @click="saveColumnConfig"
        >保 存</el-button>
        <el-button
          type="success"
          size="small"
          icon="el-icon-refresh"
          class="spd-btn"
          @click="initColumnConfig"
        >初始化</el-button>
        <el-button
          type="danger"
          size="small"
          icon="el-icon-close"
          class="spd-btn"
          @click="columnDialogVisible = false"
        >关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'FirstInventoryColumnDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'firstInventory')],
  inheritAttrs: false
}
</script>
