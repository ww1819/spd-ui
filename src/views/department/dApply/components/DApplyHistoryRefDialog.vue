<template>
  <!-- 引用历史单据：顶栏搜索 + 左主表 + 右明细 -->
  <transition name="modal-fade">
    <div
      v-if="historyRefDialogVisible"
      class="local-modal-mask history-ref-dialog-mask"
      @click.self="closeHistoryRefDialog"
    >
      <transition name="modal-zoom">
        <div v-if="historyRefDialogVisible" class="local-modal-content history-ref-dialog-content">
          <div class="modal-header">
            <div class="modal-title">引用历史单据</div>
            <el-button size="small" class="close-btn" @click="closeHistoryRefDialog">关闭</el-button>
          </div>

          <div class="history-ref-dialog-body">
            <div class="form-fields-container list-query-panel apply-modal-query-panel history-ref-query">
              <el-form :model="historyRefQuery" size="small" class="history-ref-query-form" @submit.native.prevent>
                <el-row :gutter="0" type="flex" class="apply-modal-form-row history-ref-query-row" align="middle">
                  <el-col class="history-ref-date-wrap">
                    <el-form-item label="日期" label-width="48px" class="history-ref-date-item">
                      <el-date-picker
                        v-model="historyRefQuery.beginDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="起始日期"
                        clearable
                        class="history-ref-date-picker"
                      />
                      <span class="history-ref-date-sep">至</span>
                      <el-date-picker
                        v-model="historyRefQuery.endDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="截止日期"
                        clearable
                        class="history-ref-date-picker"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单号" label-width="48px">
                      <el-input
                        v-model="historyRefQuery.applyBillNo"
                        placeholder="单号"
                        clearable
                        @keyup.enter.native="handleHistoryRefSearch"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" label-width="70px">
                      <el-select v-model="historyRefQuery.applyBillStatus" placeholder="单据状态" clearable style="width: 140px">
                        <el-option label="未审核" value="1" />
                        <el-option label="已审核" value="2" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field history-ref-query-actions">
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" icon="el-icon-search" @click="handleHistoryRefSearch">搜索</el-button>
                    <el-button size="small" class="spd-btn spd-btn--secondary" icon="el-icon-refresh" @click="handleHistoryRefReset">重置</el-button>
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" icon="el-icon-check" :disabled="!historyRefDetailSelection.length" @click="confirmRefHistoryBill">确 定</el-button>
                    <el-button size="small" @click="closeHistoryRefDialog">取 消</el-button>
                  </el-col>
                </el-row>
              </el-form>
            </div>

            <div class="history-ref-split-layout">
              <div class="history-ref-left-panel">
                <div class="history-ref-table-wrap">
                  <el-table
                    ref="historyRefBillTable"
                    v-loading="historyRefLoading"
                    class="table-compact apply-main-table history-ref-bill-table"
                    :data="historyRefBillList"
                    :height="historyRefTableHeight"
                    :row-class-name="historyRefBillRowClassName"
                    highlight-current-row
                    border
                    stripe
                    size="small"
                    @row-click="onHistoryRefBillRowClick"
                  >
                    <el-table-column width="50" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col">
                      <template slot-scope="scope">
                        <el-checkbox
                          :value="!!(selectedHistoryRefBill && selectedHistoryRefBill.id === scope.row.id)"
                          @change="(checked) => onSelectHistoryRefBill(checked ? scope.row : null)"
                          @click.native.stop
                        />
                      </template>
                    </el-table-column>
                    <el-table-column label="序号" width="56" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ (historyRefQuery.pageNum - 1) * historyRefQuery.pageSize + scope.$index + 1 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="单号" prop="applyBillNo" width="160" align="center" show-overflow-tooltip sortable />
                    <el-table-column label="科室" prop="department.name" width="100" align="center" show-overflow-tooltip sortable :sort-method="(a, b) => sortByNested(a, b, 'department.name')">
                      <template slot-scope="scope">
                        {{ (scope.row.department && scope.row.department.name) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="制单人" prop="createrNmae" width="90" align="center" show-overflow-tooltip />
                    <el-table-column label="制单日期" width="160" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="审核人" prop="auditPersonName" width="90" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.auditPersonName || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="审核日期" width="160" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') || '—' }}
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div class="history-ref-pagination">
                  <pagination
                    :total="historyRefTotal"
                    :page.sync="historyRefQuery.pageNum"
                    :limit.sync="historyRefQuery.pageSize"
                    :page-sizes="[10, 20, 50]"
                    :pager-count="5"
                    :auto-scroll="false"
                    popper-class="history-ref-size-popper"
                    layout="sizes, prev, pager, next, jumper"
                    @pagination="loadHistoryRefBillList"
                  />
                </div>
              </div>

              <div class="history-ref-right-panel">
                <div class="history-ref-table-wrap">
                  <el-table
                    ref="historyRefDetailTable"
                    v-loading="historyRefDetailLoading"
                    class="table-compact apply-main-table history-ref-detail-table"
                    :data="historyRefDetailList"
                    :height="historyRefTableHeight"
                    border
                    stripe
                    size="small"
                    @selection-change="handleHistoryRefDetailSelectionChange"
                    @row-dblclick="handleHistoryRefDetailRowDblclick"
                  >
                    <el-table-column type="selection" width="50" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                    <el-table-column label="序号" width="56" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">{{ scope.$index + 1 }}</template>
                    </el-table-column>
                    <el-table-column label="产品编码" min-width="120" align="center" show-overflow-tooltip sortable :sort-method="(a, b) => sortByNested(a, b, 'material.code')">
                      <template slot-scope="scope">
                        {{ (scope.row.material && scope.row.material.code) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="产品名称" min-width="140" align="center" show-overflow-tooltip sortable :sort-method="(a, b) => sortByNested(a, b, 'material.name')">
                      <template slot-scope="scope">
                        {{ (scope.row.material && scope.row.material.name) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" width="100" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ (scope.row.material && scope.row.material.speci) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" width="90" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ (scope.row.material && scope.row.material.model) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" width="70" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="数量" width="80" align="right" show-overflow-tooltip>
                      <template slot-scope="scope">{{ fmtQty(scope.row.qty) }}</template>
                    </el-table-column>
                    <el-table-column label="单价" width="90" align="right" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.unitPrice != null ? scope.row.unitPrice : (scope.row.price != null ? scope.row.price : '—') }}
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" width="100" align="right" show-overflow-tooltip>
                      <template slot-scope="scope">{{ scope.row.amt != null ? scope.row.amt : '—' }}</template>
                    </el-table-column>
                    <el-table-column label="仓库" width="110" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ (scope.row.stockWarehouse && scope.row.stockWarehouse.name) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" min-width="140" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ (scope.row.material && scope.row.material.registerNo) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" min-width="140" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="供应商" min-width="140" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '—' }}
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DApplyHistoryRefDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApply')],
  inheritAttrs: false,
  watch: {
    historyRefDialogVisible(val) {
      if (val) {
        this.$nextTick(() => {
          if (typeof this.calcHistoryRefTableHeight === 'function') {
            this.calcHistoryRefTableHeight()
          }
          this.forceHistoryRefSizeSelectUp()
        })
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.onHistoryRefWindowResize)
    this.forceHistoryRefSizeSelectUp()
  },
  updated() {
    this.forceHistoryRefSizeSelectUp()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onHistoryRefWindowResize)
  },
  methods: {
    onHistoryRefWindowResize() {
      if (this.historyRefDialogVisible && typeof this.calcHistoryRefTableHeight === 'function') {
        this.calcHistoryRefTableHeight()
      }
    },
    onHistoryRefBillRowClick(row) {
      if (typeof this.onSelectHistoryRefBill === 'function') {
        this.onSelectHistoryRefBill(row)
      }
    },
    /** 每页条数下拉改为向上展开，避免贴底被遮挡 */
    forceHistoryRefSizeSelectUp() {
      const root = this.$el
      if (!root || !root.querySelector) return
      const selectEl = root.querySelector('.history-ref-pagination .el-pagination__sizes .el-select')
      const selectVm = selectEl && selectEl.__vue__
      if (!selectVm) return
      if (selectVm.placement !== 'top-start') {
        selectVm.placement = 'top-start'
      }
    }
  }
}
</script>

<style scoped>
.history-ref-dialog-mask {
  display: flex !important;
  align-items: stretch !important;
  justify-content: stretch !important;
  padding: 8px !important;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.35) !important;
  z-index: 2200;
}

