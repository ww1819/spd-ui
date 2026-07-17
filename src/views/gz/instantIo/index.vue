<template>
  <div class="app-container gz-instant-io-page">
    <div class="io-filter-panel">
      <el-tabs v-model="activeQueue" type="card">
        <el-tab-pane label="待审核" name="pending" />
        <el-tab-pane label="已审核" name="audited" />
        <el-tab-pane label="全部" name="all" />
      </el-tabs>
      <el-form :model="query" inline size="small">
        <el-form-item label="核销科室">
          <el-select v-model="query.departmentId" placeholder="名称/编码/简拼" clearable filterable :filter-method="filterDeptMethod" style="width:148px">
            <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="患者姓名">
          <el-input v-model="query.patientName" clearable style="width:140px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="住院/门诊号">
          <el-input v-model="query.visitNo" clearable style="width:160px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="query.materialName" clearable style="width:160px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="核销日期">
          <el-date-picker v-model="query.beginConsumeAuditTime" type="date" value-format="yyyy-MM-dd" placeholder="起" style="width:140px" clearable />
          <span style="margin:0 6px">至</span>
          <el-date-picker v-model="query.endConsumeAuditTime" type="date" value-format="yyyy-MM-dd" placeholder="止" style="width:140px" clearable />
        </el-form-item>
      </el-form>
    </div>

    <div class="io-action-bar">
      <el-button
        v-if="showAuditBtn"
        type="primary"
        plain
        icon="el-icon-check"
        size="small"
        :disabled="!canAudit"
        v-hasPermi="['gz:instantIo:audit']"
        @click="openAuditDialog"
      >审核建单</el-button>
      <el-button
        v-if="showWriteOffBtn"
        type="danger"
        plain
        icon="el-icon-refresh-left"
        size="small"
        :disabled="!canWriteOff"
        v-hasPermi="['gz:instantIo:writeOff']"
        @click="submitWriteOff"
      >{{ writeOffBtnLabel }}</el-button>
      <el-button size="small" plain icon="el-icon-check" @click="selectAllCurrentPage">全选</el-button>
      <el-button size="small" plain icon="el-icon-close" @click="clearSelectionCache">取消全选</el-button>
      <el-button size="small" plain type="warning" icon="el-icon-download" v-hasPermi="['gz:instantIo:list']" @click="handleExport">导出</el-button>
      <span v-if="selectedCount" class="io-selected-tip">已选 {{ selectedCount }} 条</span>
      <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">查询</el-button>
      <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
    </div>

    <el-table
      ref="table"
      v-loading="loading"
      :data="list"
      height="60vh"
      border
      stripe
      row-key="linkId"
      :reserve-selection="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" align="center" :selectable="rowSelectable" fixed="left" />
      <el-table-column label="即入即出" width="100" align="center">
        <template slot-scope="scope">{{ instantIoStatusText(scope.row.instantIoAuditStatus) }}</template>
      </el-table-column>
      <el-table-column label="核销时间" prop="consumeAuditTime" width="165">
        <template slot-scope="scope">{{ formatDateTimeCell(scope.row.consumeAuditTime) }}</template>
      </el-table-column>
      <el-table-column label="核销科室" prop="departmentName" min-width="110" show-overflow-tooltip />
      <el-table-column label="患者姓名" prop="patientName" width="110" show-overflow-tooltip />
      <el-table-column label="住院/门诊号" prop="visitNo" width="140" show-overflow-tooltip />
      <el-table-column label="产品名称" prop="materialName" min-width="160" show-overflow-tooltip />
      <el-table-column label="院内码" prop="inHospitalCode" width="140" show-overflow-tooltip />
      <el-table-column label="数量" prop="entryQty" width="80" align="center" />
      <el-table-column label="已退费量" prop="returnedQty" width="90" align="center" />
      <el-table-column label="单价" prop="unitPrice" width="90" align="right" />
      <el-table-column label="金额" prop="amt" width="100" align="right" />
      <el-table-column label="供应商" prop="supplierName" min-width="120" show-overflow-tooltip />
      <el-table-column label="确认批次" prop="confirmNo" width="150" show-overflow-tooltip />
      <el-table-column label="临床确认人" prop="confirmBy" width="100" show-overflow-tooltip />
      <el-table-column label="临床确认时间" prop="confirmTime" width="165">
        <template slot-scope="scope">{{ formatDateTimeCell(scope.row.confirmTime) }}</template>
      </el-table-column>
      <el-table-column label="审核人" prop="instantIoAuditBy" width="100" show-overflow-tooltip />
      <el-table-column label="审核时间" prop="instantIoAuditTime" width="165">
        <template slot-scope="scope">{{ formatDateTimeCell(scope.row.instantIoAuditTime) }}</template>
      </el-table-column>
      <el-table-column label="入库单" prop="inboundBillNo" width="150" show-overflow-tooltip />
      <el-table-column label="出库单" prop="outboundBillNo" width="150" show-overflow-tooltip />
      <el-table-column label="退货单" prop="returnGoodsBillNo" width="150" show-overflow-tooltip />
      <el-table-column label="退库单" prop="returnDepotBillNo" width="150" show-overflow-tooltip />
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="loadList" />

    <el-dialog title="即入即出审核" :visible.sync="auditDialogVisible" width="520px" append-to-body @close="resetAuditDialog">
      <p>已选 <strong>{{ selectedCount }}</strong> 条，将按供应商生成入库单(G-RK)与出库单(G-CK)。</p>
      <el-form label-width="100px" size="small">
        <el-form-item label="结算仓库" required>
          <el-select v-model="auditWarehouseId" placeholder="请选择结算仓库" filterable style="width:100%">
            <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAudit">审核</el-button>
      </div>
    </el-dialog>

    <el-dialog title="单据结果" :visible.sync="resultDialogVisible" width="720px" append-to-body>
      <p>共处理 {{ result.lineCount }} 条明细</p>
      <el-table :data="result.bills || []" border size="small">
        <el-table-column label="供应商" prop="supplierName" min-width="120" />
        <el-table-column label="入库 G-RK" prop="inboundBillNo" min-width="140" />
        <el-table-column label="出库 G-CK" prop="outboundBillNo" min-width="140" />
        <el-table-column label="退货 G-TH" prop="returnGoodsBillNo" min-width="140" />
        <el-table-column label="退库 G-TK" prop="returnDepotBillNo" min-width="140" />
      </el-table>
      <div slot="footer">
        <el-button type="primary" @click="resultDialogVisible = false">知道了</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDepartTenantOptionselect } from '@/api/foundation/depart'
