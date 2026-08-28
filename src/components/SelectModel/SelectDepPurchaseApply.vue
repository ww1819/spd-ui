<template>
  <div
    v-show="show"
    class="local-modal-mask material-filter-mask dep-purchase-select-mask"
    :class="{
      'material-filter-mask--nested': nested,
      'dep-purchase-select-full-modal': !nested
    }"
  >
    <div
      class="local-modal-content material-filter-modal"
      :class="{
        'material-filter-modal--nested': nested,
        'apply-inbound-nested-modal': nested
      }"
    >
      <div class="modal-header">
        <div class="modal-title">{{ modalTitle }}</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <el-form
        :model="queryParams"
        ref="queryForm"
        v-show="showSearch"
        label-width="84px"
        size="small"
        class="modal-form-compact material-filter-form dep-purchase-select-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="科室申购单号" prop="purchaseBillNo" label-width="96px">
                <el-input
                  v-model="queryParams.purchaseBillNo"
                  placeholder="单号"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="汇总申购单号" prop="srcAggBillNo" label-width="96px">
                <el-input
                  v-model="queryParams.srcAggBillNo"
                  placeholder="来源汇总单号"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="仓库" prop="warehouseId" label-width="70px">
                <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow" />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="科室" prop="departmentId" label-width="70px">
                <SelectDepartment v-model="queryParams.departmentId" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">科室申购单信息</span>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-search"
              @click="handleQuery"
            >搜索</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              icon="el-icon-refresh"
              @click="resetQuery"
            >重置</el-button>
            <el-button
              type="danger"
              plain
              icon="el-icon-close"
              size="small"
              :disabled="!voidWholeEnabled()"
              v-hasPermi="['department:purchase:voidWhole','department:purchase:edit','outWarehouse:apply:edit']"
              @click="handleVoidWhole"
            >作废</el-button>
            <el-button size="small" @click="handleClose">取 消</el-button>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-check"
              @click="checkBtn"
            >确 定</el-button>
          </div>
        </el-row>

        <el-tabs v-model="queryParams.ckRefSheet" class="wh-apply-ck-tabs" @tab-click="onCkRefSheetTabClick">
          <el-tab-pane label="未引用" name="none" />
          <el-tab-pane label="部分引用" name="partial" />
          <el-tab-pane label="全部引用" name="full" />
          <el-tab-pane name="lineVoid">
            <span slot="label" title="已引用出库一部分后，对剩余未引用数量做明细作废">部分作废</span>
          </el-tab-pane>
          <el-tab-pane label="已作废" name="wholeVoid" />
        </el-tabs>

        <div
          v-if="nested"
          class="apply-table-panel"
          ref="filterTablePanel"
        >
          <el-table
            ref="depTable"
            v-loading="loading"
            class="table-compact apply-main-table"
            :data="depApplyList"
            :row-class-name="depApplyIndex"
            @selection-change="handleSelectionChange"
            :height="filterTableHeight"
            border
            stripe
          >
            <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
            <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable />
            <el-table-column
              label="科室申购单号"
              align="center"
              prop="purchaseBillNo"
              min-width="150"
              show-overflow-tooltip
              resizable
              sortable
              :sort-method="(a, b) => sortByStr(a, b, 'purchaseBillNo')"
            >
              <template slot-scope="scope">
                <el-button type="text" @click="handleViewDetail(scope.row)">
                  <span>{{ scope.row.purchaseBillNo }}</span>
                </el-button>
              </template>
            </el-table-column>
            <el-table-column
              label="汇总申购单号"
              align="center"
              prop="srcAggBillNo"
              min-width="140"
              show-overflow-tooltip
              resizable
              sortable
              :sort-method="(a, b) => sortByStr(a, b, 'srcAggBillNo')"
            />
            <el-table-column label="仓库" align="center" min-width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="科室" align="center" prop="department.name" min-width="100" show-overflow-tooltip resizable />
            <el-table-column label="已关联出库" align="center" prop="linkedCkTotal" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.linkedCkTotal != null ? formatQty(scope.row.linkedCkTotal) : '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="待出库数量" align="center" prop="pendingOutboundTotal" width="110" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.pendingOutboundTotal != null ? formatQty(scope.row.pendingOutboundTotal) : '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="作废状态" align="center" min-width="110" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ formatVoidStatus(scope.row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="作废人" align="center" min-width="90" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ formatVoidBy(scope.row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="作废时间" align="center" min-width="158" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ formatVoidTime(scope.row) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="审核日期"
              align="center"
              prop="auditDate"
              width="160"
              show-overflow-tooltip
              resizable
              sortable
              :sort-method="(a, b) => sortByDate(a, b, 'auditDate')"
            >
              <template slot-scope="scope">
                <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="apply-pagination-wrap" ref="filterPaginationWrap">
            <pagination
              class="modal-entry-pagination"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              :hide-on-single-page="false"
              @pagination="handlePagination"
            />
          </div>
        </div>

        <div v-else class="modal-detail-section apply-modal-table-panel">
          <div class="table-wrapper">
            <el-table
              ref="depTable"
              v-loading="loading"
              class="apply-detail-table"
              :data="depApplyList"
              :row-class-name="depApplyIndex"
              @selection-change="handleSelectionChange"
              height="calc(55vh)"
              border
            >
              <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable />
              <el-table-column
                label="科室申购单号"
                align="center"
                prop="purchaseBillNo"
                min-width="150"
                show-overflow-tooltip
                resizable
                sortable
                :sort-method="(a, b) => sortByStr(a, b, 'purchaseBillNo')"
              >
                <template slot-scope="scope">
                  <el-button type="text" @click="handleViewDetail(scope.row)">
                    <span>{{ scope.row.purchaseBillNo }}</span>
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column
                label="汇总申购单号"
                align="center"
                prop="srcAggBillNo"
                min-width="140"
                show-overflow-tooltip
                resizable
                sortable
                :sort-method="(a, b) => sortByStr(a, b, 'srcAggBillNo')"
              />
              <el-table-column label="仓库" align="center" min-width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="科室" align="center" prop="department.name" min-width="100" show-overflow-tooltip resizable />
              <el-table-column label="已关联出库" align="center" prop="linkedCkTotal" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.linkedCkTotal != null ? formatQty(scope.row.linkedCkTotal) : '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="待出库数量" align="center" prop="pendingOutboundTotal" width="110" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.pendingOutboundTotal != null ? formatQty(scope.row.pendingOutboundTotal) : '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="作废状态" align="center" min-width="110" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ formatVoidStatus(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="作废人" align="center" min-width="90" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ formatVoidBy(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="作废时间" align="center" min-width="158" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ formatVoidTime(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                label="审核日期"
                align="center"
                prop="auditDate"
                width="160"
                show-overflow-tooltip
                resizable
                sortable
                :sort-method="(a, b) => sortByDate(a, b, 'auditDate')"
              >
                <template slot-scope="scope">
                  <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="apply-pagination-wrap">
            <pagination
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="handlePagination"
            />
          </div>
        </div>
      </el-form>
    </div>

    <el-dialog :title="detailTitle" :visible.sync="openDetail" append-to-body width="88%" top="5vh" @close="openDetail = false">
      <el-table :data="entryPreviewList" border max-height="480" size="small">
        <el-table-column type="index" label="行" width="50" align="center" />
        <el-table-column label="耗材" min-width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申购数量" prop="qty" width="90" align="right" />
        <el-table-column label="可出库" prop="pendingOutboundQty" width="90" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.pendingOutboundQty != null ? formatQty(scope.row.pendingOutboundQty) : '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
import { listDepPurchaseApplyForCk } from '@/api/warehouse/outWarehouse'
import { getPurchase, voidDepPurchaseApplyWhole } from '@/api/department/purchase'

export default {
  name: 'SelectDepPurchaseApply',
  components: { SelectWarehouse, SelectDepartment },
  props: {
    DialogComponentShow: Boolean,
    warehouseValue: [Number, String],
    departmentValue: [Number, String],
    nested: {
      type: Boolean,
      default: false
    },
    modalTitle: {
      type: String,
      default: '引用科室申购单'
    }
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      isShow: true,
      showSearch: true,
      total: 0,
      depApplyList: [],
      entryPreviewList: [],
      detailTitle: '',
      openDetail: false,
      filterTableHeight: 400,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        purchaseBillNo: null,
        srcAggBillNo: null,
        warehouseId: null,
        departmentId: null,
        ckRefSheet: 'none'
      }
    }
  },
  mounted() {
    this.syncOpenFromProp()
    if (this.nested) {
      window.addEventListener('resize', this.onFilterWindowResize)
    }
  },
  beforeDestroy() {
    if (this.nested) {
      window.removeEventListener('resize', this.onFilterWindowResize)
    }
  },
  watch: {
    DialogComponentShow(val) {
      if (val) {
        this.syncOpenFromProp()
      } else {
        this.show = false
      }
    }
  },
  methods: {
    syncOpenFromProp() {
      this.show = !!this.DialogComponentShow
      this.queryParams.warehouseId = this.warehouseValue
      this.queryParams.departmentId = this.departmentValue
      if (this.show) {
        this.selectRow = []
        this.queryParams.ckRefSheet = 'none'
        this.queryParams.pageNum = 1
        this.getList()
        if (this.nested) {
          this.$nextTick(() => this.updateFilterTableHeight())
        }
      }
    },
    getList() {
      this.loading = true
      listDepPurchaseApplyForCk(this.queryParams)
        .then(response => {
          this.depApplyList = response.rows || []
          this.total = response.total != null ? Number(response.total) : 0
          this.loading = false
          if (this.nested) {
            this.$nextTick(() => this.updateFilterTableHeight())
          }
        })
        .catch(() => {
          this.loading = false
        })
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page
      if (limit != null) this.queryParams.pageSize = limit
      this.getList()
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.pageNum = 1
      this.queryParams.pageSize = 10
      this.queryParams.ckRefSheet = 'none'
      this.queryParams.warehouseId = this.warehouseValue
      this.queryParams.departmentId = this.departmentValue
      this.handleQuery()
    },
    handleSelectionChange(val) {
      this.selectRow = val || []
    },
    handleClose() {
      this.show = false
      this.$emit('closeDialog')
    },
    checkBtn() {
      if (!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: '请先选择科室申购单', type: 'warning' })
        return
      }
      if (this.selectRow.length > 1) {
        this.$message({ message: '科室申购单请单选', type: 'warning' })
        return
      }
      const row = this.selectRow[0]
      const pend = row.pendingOutboundTotal != null ? Number(row.pendingOutboundTotal) : 0
      if (pend <= 0) {
        this.$message({ message: '该申购单当前无可出库数量，无法引用生成出库', type: 'warning' })
        return
      }
      if (row.voidWholeFlag === 1) {
        this.$message({ message: '该申购单已作废，无法引用', type: 'warning' })
        return
      }
      const linkedCk = row.linkedCkTotal != null ? Number(row.linkedCkTotal) : 0
      const lineVoidLines = row.lineVoidedEntryCount != null ? Number(row.lineVoidedEntryCount) : 0
      if (linkedCk > 0 && lineVoidLines > 0) {
        this.$message({
          message: '该申购单为部分作废状态（已出库引用且存在明细作废），不允许再次引用出库',
          type: 'warning'
        })
        return
      }
      this.$emit('selectDepPurchaseApplyData', row)
      this.handleClose()
    },
    depApplyIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1
    },
    handleViewDetail(row) {
      if (!row || !row.id) return
      getPurchase(row.id).then(res => {
        const data = res.data || {}
        this.entryPreviewList = data.depPurchaseApplyEntryList || []
        this.detailTitle = '科室申购单 ' + (data.purchaseBillNo || row.purchaseBillNo || '')
        this.openDetail = true
      })
    },
    onCkRefSheetTabClick() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    voidWholeEnabled() {
      const sheet = this.queryParams.ckRefSheet
      if (sheet !== 'none' && sheet !== 'partial') {
        return false
      }
      if (!this.selectRow || this.selectRow.length !== 1) {
        return false
      }
      const row = this.selectRow[0]
      return row && row.voidWholeFlag !== 1
    },
    formatVoidStatus(row) {
      if (!row) return '--'
      if (row.voidWholeFlag === 1) {
        return '已整单作废'
      }
      const linked = row.linkedCkTotal != null ? Number(row.linkedCkTotal) : 0
      const lineVoidLines = row.lineVoidedEntryCount != null ? Number(row.lineVoidedEntryCount) : 0
      if (linked > 0 && lineVoidLines > 0) {
        return '部分作废'
      }
      if (lineVoidLines > 0) {
        return '明细作废(未出库引用)'
      }
      return '正常'
    },
    formatVoidBy(row) {
      if (!row) return '--'
      if (row.voidWholeFlag === 1 && row.voidWholeBy) {
        return row.voidWholeBy
      }
      if (row.lastLineVoidBy) {
        return row.lastLineVoidBy
      }
      return '--'
    },
    formatVoidTime(row) {
      if (!row) return '--'
      const t = row.voidWholeFlag === 1 ? row.voidWholeTime : row.lastLineVoidTime
      if (!t) return '--'
      return this.parseTime(t, '{y}-{m}-{d} {h}:{i}:{s}')
    },
    handleVoidWhole() {
      if (!this.voidWholeEnabled()) {
        return
      }
      const row = this.selectRow[0]
      this.$prompt('请输入作废原因（可留空）', '整单作废确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '原因',
        inputValue: ''
      })
        .then(({ value }) => {
          const reason = value != null ? String(value).trim() : ''
          return voidDepPurchaseApplyWhole({ id: row.id, reason })
        })
        .then(() => {
          this.$message.success('作废成功')
          this.getList()
        })
        .catch(() => {})
    },
    sortByStr(a, b, field) {
      const va = (a && a[field] != null) ? String(a[field]) : ''
      const vb = (b && b[field] != null) ? String(b[field]) : ''
      return va.localeCompare(vb, 'zh-CN')
    },
    sortByDate(a, b, field) {
      const ta = a && a[field] ? new Date(a[field]).getTime() : 0
      const tb = b && b[field] ? new Date(b[field]).getTime() : 0
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
      if (Number.isNaN(ta)) return 1
      if (Number.isNaN(tb)) return -1
      return ta - tb
    },
    onFilterWindowResize() {
      this.updateFilterTableHeight()
    },
    updateFilterTableHeight() {
      if (!this.nested || !this.show) return
      const run = () => {
        const panel = this.$refs.filterTablePanel
        const pagWrap = this.$refs.filterPaginationWrap
        if (!panel || !panel.getBoundingClientRect) return
        const panelH = panel.clientHeight || panel.getBoundingClientRect().height
        if (!panelH) return
        const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8
        const next = Math.floor(panelH - pagH)
        const height = Math.max(200, next)
        if (Math.abs(this.filterTableHeight - height) >= 2) {
          this.filterTableHeight = height
        }
        this.$nextTick(() => {
          const table = this.$refs.depTable
          if (table && table.doLayout) table.doLayout()
        })
      }
      this.$nextTick(run)
      requestAnimationFrame(run)
      ;[50, 120, 300].forEach((ms) => setTimeout(run, ms))
    }
  }
}
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.dep-purchase-select-full-modal.local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.4);
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
  min-height: 40px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.wh-apply-ck-tabs {
  flex-shrink: 0;
  padding: 0 14px;
  margin-bottom: 0;
}

