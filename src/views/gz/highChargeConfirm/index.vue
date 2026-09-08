<template>
  <div class="app-container list-page high-charge-confirm-page" ref="pageRoot">
    <div class="hc-main">
      <div class="form-fields-container list-query-panel" v-show="showSearch">
        <el-form :model="query" ref="queryForm" size="small" :inline="true" class="query-form">
          <div class="hc-query-row">
            <el-select
              v-model="query.departmentId"
              placeholder="核销科室"
              clearable
              filterable
              :filter-method="filterDeptMethod"
              class="hc-query-control"
            >
              <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
            <el-select
              v-model="query.orderingDepartmentId"
              placeholder="开单科室"
              clearable
              filterable
              :filter-method="filterOrderingDeptMethod"
              class="hc-query-control"
            >
              <el-option v-for="d in orderingDeptOptions" :key="'ord-' + d.id" :label="d.name" :value="d.id" />
            </el-select>
            <el-select
              v-model="query.execDepartmentId"
              placeholder="执行科室"
              clearable
              filterable
              :filter-method="filterExecDeptMethod"
              class="hc-query-control"
            >
              <el-option v-for="d in execDeptOptions" :key="'exec-' + d.id" :label="d.name" :value="d.id" />
            </el-select>
            <el-input
              v-model="query.patientName"
              placeholder="患者姓名"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="query.visitNo"
              placeholder="住院/门诊号"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="query.materialName"
              placeholder="产品名称"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleQuery"
            />
            <div class="hc-query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </div>
          <div class="hc-query-row hc-query-row--second">
            <el-date-picker
              v-model="query.beginConsumeAuditTime"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="核销日期起"
              clearable
              class="hc-query-control"
            />
            <el-date-picker
              v-model="query.endConsumeAuditTime"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="核销日期止"
              clearable
              class="hc-query-control"
            />
            <el-select
              v-model="query.confirmStatus"
              placeholder="确认状态"
              clearable
              class="hc-query-control"
            >
              <el-option label="未确认" value="0" />
              <el-option label="已确认" value="1" />
            </el-select>
            <el-input
              v-model="query.hisChargeId"
              placeholder="费用明细主键"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </el-form>
      </div>

      <el-row :gutter="0" class="list-toolbar hc-toolbar">
        <div class="list-toolbar-left">
          <el-button
            type="primary"
            size="small"
            class="spd-btn spd-btn--primary"
            :disabled="!canConfirm"
            v-hasPermi="['gz:highChargeConfirm:confirm']"
            @click="openConfirmDialog"
          >消耗确认</el-button>
          <el-button
            v-if="canWriteOff"
            type="danger"
            plain
            size="small"
            class="spd-btn spd-btn--danger"
            v-hasPermi="['gz:highChargeConfirm:writeOff']"
            @click="submitWriteOff"
          >冲销</el-button>
          <span v-if="selectedRows.length" class="hc-selected-tip">已选 {{ selectedRows.length }} 条</span>
        </div>
        <div class="list-toolbar-right">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="loadList" />
        </div>
      </el-row>

      <div class="apply-table-panel" ref="tablePanel">
        <el-table
          ref="table"
          v-loading="loading"
          :data="list"
          class="apply-main-table"
          border
          stripe
          row-key="linkId"
          :height="mainTableHeight"
          :row-class-name="confirmRowClassName"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" :selectable="rowSelectable" />
          <el-table-column label="确认状态" prop="confirmStatus" width="112" align="center" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']">
            <template slot-scope="scope">
              <span :class="confirmStatusClass(scope.row.confirmStatus)">{{ confirmStatusText(scope.row.confirmStatus) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="即入即出" prop="instantIoAuditStatus" width="100" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ instantIoStatusText(scope.row.instantIoAuditStatus) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="核销时间" prop="consumeAuditTime" width="165" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ formatDateTimeCell(scope.row.consumeAuditTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="核销科室" prop="departmentName" min-width="110" show-overflow-tooltip />
          <el-table-column label="开单科室" prop="orderingDeptName" min-width="110" show-overflow-tooltip />
          <el-table-column label="执行科室" prop="execDeptName" min-width="110" show-overflow-tooltip />
          <el-table-column label="患者姓名" prop="patientName" width="110" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="住院/门诊号" prop="visitNo" width="145" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="收费编码" prop="chargeItemId" width="130" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="项目名称" prop="itemName" min-width="180" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="项目规格" prop="itemSpec" width="120" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="项目型号" prop="itemModel" width="100" show-overflow-tooltip />
          <el-table-column label="产品名称" prop="materialName" min-width="160" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="规格" prop="materialSpeci" width="120" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="型号" prop="materialModel" width="100" show-overflow-tooltip />
          <el-table-column label="院内码" prop="inHospitalCode" width="145" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="数量" prop="entryQty" width="90" align="center" show-overflow-tooltip />
          <el-table-column label="单价" prop="unitPrice" width="95" align="right" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="金额" prop="amt" width="110" align="right" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="批号" prop="batchNumber" width="130" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
          <el-table-column label="生产日期" prop="productionDate" width="110" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ formatDateCell(scope.row.productionDate) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="110" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ formatDateCell(scope.row.endTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" prop="factoryName" min-width="120" show-overflow-tooltip />
          <el-table-column label="注册证号" prop="registerNo" min-width="140" show-overflow-tooltip />
          <el-table-column label="供应商" prop="supplierName" min-width="120" show-overflow-tooltip />
          <el-table-column label="消耗单号" prop="consumeBillNo" width="130" show-overflow-tooltip />
          <el-table-column label="确认批次" prop="confirmNo" width="150" show-overflow-tooltip />
          <el-table-column label="入库单号" prop="inboundBillNo" width="150" show-overflow-tooltip />
          <el-table-column label="出库单号" prop="outboundBillNo" width="150" show-overflow-tooltip />
          <el-table-column label="费用明细主键" prop="hisChargeId" width="180" show-overflow-tooltip />
        </el-table>

        <div class="apply-pagination-wrap">
          <pagination
            v-show="total > 0"
            :total="total"
            :page.sync="query.pageNum"
            :limit.sync="query.pageSize"
            @pagination="loadList"
          />
        </div>
      </div>
    </div>

    <el-dialog title="消耗确认" :visible.sync="confirmDialogVisible" width="480px" append-to-body @close="resetConfirmDialog">
      <p>已选 <strong>{{ selectedRows.length }}</strong> 条明细，合计数量 <strong>{{ selectedTotalQty }}</strong>，合计金额 <strong>{{ selectedTotalAmt }}</strong></p>
      <el-form label-width="100px" size="small">
        <el-form-item label="核销科室">
          <span class="hc-confirm-dept-text">{{ confirmDepartmentName || '--' }}</span>
        </el-form-item>
      </el-form>
      <p class="hc-confirm-tip">确认后不生成入出库单，待库房在「高值即入即出」审核建单。</p>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="confirmSubmitting" @click="submitConfirm">确认</el-button>
      </div>
    </el-dialog>

    <el-dialog title="确认结果" :visible.sync="resultDialogVisible" width="480px" append-to-body>
      <p>确认批次：<strong>{{ result.confirmNo }}</strong>，共 {{ result.lineCount }} 条明细。</p>
      <p>已确认，待库房即入即出审核。</p>
      <div slot="footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="resultDialogVisible = false">知道了</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDepartTenantOptionselect, listDepartOptionselect } from '@/api/foundation/depart'
import { listHighChargeConfirm, confirmHighChargeConsume, writeOffHighChargeConfirm } from '@/api/gz/highChargeConfirm'
import { normalizeDepartPickResponse, filterDepartPickList } from '@/utils/deptPick'

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatDate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

function defaultMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { begin: formatDate(start), end: formatDate(end) }
}

const MSG_NO_WRITE_OFF_DEPT_PERM =
  '没有核销科室权限，不允许确认。如需确认请添加核销科室权限之后再做确认操作'

export default {
  name: 'HighChargeConfirm',
  data() {
    const month = defaultMonthRange()
    return {
      loading: false,
      showSearch: true,
      mainTableHeight: 400,
      list: [],
      total: 0,
      deptOptions: [],
      allDeptOptions: [],
      permDeptOptions: [],
      orderingDeptOptions: [],
      execDeptOptions: [],
      selectedRows: [],
      rowHighlightTick: 0,
      query: {
        pageNum: 1,
        pageSize: 10,
        departmentId: undefined,
        orderingDepartmentId: undefined,
        execDepartmentId: undefined,
        confirmStatus: undefined,
        beginConsumeAuditTime: month.begin,
        endConsumeAuditTime: month.end,
        patientName: undefined,
        visitNo: undefined,
        hisChargeId: undefined,
        materialName: undefined,
        sortField: undefined,
        sortOrder: undefined
      },
      confirmDialogVisible: false,
      confirmDepartmentId: undefined,
      confirmDepartmentName: '',
      confirmSubmitting: false,
      resultDialogVisible: false,
      result: { bills: [], confirmNo: '', lineCount: 0 }
    }
  },
  computed: {
    selectedTotalQty() {
      return this.formatQty(this.selectedRows.reduce((s, r) => s + Number(r.entryQty || 0), 0))
    },
    selectedTotalAmt() {
      return this.formatAmount(this.selectedRows.reduce((s, r) => s + Number(r.amt || 0), 0))
    },
    canConfirm() {
      return this.selectedRows.length > 0 && this.selectedRows.every(r => Number(r.confirmStatus) !== 1)
    },
    canWriteOff() {
      return this.selectedRows.length > 0 && this.selectedRows.every(r => {
        const confirmed = Number(r.confirmStatus) === 1
        const io = Number(r.instantIoAuditStatus)
        return !confirmed && io !== 1 && io !== 2
      })
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight())
    }
  },
  created() {
    this.loadDeptOptions()
    this.loadList()
  },
  mounted() {
    this.$nextTick(() => {
      this.updateMainTableHeight()
      setTimeout(() => this.updateMainTableHeight(), 80)
      setTimeout(() => this.updateMainTableHeight(), 200)
    })
    window.addEventListener('resize', this.updateMainTableHeight)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateMainTableHeight)
  },
  methods: {
    /** 明细框高度：底边对齐页面内容区底部（全宽无左侧栏） */
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel
      const root = this.$refs.pageRoot || this.$el
      if (!panel || !panel.getBoundingClientRect || !root || !root.getBoundingClientRect) return
      const panelTop = panel.getBoundingClientRect().top
      const targetBottom = root.getBoundingClientRect().bottom
      const pagEl = panel.querySelector('.apply-pagination-wrap')
      let pagH = pagEl ? pagEl.getBoundingClientRect().height : 52
      if (pagH < 40) pagH = 52
      const borderY =
        (parseFloat(window.getComputedStyle(panel).borderTopWidth) || 0) +
        (parseFloat(window.getComputedStyle(panel).borderBottomWidth) || 0)
      const next = Math.max(240, Math.floor(targetBottom - panelTop - pagH - borderY))
      if (Math.abs((this.mainTableHeight || 0) - next) >= 2) {
        this.mainTableHeight = next
      }
      this.$nextTick(() => {
        if (this.$refs.table && this.$refs.table.doLayout) {
          this.$refs.table.doLayout()
        }
      })
    },
    formatQty(v) {
      const n = Number(v)
      if (isNaN(n)) return '0'
      return String(n)
    },
    formatAmount(v) {
      const n = Number(v)
      if (isNaN(n)) return '0.00'
      return n.toFixed(2)
    },
    confirmStatusText(v) {
      return v === 1 ? '已确认' : '未确认'
    },
    confirmStatusClass(v) {
      return v === 1 ? 'hc-writeoff-done' : 'hc-writeoff-pending'
    },
    instantIoStatusText(v) {
      if (v === 1) return '已审核'
      if (v === 2) return '已冲销'
      if (v === 0 || v === '0') return '待审核'
      return '--'
    },
    formatDateCell(v) {
      if (!v) return '--'
      return this.parseTime(v, '{y}-{m}-{d}')
    },
    formatDateTimeCell(v) {
      if (!v) return '--'
      return this.parseTime(v, '{y}-{m}-{d} {h}:{i}:{s}')
    },
    loadDeptOptions() {
      listDepartTenantOptionselect().then(res => {
        const list = normalizeDepartPickResponse(res)
        this.allDeptOptions = list
        this.deptOptions = list
        this.orderingDeptOptions = list
        this.execDeptOptions = list
      })
      listDepartOptionselect().then(res => {
        this.permDeptOptions = normalizeDepartPickResponse(res)
      })
    },
    resolveDeptDisplayName(deptId) {
      if (deptId == null || deptId === '') return ''
      const id = Number(deptId)
      const hit = this.allDeptOptions.find(d => d && Number(d.id) === id)
        || this.permDeptOptions.find(d => d && Number(d.id) === id)
      return hit && hit.name ? hit.name : ''
    },
    hasWriteOffDeptPermission(deptId) {
      if (deptId == null || deptId === '') return false
      const id = Number(deptId)
      if (isNaN(id)) return false
      return this.permDeptOptions.some(d => d && Number(d.id) === id)
    },
    assertWriteOffDeptPermission(deptId) {
      if (!this.hasWriteOffDeptPermission(deptId)) {
        this.$modal.msgWarning(MSG_NO_WRITE_OFF_DEPT_PERM)
        return false
      }
      return true
    },
    filterDeptList(query, targetKey) {
      this[targetKey] = filterDepartPickList(this.allDeptOptions, query)
    },
    filterDeptMethod(query) {
      this.filterDeptList(query, 'deptOptions')
    },
    filterOrderingDeptMethod(query) {
      this.filterDeptList(query, 'orderingDeptOptions')
    },
    filterExecDeptMethod(query) {
      this.filterDeptList(query, 'execDeptOptions')
    },
    toQueryDayStart(s) {
      if (!s) return undefined
      const t = String(s).trim()
      return t.length > 10 ? t : `${t} 00:00:00`
    },
    toQueryDayEnd(s) {
      if (!s) return undefined
      const t = String(s).trim()
      return t.length > 10 ? t : `${t} 23:59:59`
    },
    rowSelectable(row) {
      if (!row) return false
      if (Number(row.confirmStatus) === 1) return false
      const io = Number(row.instantIoAuditStatus)
      return io !== 1 && io !== 2
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows || []
      this.rowHighlightTick += 1
    },
    confirmRowClassName({ row }) {
      void this.rowHighlightTick
      const rid = row && row.linkId != null ? String(row.linkId) : ''
      if (rid && this.selectedRows.some(r => String(r.linkId) === rid)) {
        return 'apply-row-selected'
      }
      return ''
    },
    handleQuery() {
      this.query.pageNum = 1
      this.loadList()
    },
    handleSortChange({ prop, order }) {
      this.query.sortField = order ? prop : undefined
      this.query.sortOrder = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : undefined
      this.query.pageNum = 1
      this.loadList()
    },
    resetQuery() {
      const month = defaultMonthRange()
      this.query = {
        pageNum: 1,
        pageSize: 10,
        departmentId: undefined,
        orderingDepartmentId: undefined,
        execDepartmentId: undefined,
        confirmStatus: undefined,
        beginConsumeAuditTime: month.begin,
        endConsumeAuditTime: month.end,
        patientName: undefined,
        visitNo: undefined,
        hisChargeId: undefined,
        materialName: undefined,
        sortField: undefined,
        sortOrder: undefined
      }
      if (this.$refs.table && this.$refs.table.clearSort) {
        this.$refs.table.clearSort()
      }
      this.loadList()
    },
    loadList() {
      this.loading = true
      const q = { ...this.query }
      q.beginConsumeAuditTime = this.toQueryDayStart(q.beginConsumeAuditTime)
      q.endConsumeAuditTime = this.toQueryDayEnd(q.endConsumeAuditTime)
      listHighChargeConfirm(q).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
      }).finally(() => {
        this.loading = false
        this.$nextTick(() => this.updateMainTableHeight())
      })
    },
    openConfirmDialog() {
      if (!this.canConfirm) {
        this.$modal.msgWarning('请先选择未确认的明细（已确认请用冲销）')
        return
      }
      const deptIds = [...new Set(this.selectedRows.map(r => r.departmentId).filter(Boolean))]
      if (deptIds.length > 1) {
        this.$modal.msgWarning('请选择同一核销科室的明细进行确认')
        return
      }
      this.confirmDepartmentId = deptIds[0]
      if (!this.confirmDepartmentId) {
        this.$modal.msgWarning('所选明细缺少核销科室，无法确认')
        return
      }
      const sample = this.selectedRows.find(r => r.departmentId === this.confirmDepartmentId)
      this.confirmDepartmentName = (sample && sample.departmentName)
        || this.resolveDeptDisplayName(this.confirmDepartmentId)
        || String(this.confirmDepartmentId)
      if (!this.assertWriteOffDeptPermission(this.confirmDepartmentId)) {
        return
      }
      this.confirmDialogVisible = true
    },
    resetConfirmDialog() {
      this.confirmDepartmentId = undefined
      this.confirmDepartmentName = ''
      this.confirmSubmitting = false
    },
    submitConfirm() {
      if (!this.confirmDepartmentId) {
        this.$modal.msgWarning('所选明细缺少核销科室，无法确认')
        return
      }
      if (!this.assertWriteOffDeptPermission(this.confirmDepartmentId)) {
        return
      }
      this.confirmSubmitting = true
      confirmHighChargeConsume({
        linkIds: this.selectedRows.map(r => r.linkId),
        departmentId: this.confirmDepartmentId
      }).then(res => {
        this.result = res.data || { bills: [], confirmNo: '', lineCount: 0 }
        this.confirmDialogVisible = false
        this.resultDialogVisible = true
        this.selectedRows = []
        if (this.$refs.table) {
          this.$refs.table.clearSelection()
        }
        this.loadList()
        this.$modal.msgSuccess('已确认，待库房即入即出审核')
      }).finally(() => {
        this.confirmSubmitting = false
      })
    },
    submitWriteOff() {
      if (!this.canWriteOff) {
        this.$modal.msgWarning('仅未确认明细可在本页冲销；已确认请到「高值即入即出」由库房处理')
        return
      }
      this.$modal.confirm('冲销将回补科室库存，并使计费行恢复待核销。是否继续？').then(() => {
        this.confirmSubmitting = true
        return writeOffHighChargeConfirm({
          linkIds: this.selectedRows.map(r => r.linkId),
          remark: '高值核销确认页冲销',
          source: 'CONFIRM'
        })
      }).then(res => {
        const data = (res && res.data) || {}
        this.selectedRows = []
        if (this.$refs.table) {
          this.$refs.table.clearSelection()
        }
        this.loadList()
        this.$modal.msgSuccess(`冲销完成，回补 ${data.restoredCount || 0} 条`)
      }).catch(() => {}).finally(() => {
        this.confirmSubmitting = false
      })
    }
  }
}
</script>

