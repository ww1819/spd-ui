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
            style="width:200px"
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
            style="width:200px"
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
            style="width:200px"
          >
            <el-option v-for="d in execDeptOptions" :key="'exec-' + d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="确认状态">
          <el-select v-model="query.confirmStatus" placeholder="全部" clearable style="width:110px">
            <el-option label="未确认" value="0" />
            <el-option label="已确认" value="1" />
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
        :disabled="selectedRows.length === 0"
        v-hasPermi="['gz:highChargeConfirm:confirm']"
        @click="openConfirmDialog"
      >消耗确认</el-button>
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
      >
        <el-table-column type="selection" width="48" align="center" :selectable="rowSelectable" fixed="left" />
        <el-table-column label="确认状态" width="100" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span :class="confirmStatusClass(scope.row.confirmStatus)">{{ confirmStatusText(scope.row.confirmStatus) }}</span>
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
        <el-table-column label="费用明细主键" prop="hisChargeId" width="180" show-overflow-tooltip />
        <el-table-column label="患者姓名" prop="patientName" width="100" show-overflow-tooltip />
        <el-table-column label="住院/门诊号" prop="visitNo" width="130" show-overflow-tooltip />
        <el-table-column label="收费编码" prop="chargeItemId" width="120" show-overflow-tooltip />
        <el-table-column label="项目名称" prop="itemName" min-width="160" show-overflow-tooltip />
        <el-table-column label="项目规格" prop="itemSpec" width="100" show-overflow-tooltip />
        <el-table-column label="项目型号" prop="itemModel" width="100" show-overflow-tooltip />
        <el-table-column label="产品名称" prop="materialName" min-width="140" show-overflow-tooltip />
        <el-table-column label="规格" prop="materialSpeci" width="100" show-overflow-tooltip />
        <el-table-column label="型号" prop="materialModel" width="100" show-overflow-tooltip />
        <el-table-column label="院内码" prop="inHospitalCode" width="120" show-overflow-tooltip />
        <el-table-column label="数量" prop="entryQty" width="90" align="center" />
        <el-table-column label="单价" prop="unitPrice" width="80" align="right" />
        <el-table-column label="金额" prop="amt" width="100" align="right" />
        <el-table-column label="批号" prop="batchNumber" width="110" show-overflow-tooltip />
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

    <el-dialog title="消耗确认" :visible.sync="confirmDialogVisible" width="520px" append-to-body @close="resetConfirmDialog">
      <p>已选 <strong>{{ selectedRows.length }}</strong> 条明细，合计数量 <strong>{{ selectedTotalQty }}</strong>，合计金额 <strong>{{ selectedTotalAmt }}</strong></p>
      <el-form label-width="100px" size="small">
        <el-form-item label="核销科室" required>
          <el-select
            v-model="confirmDepartmentId"
            placeholder="名称/编码/简拼"
            filterable
            :filter-method="filterConfirmDeptMethod"
            style="width:100%"
          >
            <el-option v-for="d in confirmDeptOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库" required>
          <el-select v-model="confirmWarehouseId" placeholder="请选择结算仓库" filterable style="width:100%">
            <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="confirmSubmitting" @click="submitConfirm">确认</el-button>
      </div>
    </el-dialog>

    <el-dialog title="确认结果" :visible.sync="resultDialogVisible" width="640px" append-to-body>
      <p>确认批次：<strong>{{ result.confirmNo }}</strong>，共 {{ result.lineCount }} 条明细</p>
      <el-table :data="result.bills || []" border size="small">
        <el-table-column label="供应商" prop="supplierName" min-width="140" />
        <el-table-column label="入库单 G-RK" prop="inboundBillNo" min-width="160" />
        <el-table-column label="出库单 G-CK" prop="outboundBillNo" min-width="160" />
      </el-table>
      <div slot="footer">
        <el-button type="primary" @click="resultDialogVisible = false">知道了</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDepartTenantOptionselect, listDepartOptionselect } from '@/api/foundation/depart'
import { listSettlementWarehousePick } from '@/api/foundation/warehouse'
import { listHighChargeConfirm, confirmHighChargeConsume } from '@/api/gz/highChargeConfirm'
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
      confirmDeptOptions: [],
      orderingDeptOptions: [],
      execDeptOptions: [],
      warehouseOptions: [],
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
        materialName: undefined
      },
      confirmDialogVisible: false,
      confirmDepartmentId: undefined,
      confirmWarehouseId: undefined,
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
        const list = normalizeDepartPickResponse(res)
        this.permDeptOptions = list
        this.confirmDeptOptions = list
      })
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
    filterConfirmDeptMethod(query) {
      this.confirmDeptOptions = filterDepartPickList(this.permDeptOptions, query)
    },
    loadWarehouseOptions() {
      listSettlementWarehousePick().then(res => {
        const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : [])
        this.warehouseOptions = list.filter(w => w && w.id != null)
      })
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
      return row && row.confirmStatus !== 1
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows || []
    },
    handleQuery() {
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
        materialName: undefined
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
      if (!this.selectedRows.length) {
        this.$modal.msgWarning('请先选择未确认的明细')
        return
      }
      const deptIds = [...new Set(this.selectedRows.map(r => r.departmentId).filter(Boolean))]
      if (deptIds.length > 1) {
        this.$modal.msgWarning('请选择同一核销科室的明细进行确认')
        return
      }
      this.confirmDepartmentId = deptIds[0] || this.query.departmentId || undefined
      if (!this.assertWriteOffDeptPermission(this.confirmDepartmentId)) {
        return
      }
      this.confirmWarehouseId = undefined
      this.loadWarehouseOptions()
      this.confirmDialogVisible = true
    },
    resetConfirmDialog() {
      this.confirmDepartmentId = undefined
      this.confirmWarehouseId = undefined
      this.confirmSubmitting = false
    },
    submitConfirm() {
      if (!this.confirmDepartmentId) {
        this.$modal.msgWarning('请选择核销科室')
        return
      }
      if (!this.confirmWarehouseId) {
        this.$modal.msgWarning('请选择仓库')
        return
      }
      if (!this.assertWriteOffDeptPermission(this.confirmDepartmentId)) {
        return
      }
      this.confirmSubmitting = true
      confirmHighChargeConsume({
        linkIds: this.selectedRows.map(r => r.linkId),
        warehouseId: this.confirmWarehouseId,
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
        this.$modal.msgSuccess('消耗确认成功')
      }).finally(() => {
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
</style>