.history-ref-dialog-content {
  position: relative;
  min-height: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  max-width: 100% !important;
  width: 100% !important;
  margin: 0 !important;
  border-radius: 6px !important;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  background: #fff;
}

.history-ref-dialog-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #f5f7fa;
}

.history-ref-query {
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 8px 12px 4px;
}

.history-ref-query-form >>> .el-form-item {
  margin-bottom: 8px;
}

.history-ref-query-row {
  flex-wrap: wrap;
}

.history-ref-date-wrap {
  flex: 0 0 auto;
  max-width: 100%;
}

.history-ref-date-item >>> .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.history-ref-date-picker {
  width: 150px;
}

/* 左侧选中行：鼠标移开仍保持高亮 */
.history-ref-bill-table >>> .el-table__body tr.history-ref-bill-row--selected > td {
  background-color: #d9ecff !important;
}

.history-ref-bill-table >>> .el-table__body tr.history-ref-bill-row--selected:hover > td {
  background-color: #c6e2ff !important;
}

/* 右侧明细横向滚动条加粗，便于拖动（覆盖列表页 thin 滚动条） */
.history-ref-detail-table >>> .el-table__body-wrapper {
  overflow: auto !important;
  scrollbar-width: auto !important;
  scrollbar-color: #a8a8a8 #f1f1f1 !important;
}