::v-deep .wh-apply-ck-tabs .el-tabs__header {
  margin-bottom: 8px;
}

::v-deep .apply-modal-field--standard .el-input,
::v-deep .apply-modal-field--standard .el-select {
  width: 140px !important;
  max-width: 140px !important;
}

::v-deep .apply-modal-field--standard .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
}
</style>

<style lang="scss">
.dep-purchase-select-mask.material-filter-mask--nested {
  position: absolute;
  z-index: 3100;
}

.dep-purchase-select-mask.material-filter-mask--nested .local-modal-content.material-filter-modal--nested {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

.dep-purchase-select-mask .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.dep-purchase-select-mask.material-filter-mask--nested .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dep-purchase-select-mask .local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 6px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: 1px solid #e8ecf1;
  border-bottom: 1px solid #e8ecf1;
  box-sizing: border-box;
}

.dep-purchase-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  gap: 6px;
  margin-bottom: 4px;
}

.dep-purchase-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
}

.dep-purchase-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
  box-sizing: border-box;
}

.dep-purchase-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar .list-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.dep-purchase-select-mask .apply-modal-detail-title {
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 32px;
}

.dep-purchase-select-mask.material-filter-mask--nested .material-filter-form.modal-form-compact > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dep-purchase-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.dep-purchase-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 8px;
  box-sizing: border-box;
}

.dep-purchase-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap .pagination-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

.dep-purchase-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  overflow: auto !important;
}
</style>
