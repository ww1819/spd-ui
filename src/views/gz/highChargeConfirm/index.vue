<template>
  <div class="app-container high-charge-confirm-page">
    <div class="hc-query-wrap">
      <el-form :model="query" inline size="small" class="hc-query-form">
        <el-form-item label="科室">
          <el-select v-model="query.departmentId" placeholder="按权限科室" clearable filterable style="width:200px">
            <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="确认状态">
          <el-select v-model="query.confirmStatus" placeholder="全部" clearable style="width:120px">
            <el-option label="未确认" value="0" />
            <el-option label="已确认" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="核销日期">
          <el-date-picker v-model="query.beginConsumeAuditTime" type="date" value-format="yyyy-MM-dd" placeholder="起" style="width:140px" clearable />
          <span style="margin:0 6px">至</span>
          <el-date-picker v-model="query.endConsumeAuditTime" type="date" value-format="yyyy-MM-dd" placeholder="止" style="width:140px" clearable />
        </el-form-item>
        <el-form-item label="患者姓名">
          <el-input v-model="query.patientName" placeholder="姓名" clearable style="width:120px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="号">
          <el-input v-model="query.visitNo" placeholder="住院/门诊号" clearable style="width:140px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="耗材">
          <el-input v-model="query.materialName" placeholder="耗材名称" clearable style="width:140px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-check"
          size="mini"
          :disabled="selectedRows.length === 0"
          v-hasPermi="['gz:highChargeConfirm:confirm']"
          @click="openConfirmDialog"
        >消耗确认</el-button>
      </el-col>
      <el-col :span="1.5">
        <span v-if="selectedRows.length" class="selected-tip">已选 {{ selectedRows.length }} 条</span>
      </el-col>
    </el-row>

    <el-table
      ref="table"
      v-loading="loading"
      :data="list"
      height="58vh"
      border
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" :selectable="rowSelectable" />
      <el-table-column label="确认状态" width="90">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.confirmStatus === 1" type="success" size="mini">已确认</el-tag>
          <el-tag v-else type="info" size="mini">未确认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="核销时间" prop="consumeAuditTime" width="160" show-overflow-tooltip />
      <el-table-column label="科室" prop="departmentName" min-width="100" show-overflow-tooltip />
      <el-table-column label="患者" prop="patientName" width="90" show-overflow-tooltip />
      <el-table-column label="号" prop="visitNo" width="110" show-overflow-tooltip />
      <el-table-column label="收费项" prop="chargeItemId" width="100" show-overflow-tooltip />
      <el-table-column label="项目名称" prop="itemName" min-width="120" show-overflow-tooltip />
      <el-table-column label="耗材" prop="materialName" min-width="140" show-overflow-tooltip />
      <el-table-column label="院内码" prop="inHospitalCode" width="120" show-overflow-tooltip />
      <el-table-column label="数量" prop="entryQty" width="70" align="right" />
      <el-table-column label="单价" prop="unitPrice" width="80" align="right" />
      <el-table-column label="金额" prop="amt" width="90" align="right" />
      <el-table-column label="供应商" prop="supplierName" min-width="120" show-overflow-tooltip />
      <el-table-column label="计费单号" prop="consumeBillNo" width="130" show-overflow-tooltip />
      <el-table-column label="确认批次" prop="confirmNo" width="150" show-overflow-tooltip />
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="query.pageNum"
      :limit.sync="query.pageSize"
      @pagination="loadList"
    />

    <el-dialog title="消耗确认" :visible.sync="confirmDialogVisible" width="520px" append-to-body @close="resetConfirmDialog">
      <p>已选 <strong>{{ selectedRows.length }}</strong> 条明细，合计数量 <strong>{{ selectedTotalQty }}</strong>，合计金额 <strong>{{ selectedTotalAmt }}</strong></p>
      <el-form label-width="100px" size="small">
        <el-form-item label="高值仓库" required>
          <el-select v-model="confirmWarehouseId" placeholder="请选择高值仓库" filterable style="width:100%">
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
import { listdepartAll } from '@/api/foundation/depart'
import { listWarehouse } from '@/api/foundation/warehouse'
import { listHighChargeConfirm, confirmHighChargeConsume } from '@/api/gz/highChargeConfirm'

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
  name: 'HighChargeConfirm',
  data() {
    const month = defaultMonthRange()
    return {
      loading: false,
      list: [],
      total: 0,
      deptOptions: [],
      warehouseOptions: [],
      selectedRows: [],
      query: {
        pageNum: 1,
        pageSize: 10,
        departmentId: undefined,
        confirmStatus: undefined,
        beginConsumeAuditTime: month.begin,
        endConsumeAuditTime: month.end,
        patientName: undefined,
        visitNo: undefined,
        materialName: undefined
      },
      confirmDialogVisible: false,
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
  methods: {
    loadDeptOptions() {
      const uid = this.$store.getters.userId
      if (!uid) return
      listdepartAll(uid).then(res => {
        const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : [])
        this.deptOptions = list.filter(d => d && d.id != null)
      })
    },
    loadWarehouseOptions() {
      listWarehouse({ pageNum: 1, pageSize: 500, warehouseType: '高值' }).then(res => {
        this.warehouseOptions = (res.rows || []).filter(w => w && w.id != null && w.warehouseType === '高值')
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
        confirmStatus: undefined,
        beginConsumeAuditTime: month.begin,
        endConsumeAuditTime: month.end,
        patientName: undefined,
        visitNo: undefined,
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
        this.$nextTick(() => {
          if (this.$refs.table && this.$refs.table.doLayout) {
            this.$refs.table.doLayout()
          }
        })
      })
    },
    openConfirmDialog() {
      if (!this.selectedRows.length) {
        this.$modal.msgWarning('请先选择未确认的明细')
        return
      }
      const deptIds = [...new Set(this.selectedRows.map(r => r.departmentId).filter(Boolean))]
      if (deptIds.length > 1) {
        this.$modal.msgWarning('请选择同一科室的明细进行确认')
        return
      }
      this.confirmWarehouseId = undefined
      this.loadWarehouseOptions()
      this.confirmDialogVisible = true
    },
    resetConfirmDialog() {
      this.confirmWarehouseId = undefined
      this.confirmSubmitting = false
    },
    submitConfirm() {
      if (!this.confirmWarehouseId) {
        this.$modal.msgWarning('请选择高值仓库')
        return
      }
      this.confirmSubmitting = true
      confirmHighChargeConsume({
        linkIds: this.selectedRows.map(r => r.linkId),
        warehouseId: this.confirmWarehouseId
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

<style scoped>
.selected-tip {
  line-height: 28px;
  color: #606266;
  font-size: 13px;
}
</style>

<style>
.high-charge-confirm-page .hc-query-wrap {
  margin-bottom: 12px;
}
</style>