<style scoped>
.hc-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
  gap: 4px;
}

.high-charge-confirm-page .hc-main > .list-query-panel,
.high-charge-confirm-page .hc-main > .hc-toolbar,
.high-charge-confirm-page .hc-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.high-charge-confirm-page .hc-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.hc-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.hc-query-row--second {
  margin-top: 8px;
}

.hc-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.hc-query-control.el-select,
.hc-query-control.el-input,
.hc-query-control.el-date-editor {
  width: 160px !important;
}

.hc-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.hc-selected-tip {
  font-size: 13px;
  color: #606266;
  line-height: 32px;
  margin-left: 4px;
}

.hc-confirm-tip {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
}

.hc-confirm-dept-text {
  line-height: 32px;
  color: #303133;
  font-weight: 500;
}

.hc-writeoff-done {
  color: #67c23a;
  font-weight: 500;
}

.hc-writeoff-pending {
  color: #f56c6c;
  font-weight: 500;
}

.apply-table-panel {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0 !important;
  background: #fff !important;
  border: 1px solid #e8ecf1 !important;
  border-radius: 10px !important;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05) !important;
  overflow: hidden;
  height: auto !important;
  width: 100%;
  box-sizing: border-box;
}

.apply-table-panel > .apply-main-table {
  flex: 0 0 auto;
  min-height: 0;
  margin-bottom: 0 !important;
  border-radius: 0;
  box-shadow: none;
}

.apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 12px 14px;
  box-sizing: border-box;
}

.apply-pagination-wrap ::v-deep .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  overflow: visible !important;
}

.apply-pagination-wrap ::v-deep .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
  margin: 0 !important;
}

.high-charge-confirm-page .apply-main-table.el-table {
  position: relative;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr > td,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.high-charge-confirm-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.high-charge-confirm-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.high-charge-confirm-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.high-charge-confirm-page .apply-main-table ::v-deep th.apply-select-col,
.high-charge-confirm-page .apply-main-table ::v-deep td.apply-select-col,
.high-charge-confirm-page .apply-main-table ::v-deep th.el-table-column--selection,
.high-charge-confirm-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.high-charge-confirm-page .apply-main-table ::v-deep td.apply-select-col,
.high-charge-confirm-page .apply-main-table ::v-deep td.el-table-column--selection {
  background-color: #fff;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.high-charge-confirm-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
}
</style>

<style>
.app-container.high-charge-confirm-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.high-charge-confirm-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.high-charge-confirm-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.high-charge-confirm-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.high-charge-confirm-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.high-charge-confirm-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.high-charge-confirm-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