.history-ref-detail-table >>> .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 14px !important;
  -webkit-appearance: none;
  appearance: none;
}

.history-ref-detail-table >>> .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 14px !important;
}

.history-ref-detail-table >>> .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 4px;
}

.history-ref-detail-table >>> .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 4px;
  min-width: 40px !important;
  min-height: 14px !important;
}

.history-ref-detail-table >>> .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.history-ref-date-sep {
  margin: 0 8px;
  color: #606266;
  flex-shrink: 0;
}

.history-ref-query-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 8px;
  flex: 0 0 auto;
}

.history-ref-split-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  gap: 0;
}

.history-ref-left-panel,
.history-ref-right-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: #fff;
  overflow: hidden;
}

/* 左侧约到「制单日期」可视宽度，审核人/审核日期横向滑动 */
.history-ref-left-panel {
  flex: 0 0 620px;
  width: 620px;
  max-width: 42%;
  border-right: 1px solid #e4e7ed;
}

.history-ref-right-panel {
  flex: 1;
}

.history-ref-table-wrap {
  flex: 1;
  min-height: 0;
  padding: 8px 8px 0;
  overflow: hidden;
}

.history-ref-pagination {
  flex-shrink: 0;
  padding: 0 8px 10px;
  margin-top: -18px;
  position: relative;
  z-index: 6;
}

.history-ref-pagination >>> .pagination-container {
  padding: 0;
  background: transparent;
}

.history-ref-pagination >>> .el-pagination {
  padding: 0;
  white-space: nowrap;
}

/* Element pagerCount 最小为 5，首页会多出「4」；藏掉后显示 1 2 3 … 末页 */
.history-ref-pagination >>> .el-pager li.number:nth-child(4):nth-last-child(3) {
  display: none !important;
}

</style>

<style>
/* 挂到 body 的每页条数下拉：置顶打开 + 盖过历史单据弹层 */
.history-ref-size-popper {
  z-index: 3200 !important;
}
</style>