import { listSettlementWarehousePick } from '@/api/foundation/warehouse'
import { listGzInstantIo, auditGzInstantIo, writeOffGzInstantIo } from '@/api/gz/instantIo'
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

export default {
  name: 'GzInstantIo',
  data() {
    const month = defaultMonthRange()
    return {
      loading: false,
      list: [],
      total: 0,
      deptOptions: [],
      allDeptOptions: [],
      warehouseOptions: [],
      selectionCache: Object.create(null),
      selectionSyncing: false,
      activeQueue: 'pending',
      query: {
        pageNum: 1,
        pageSize: 10,
        departmentId: undefined,
        instantIoAuditStatus: '0',
        beginConsumeAuditTime: month.begin,
        endConsumeAuditTime: month.end,
        patientName: undefined,
        visitNo: undefined,
        materialName: undefined
      },
      auditDialogVisible: false,
      auditWarehouseId: undefined,
      submitting: false,
      resultDialogVisible: false,
      result: { bills: [], lineCount: 0 }
    }
  },
  computed: {
    showAuditBtn() {
      return this.activeQueue === 'pending'
    },
    showWriteOffBtn() {
      // HV-Q-006：待审核=核销冲销(档B)；已审核=即入即出冲销(档C)；全部不显示
      return this.activeQueue === 'pending' || this.activeQueue === 'audited'
    },
    writeOffBtnLabel() {
      return this.activeQueue === 'audited' ? '即入即出冲销' : '核销冲销'
    },
    selectedRows() {
      return Object.keys(this.selectionCache).map(k => this.selectionCache[k]).filter(Boolean)
    },
    selectedCount() {
      return this.selectedRows.length
    },
    canAudit() {
      return this.showAuditBtn
        && this.selectedCount > 0
        && this.selectedRows.every(r => Number(r.instantIoAuditStatus) === 0)
    },
    canWriteOff() {
      if (!this.showWriteOffBtn || this.selectedCount === 0) return false
      if (this.activeQueue === 'pending') {
        return this.selectedRows.every(r => Number(r.instantIoAuditStatus) === 0)
      }
      if (this.activeQueue === 'audited') {
        return this.selectedRows.every(r => Number(r.instantIoAuditStatus) === 1)
      }
      return false
    }
  },
  watch: {
    activeQueue() {
      this.clearSelectionCache()
      this.query.pageNum = 1
      this.applyQueueToQuery()
      this.loadList()
    }
  },
  created() {
    this.loadDeptOptions()
    this.applyQueueToQuery()
    this.loadList()
  },
  methods: {
    rowKey(row) {
      return row && row.linkId != null ? String(row.linkId) : ''
    },
    instantIoStatusText(v) {
      if (Number(v) === 1) return '已审核'
      if (Number(v) === 2) return '已冲销'
      return '待审核'
    },
    formatDateTimeCell(v) {
      if (!v) return '--'
      return this.parseTime(v, '{y}-{m}-{d} {h}:{i}:{s}')
    },
    applyQueueToQuery() {
      this.query.instantIoAuditStatus = undefined
      if (this.activeQueue === 'pending') {
        this.query.instantIoAuditStatus = '0'
      } else if (this.activeQueue === 'audited') {
        this.query.instantIoAuditStatus = '1'
      }
    },
    loadDeptOptions() {
      listDepartTenantOptionselect().then(res => {
        const list = normalizeDepartPickResponse(res)
        this.allDeptOptions = list
        this.deptOptions = list
      })
    },
    filterDeptMethod(query) {
      this.deptOptions = filterDepartPickList(this.allDeptOptions, query)
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
      const st = Number(row && row.instantIoAuditStatus)
      if (this.activeQueue === 'pending') return st === 0
      if (this.activeQueue === 'audited') return st === 1
      return st === 0 || st === 1
    },
    handleSelectionChange(rows) {
      if (this.selectionSyncing || this.loading) {
        return
      }
      const list = rows || []
      if (list.length === 0) {
        ;(this.list || []).forEach(r => {
          const k = this.rowKey(r)
          if (k && this.selectionCache[k]) this.$delete(this.selectionCache, k)
        })
        return
      }
      const next = Object.create(null)
      Object.keys(this.selectionCache).forEach(k => {
        const onPage = (this.list || []).some(r => this.rowKey(r) === k)
        if (!onPage) next[k] = this.selectionCache[k]
      })
      list.forEach(r => {
        const k = this.rowKey(r)
        if (!k || !this.rowSelectable(r)) return
        next[k] = r
      })
      this.selectionCache = next
    },
    restoreSelection() {
      const table = this.$refs.table
      if (!table || typeof table.toggleRowSelection !== 'function') {
        this.selectionSyncing = false
        return
      }
      this.selectionSyncing = true
      try {
        ;(this.list || []).forEach(row => {
          const k = this.rowKey(row)
          if (k && this.selectionCache[k] && this.rowSelectable(row)) {
            table.toggleRowSelection(row, true)
          }
        })
      } finally {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.selectionSyncing = false
          })
        })
      }
    },
    selectAllCurrentPage() {
      const table = this.$refs.table
      if (!table) return
      this.selectionSyncing = true
      ;(this.list || []).forEach(row => {
        if (!this.rowSelectable(row)) return
        const k = this.rowKey(row)
        if (!k) return
        this.$set(this.selectionCache, k, row)
        table.toggleRowSelection(row, true)
      })
      this.$nextTick(() => {
        this.selectionSyncing = false
      })
    },
    clearSelectionCache() {
      this.selectionCache = Object.create(null)
      const table = this.$refs.table
      if (table && typeof table.clearSelection === 'function') {
        this.selectionSyncing = true
        table.clearSelection()
        this.$nextTick(() => {
          this.selectionSyncing = false
        })
      }
    },
    handleQuery() {
      this.clearSelectionCache()
      this.query.pageNum = 1
      this.applyQueueToQuery()
      this.loadList()
    },
    resetQuery() {
      const month = defaultMonthRange()
      this.query = {
        pageNum: 1,
        pageSize: 10,
        departmentId: undefined,
        instantIoAuditStatus: '0',
        beginConsumeAuditTime: month.begin,
        endConsumeAuditTime: month.end,
        patientName: undefined,
        visitNo: undefined,
        materialName: undefined
      }
      if (this.activeQueue !== 'pending') {
        this.activeQueue = 'pending'
        return
      }
      this.clearSelectionCache()
      this.applyQueueToQuery()
      this.loadList()
    },
    buildListQuery() {
      const q = { ...this.query }
      q.beginConsumeAuditTime = this.toQueryDayStart(q.beginConsumeAuditTime)
      q.endConsumeAuditTime = this.toQueryDayEnd(q.endConsumeAuditTime)
      return q
    },
    loadList() {
      this.loading = true
      this.selectionSyncing = true
      listGzInstantIo(this.buildListQuery()).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
        this.$nextTick(() => this.restoreSelection())
      }).finally(() => {
        this.loading = false
      })
    },
    openAuditDialog() {
      if (!this.canAudit) {
        this.$modal.msgWarning('请选择待审核明细')
        return
      }
      const deptIds = [...new Set(this.selectedRows.map(r => r.departmentId).filter(Boolean))]
      if (deptIds.length > 1) {
        this.$modal.msgWarning('请选择同一核销科室的明细进行审核')
        return
      }
      this.auditWarehouseId = undefined
      this.loadWarehouseOptions()
      this.auditDialogVisible = true
    },
    resetAuditDialog() {
      this.auditWarehouseId = undefined
      this.submitting = false
    },
    submitAudit() {
      if (!this.auditWarehouseId) {
        this.$modal.msgWarning('请选择结算仓库')
        return
      }
      this.submitting = true
      auditGzInstantIo({
        linkIds: this.selectedRows.map(r => r.linkId),
        warehouseId: this.auditWarehouseId
      }).then(res => {
        this.result = res.data || { bills: [], lineCount: 0 }
        this.auditDialogVisible = false
        this.resultDialogVisible = true
        this.clearSelectionCache()
        this.loadList()
        this.$modal.msgSuccess('审核建单成功')
      }).finally(() => {
        this.submitting = false
      })
    },
    submitWriteOff() {
      if (!this.canWriteOff) {
        this.$modal.msgWarning(this.activeQueue === 'audited'
          ? '请选择已审核明细进行即入即出冲销'
          : '请选择待审核明细进行核销冲销')
        return
      }
      const tip = this.activeQueue === 'audited'
        ? '即入即出冲销将先生成退货/退库单（若尚未生成），再回补科室库存并使计费行恢复待核销。是否继续？'
        : '核销冲销将撤销临床确认、回补科室库存，并使计费行恢复待核销（临床向库房申请后由仓库操作）。是否继续？'
      const remark = this.activeQueue === 'audited' ? '高值即入即出冲销' : '高值核销冲销（即入即出待审核）'
      this.$modal.confirm(tip).then(() => {
        this.submitting = true
        return writeOffGzInstantIo({
          linkIds: this.selectedRows.map(r => r.linkId),
          remark
        })
      }).then(res => {
        const data = (res && res.data) || {}
        this.clearSelectionCache()
        this.loadList()
        this.$modal.msgSuccess(`冲销完成，回补 ${data.restoredCount || 0} 条`)
      }).catch(() => {}).finally(() => {
        this.submitting = false
      })
    },
    handleExport() {
      this.$confirm('请选择导出范围', '导出', {
        distinguishCancelAndClose: true,
        confirmButtonText: '全部查询结果',
        cancelButtonText: '仅选中结果',
        type: 'info'
      }).then(() => {
        this.doExport('all')
      }).catch(action => {
        if (action === 'cancel') {
          this.doExport('selected')
        }
      })
    },
    doExport(mode) {
      const q = this.buildListQuery()
      delete q.pageNum
      delete q.pageSize
      if (mode === 'selected') {
        if (!this.selectedCount) {
          this.$modal.msgWarning('请先勾选要导出的明细')
          return
        }
        q.linkIds = this.selectedRows.map(r => r.linkId).join(',')
      }
      this.download('gz/instantIo/export', q, `高值即入即出_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>

<style scoped>
.gz-instant-io-page .io-filter-panel {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px 12px 4px;
  margin-bottom: 8px;
}
.gz-instant-io-page .io-filter-panel .el-tabs {
  margin-bottom: 8px;
}
.gz-instant-io-page .io-action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 4px 12px;
}
.gz-instant-io-page .io-selected-tip {
  color: #606266;
  font-size: 13px;
}
</style>
