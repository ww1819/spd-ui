<template>
  <div class="app-container high-charge-confirm-page">
    <div class="hc-filter-panel">
      <el-form :model="query" inline size="small" class="hc-query-form">
        <el-form-item label="核销科室">
          <el-select
            v-model="query.departmentId"
            placeholder="名称/编码/简拼"
            clearable
            filterable
            :filter-method="filterDeptMethod"
            style="width:148px"
          >
            <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开单科室">
          <el-select
            v-model="query.orderingDepartmentId"
            placeholder="名称/编码/简拼"
            clearable
            filterable
            :filter-method="filterOrderingDeptMethod"
            style="width:148px"
          >
            <el-option v-for="d in orderingDeptOptions" :key="'ord-' + d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行科室">
          <el-select
            v-model="query.execDepartmentId"
            placeholder="名称/编码/简拼"
            clearable
            filterable
            :filter-method="filterExecDeptMethod"
            style="width:148px"
          >
            <el-option v-for="d in execDeptOptions" :key="'exec-' + d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="患者姓名">
          <el-input v-model="query.patientName" placeholder="姓名" clearable style="width:140px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="住院/门诊号">
          <el-input v-model="query.visitNo" placeholder="住院号或门诊号" clearable style="width:160px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="query.materialName" placeholder="产品名称" clearable style="width:160px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <div class="hc-query-form-second-row">
          <el-form-item label="核销日期">
            <el-date-picker v-model="query.beginConsumeAuditTime" type="date" value-format="yyyy-MM-dd" placeholder="起" style="width:140px" clearable />
            <span style="margin:0 6px">至</span>
            <el-date-picker v-model="query.endConsumeAuditTime" type="date" value-format="yyyy-MM-dd" placeholder="止" style="width:140px" clearable />
          </el-form-item>
          <el-form-item label="确认状态">
            <el-select v-model="query.confirmStatus" placeholder="全部" clearable style="width:110px">
              <el-option label="未确认" value="0" />
              <el-option label="已确认" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="费用明细主键">
            <el-input v-model="query.hisChargeId" placeholder="HIS费用明细主键模糊" clearable style="width:180px" @keyup.enter.native="handleQuery" />
          </el-form-item>
        </div>
      </el-form>
    </div>

    <div class="hc-action-bar">
      <el-button
        type="primary"
        plain
        icon="el-icon-check"
        size="small"
        :disabled="!canConfirm"
        v-hasPermi="['gz:highChargeConfirm:confirm']"
        @click="openConfirmDialog"
      >消耗确认</el-button>
      <el-button
        v-if="canWriteOff"
        type="danger"
        plain
        icon="el-icon-refresh-left"
        size="small"
        v-hasPermi="['gz:highChargeConfirm:writeOff']"
        @click="submitWriteOff"
      >冲销</el-button>
      <span v-if="selectedRows.length" class="hc-selected-tip">已选 {{ selectedRows.length }} 条</span>
      <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">查询</el-button>
      <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
    </div>

    <div class="hc-detail-box">
      <el-table
        ref="table"
        v-loading="loading"
        :data="list"
        height="60vh"
        border
        stripe
        class="hc-detail-table"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="48" align="center" :selectable="rowSelectable" fixed="left" />
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
        <el-table-column label="患者姓名" prop="patientName" width="110" min-width="100" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="住院/门诊号" prop="visitNo" width="145" min-width="130" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="收费编码" prop="chargeItemId" width="130" min-width="120" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="项目名称" prop="itemName" min-width="180" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="项目规格" prop="itemSpec" width="120" min-width="110" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="项目型号" prop="itemModel" width="100" show-overflow-tooltip />
        <el-table-column label="产品名称" prop="materialName" min-width="160" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="规格" prop="materialSpeci" width="120" min-width="110" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="型号" prop="materialModel" width="100" show-overflow-tooltip />
        <el-table-column label="院内码" prop="inHospitalCode" width="145" min-width="130" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="数量" prop="entryQty" width="90" align="center" />
        <el-table-column label="单价" prop="unitPrice" width="95" min-width="88" align="right" sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="金额" prop="amt" width="110" min-width="100" align="right" sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="批号" prop="batchNumber" width="130" min-width="120" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
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
    </div>

    <div class="hc-pagination-wrap">
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="query.pageNum"
        :limit.sync="query.pageSize"
        @pagination="loadList"
      />
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
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="confirmSubmitting" @click="submitConfirm">确认</el-button>
      </div>
    </el-dialog>

    <el-dialog title="确认结果" :visible.sync="resultDialogVisible" width="480px" append-to-body>
      <p>确认批次：<strong>{{ result.confirmNo }}</strong>，共 {{ result.lineCount }} 条明细。</p>
      <p>已确认，待库房即入即出审核。</p>
      <div slot="footer">
        <el-button type="primary" @click="resultDialogVisible = false">知道了</el-button>
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
      list: [],
      total: 0,
      deptOptions: [],
      allDeptOptions: [],
      permDeptOptions: [],
      orderingDeptOptions: [],
      execDeptOptions: [],
      selectedRows: [],
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
      return this.selectedRows.reduce((s, r) => s + Number(r.entryQty || 0), 0).toFixed(2)
    },
    selectedTotalAmt() {
      return this.selectedRows.reduce((s, r) => s + Number(r.amt || 0), 0).toFixed(2)
    },
    canConfirm() {
      return this.selectedRows.length > 0 && this.selectedRows.every(r => Number(r.confirmStatus) !== 1)
    },
    canWriteOff() {
      // 临床段档 A/B：未即入即出审核即可冲销；库房已审不显示
      return this.selectedRows.length > 0 && this.selectedRows.every(r => {
        const io = Number(r.instantIoAuditStatus)
        return io !== 1 && io !== 2
      })
    }
  },
  created() {
    this.loadDeptOptions()
    this.loadList()
  },
  mounted() {
    this.$nextTick(() => this.layoutTable())
  },
  methods: {
    layoutTable() {
      const table = this.$refs.table
      if (table && table.doLayout) {
        table.doLayout()
      }
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
      // 可选：未确认(A)、已确认待库房审(B)；库房已审/已冲销不可选
      if (!row) return false
      const io = Number(row.instantIoAuditStatus)
      return io !== 1 && io !== 2
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows || []
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
        this.$nextTick(() => this.layoutTable())
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
        this.$modal.msgWarning('请选择临床段明细冲销（未做即入即出审核）；库房已审请到「高值即入即出」处理')
        return
      }
      this.$modal.confirm('冲销将回补科室库存，并撤销临床确认（若已确认），计费行恢复待核销。是否继续？').then(() => {
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

<style>
.high-charge-confirm-page {
  padding: 1vh 0.8vw 1.5vh !important;
  box-sizing: border-box;
}

.high-charge-confirm-page .hc-filter-panel,
.high-charge-confirm-page .hc-detail-box {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-sizing: border-box;
}

.high-charge-confirm-page .hc-filter-panel {
  padding: 10px 12px 4px;
  margin-bottom: 0;
}

.high-charge-confirm-page .hc-action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 4px 12px;
  margin-bottom: 10px;
}

.high-charge-confirm-page .hc-filter-panel .hc-query-form .el-form-item {
  margin-bottom: 8px;
}

.high-charge-confirm-page .hc-query-form-second-row {
  display: block;
  width: 100%;
  clear: both;
}

.high-charge-confirm-page .hc-confirm-tip {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
}

.high-charge-confirm-page .hc-query-form-second-row .el-form-item {
  margin-bottom: 0;
}

.high-charge-confirm-page .hc-detail-box {
  padding: 0;
  overflow: hidden;
}

.high-charge-confirm-page .hc-detail-table {
  width: 100%;
}

.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 8px !important;
  transition: height 0.2s ease;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper:hover::-webkit-scrollbar:horizontal {
  height: 16px !important;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper:hover::-webkit-scrollbar:vertical {
  width: 12px !important;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #eef0f3 !important;
  border-radius: 6px !important;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 6px !important;
  border: 2px solid #eef0f3 !important;
  background-clip: padding-box !important;
  min-width: 40px !important;
  min-height: 8px !important;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper:hover::-webkit-scrollbar-thumb {
  background: #606266 !important;
  border-color: #e4e7ed !important;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #303133 !important;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #909399 #eef0f3;
}
.high-charge-confirm-page .hc-detail-table.el-table .el-table__body-wrapper:hover {
  scrollbar-width: auto;
  scrollbar-color: #606266 #e4e7ed;
}

.high-charge-confirm-page .hc-pagination-wrap {
  margin-top: 12px;
  padding: 0 4px 8px;
}
.high-charge-confirm-page .hc-pagination-wrap .pagination-container {
  position: relative !important;
  margin: 0 !important;
  padding: 10px 16px !important;
}

.high-charge-confirm-page .hc-writeoff-done {
  color: #67c23a;
  font-weight: 500;
}
.high-charge-confirm-page .hc-writeoff-pending {
  color: #f56c6c;
  font-weight: 500;
}

.high-charge-confirm-page .hc-selected-tip {
  font-size: 13px;
  color: #606266;
  line-height: 32px;
}
.high-charge-confirm-page .hc-confirm-dept-text {
  line-height: 32px;
  color: #303133;
  font-weight: 500;
}
</style>
