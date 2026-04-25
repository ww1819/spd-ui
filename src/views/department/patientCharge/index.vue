<template>
  <div class="app-container">
    <el-tabs v-model="activeMainTab" @tab-click="onMainTabClick">
      <el-tab-pane label="患者费用明细" name="detail">
        <el-form :model="detailQuery" inline size="small" class="mb8">
          <el-form-item label="类型">
            <el-radio-group v-model="detailVisitType" @change="handleDetailQuery">
              <el-radio-button label="ALL">全部</el-radio-button>
              <el-radio-button label="IN">住院</el-radio-button>
              <el-radio-button label="OUT">门诊</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="患者姓名">
            <el-input v-model="detailQuery.patientName" placeholder="姓名" clearable style="width:140px" @keyup.enter.native="handleDetailQuery" />
          </el-form-item>
          <el-form-item :label="detailVisitType === 'IN' ? '住院号' : '门诊号'">
            <el-input
              v-model="detailQuery.visitNo"
              :placeholder="detailVisitType === 'IN' ? '住院号' : '门诊号'"
              clearable
              style="width:160px"
              @keyup.enter.native="handleDetailQuery"
            />
          </el-form-item>
          <el-form-item label="收费项ID">
            <el-input
              v-model="detailQuery.chargeItemId"
              placeholder="收费项目编码"
              clearable
              style="width:160px"
              @keyup.enter.native="handleDetailQuery"
            />
          </el-form-item>
          <el-form-item label="科室">
            <el-select
              v-model="detailQuery.departmentId"
              placeholder="按权限科室"
              clearable
              filterable
              style="width:200px"
            >
              <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否处理">
            <el-select v-model="detailQuery.processed" placeholder="全部" clearable style="width:110px">
              <el-option label="已处理" value="Y" />
              <el-option label="未处理" value="N" />
            </el-select>
          </el-form-item>
          <el-form-item label="计费日期">
            <el-date-picker v-model="detailQuery.beginChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="起" style="width:140px" clearable />
            <span style="margin:0 6px">至</span>
            <el-date-picker v-model="detailQuery.endChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="止" style="width:140px" clearable />
          </el-form-item>
          <el-form-item label="处理时间">
            <el-date-picker v-model="detailQuery.beginProcessTime" type="date" value-format="yyyy-MM-dd" placeholder="起" style="width:140px" clearable />
            <span style="margin:0 6px">至</span>
            <el-date-picker v-model="detailQuery.endProcessTime" type="date" value-format="yyyy-MM-dd" placeholder="止" style="width:140px" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleDetailQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetDetailQuery">重置</el-button>
          </el-form-item>
          <el-form-item>
            <el-button
              type="warning"
              plain
              :disabled="detailSelection.length === 0"
              v-hasPermi="['department:patientCharge:generateConsume','department:patientCharge:processMirrorLow']"
              @click="batchProcessLowValue"
            >批量低值核销</el-button>
          </el-form-item>
          <el-form-item>
            <el-button
              type="success"
              plain
              @click="openFetchDialog('IN')"
              v-hasPermi="['department:patientCharge:fetchInpatient']"
            >住院收费抓取</el-button>
            <el-button
              type="success"
              plain
              @click="openFetchDialog('OUT')"
              v-hasPermi="['department:patientCharge:fetchOutpatient']"
            >门诊收费抓取</el-button>
          </el-form-item>
        </el-form>

        <el-table
          ref="detailTable"
          v-loading="detailLoading"
          :data="detailList"
          border
          stripe
          @sort-change="handleDetailSort"
          @selection-change="rows => (detailSelection = rows)"
        >
          <el-table-column type="selection" width="48" align="center" :selectable="row => row.processStatus === 'PENDING_CONSUME'" />
          <el-table-column label="类型" prop="visitType" width="80">
            <template slot-scope="scope">
              <span>{{ scope.row.visitType === 'INPATIENT' ? '住院' : '门诊' }}</span>
            </template>
          </el-table-column>
          <template v-if="detailVisitType === 'IN'">
            <el-table-column label="住院号" prop="inpatientNo" width="120" show-overflow-tooltip />
            <el-table-column label="科室" prop="deptName" min-width="120" show-overflow-tooltip />
          </template>
          <template v-else-if="detailVisitType === 'OUT'">
            <el-table-column label="门诊号" prop="outpatientNo" width="120" show-overflow-tooltip />
            <el-table-column label="就诊" prop="clinicName" min-width="120" show-overflow-tooltip />
          </template>
          <template v-else>
            <el-table-column label="号" prop="visitNo" width="120" show-overflow-tooltip />
            <el-table-column label="科室/就诊" prop="deptDisplayName" min-width="120" show-overflow-tooltip />
          </template>
          <el-table-column label="患者" prop="patientName" width="100" show-overflow-tooltip />
          <el-table-column label="收费项ID" prop="chargeItemId" width="120" show-overflow-tooltip />
          <el-table-column label="项目名称" prop="itemName" min-width="160" show-overflow-tooltip />
          <el-table-column label="规格" prop="specModel" width="100" show-overflow-tooltip />
          <el-table-column label="计费时间" prop="chargeDate" width="160" show-overflow-tooltip />
          <el-table-column label="数量" prop="quantity" width="90" align="right" />
          <el-table-column label="金额" prop="totalAmount" width="100" align="right" />
          <el-table-column label="高值耗材库存数量" prop="highValueStockQty" width="150" align="right" sortable="custom" />
          <el-table-column label="低值耗材库存数量" prop="lowValueStockQty" width="150" align="right" sortable="custom" />
          <el-table-column label="处理状态" prop="processStatus" width="120" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ processStatusText(scope.row.processStatus) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理类型" prop="processType" width="120" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ processTypeText(scope.row.processType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理时间" prop="processTime" width="160" show-overflow-tooltip />
          <el-table-column label="处理人" prop="processBy" width="100" show-overflow-tooltip />
          <el-table-column label="本地入库" prop="createTime" width="160" />
          <el-table-column label="操作" align="center" width="160" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="mini"
                v-hasPermi="['department:patientCharge:generateConsume','department:patientCharge:processMirrorLow']"
                :disabled="scope.row.processStatus !== 'PENDING_CONSUME'"
                @click="processLowValue(scope.row)"
              >低值</el-button>
              <el-button
                type="text"
                size="mini"
                v-hasPermi="['department:patientCharge:generateConsume','department:patientCharge:processMirrorHigh']"
                :disabled="scope.row.processStatus === 'CONSUMED'"
                @click="openHighDialog(scope.row)"
              >高值</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="detailTotal > 0"
          :total="detailTotal"
          :page.sync="detailQuery.pageNum"
          :limit.sync="detailQuery.pageSize"
          @pagination="loadDetailList"
        />
      </el-tab-pane>

      <el-tab-pane label="患者费用汇总" name="summary">
        <el-form :model="summaryQuery" inline size="small" class="mb8">
          <el-form-item label="计费日期">
            <el-date-picker v-model="summaryQuery.beginChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="起" style="width:140px" clearable />
            <span style="margin:0 6px">至</span>
            <el-date-picker v-model="summaryQuery.endChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="止" style="width:140px" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleSummaryQuery">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="summaryLoading" :data="summaryList" border stripe>
          <el-table-column label="类型" prop="visitType" width="100">
            <template slot-scope="scope">
              <span>{{ scope.row.visitType === 'INPATIENT' ? '住院' : '门诊' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="患者" prop="patientName" width="120" show-overflow-tooltip />
          <el-table-column label="号" prop="visitNo" width="130" show-overflow-tooltip />
          <el-table-column label="科室/就诊" prop="deptName" min-width="140" show-overflow-tooltip />
          <el-table-column label="明细条数" prop="lineCount" width="100" align="right" />
          <el-table-column label="金额合计" prop="sumAmount" width="120" align="right" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog title="高值计费扫码消耗" :visible.sync="highDialogVisible" width="760px" append-to-body @closed="resetHighDialog">
      <div v-if="highMirrorRow" class="mb8">
        <span>患者 {{ highMirrorRow.patientName }} · 计费数量 {{ highMirrorRow.quantity }} · </span>
        <span v-if="highBillRemaining != null">当前剩余计费数量 {{ highBillRemaining }}</span>
      </div>
      <el-alert type="warning" :closable="false" show-icon class="mb8" title="请扫描本科室高值院内码；虚拟库存满足才可带出；可多次扫码、修改本次消耗数量后一次保存并审核；审核时再次校验库存。" />
      <el-input
        ref="highScanInput"
        v-model="highScanCode"
        placeholder="扫描或输入院内码后回车"
        clearable
        @keyup.enter.native="doHighScan"
      />
      <el-table :data="highLines" border size="small" class="mt8" empty-text="请先扫码添加行">
        <el-table-column label="院内码" prop="inHospitalCode" min-width="120" show-overflow-tooltip />
        <el-table-column label="耗材" prop="materialName" min-width="140" show-overflow-tooltip />
        <el-table-column label="批次号" prop="batchNo" width="120" show-overflow-tooltip />
        <el-table-column label="虚拟库存" prop="gzAvailableQty" width="90" align="right" />
        <el-table-column label="本次消耗" width="130" align="center">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.applyQty"
              :min="0.000001"
              :max="Number(scope.row.maxApplyQty)"
              :precision="6"
              :step="1"
              size="mini"
              controls-position="right"
              style="width:120px"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="removeHighLine(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="highDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="highSubmitting" :disabled="highLines.length === 0" @click="submitHighConsume">保存并审核</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="fetchDialogTitle" :visible.sync="fetchDialogVisible" width="480px" append-to-body @close="resetFetchForm">
      <el-form :model="fetchForm" label-width="100px" size="small">
        <el-form-item label="开始日期" required>
          <el-date-picker v-model="fetchForm.beginDate" type="date" value-format="yyyy-MM-dd" placeholder="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束日期" required>
          <el-date-picker v-model="fetchForm.endDate" type="date" value-format="yyyy-MM-dd" placeholder="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon title="按计费时间从 HIS 视图增量拉取；已存在且内容一致则跳过；跨度受服务端 max-range-days 限制。" />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="fetchDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="fetchSubmitting" @click="submitFetch">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listdepartAll } from '@/api/foundation/depart'
import {
  listInpatientMirror,
  listOutpatientMirror,
  listAllMirror,
  listChargeSummary,
  fetchInpatientMirror,
  fetchOutpatientMirror,
  processMirrorLowValue,
  processMirrorLowValueBatch,
  scanMirrorHighBarcode,
  applyMirrorHighConsume
} from '@/api/department/patientCharge'

export default {
  name: 'PatientChargeHis',
  data() {
    return {
      activeMainTab: 'detail',
      detailVisitType: 'IN',
      detailLoading: false,
      detailList: [],
      detailTotal: 0,
      detailSelection: [],
      deptOptions: [],
      detailQuery: {
        pageNum: 1,
        pageSize: 10,
        patientName: undefined,
        visitNo: undefined,
        chargeItemId: undefined,
        departmentId: undefined,
        processed: undefined,
        beginChargeDate: undefined,
        endChargeDate: undefined,
        beginProcessTime: undefined,
        endProcessTime: undefined,
        orderByColumn: undefined,
        isAsc: undefined
      },
      summaryLoading: false,
      summaryList: [],
      summaryQuery: {
        beginChargeDate: undefined,
        endChargeDate: undefined
      },
      fetchDialogVisible: false,
      fetchSubmitting: false,
      fetchKind: 'IN',
      fetchForm: {
        beginDate: undefined,
        endDate: undefined
      },
      highDialogVisible: false,
      highSubmitting: false,
      highMirrorRow: null,
      highScanCode: '',
      highLines: [],
      highBillRemaining: null
    }
  },
  computed: {
    fetchDialogTitle() {
      return this.fetchKind === 'IN' ? '住院收费数据抓取' : '门诊收费数据抓取'
    },
    currentVisitKind() {
      if (this.detailVisitType === 'IN') return 'INPATIENT'
      if (this.detailVisitType === 'OUT') return 'OUTPATIENT'
      return ''
    }
  },
  created() {
    this.loadDeptOptions()
    this.loadDetailList()
  },
  methods: {
    loadDeptOptions() {
      const uid = this.$store.getters.userId
      if (!uid) {
        return
      }
      listdepartAll(uid).then(res => {
        // /foundation/depart/listAll 返回的是数组本体，这里兼容数组与 {data: []} 两种返回结构
        const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : [])
        // 仅保留可用于 HIS 科室映射的科室：his_inpatient_charge_mirror.dept_code = fd_department.his_id
        this.deptOptions = list.filter(d => d && d.id != null && d.hisId != null && String(d.hisId).trim() !== '')
      })
    },
    toQueryDayStart(s) {
      if (!s) return undefined
      const t = String(s).trim()
      if (t.length > 10) return t
      return `${t} 00:00:00`
    },
    toQueryDayEnd(s) {
      if (!s) return undefined
      const t = String(s).trim()
      if (t.length > 10) return t
      return `${t} 23:59:59`
    },
    processStatusText(v) {
      const m = {
        PENDING_CONSUME: '待处理',
        PARTIALLY_CONSUMED: '部分消耗',
        CONSUMED: '已处理'
      }
      return m[v] || v || ''
    },
    processTypeText(v) {
      const m = { LOW_VALUE: '低值耗材', HIGH_VALUE: '高值耗材' }
      return m[v] || v || ''
    },
    onMainTabClick(tab) {
      if (tab.name === 'summary' && this.summaryList.length === 0 && this.summaryQuery.beginChargeDate) {
        this.loadSummary()
      }
    },
    handleDetailQuery() {
      this.detailQuery.pageNum = 1
      this.loadDetailList()
    },
    resetDetailQuery() {
      this.detailQuery = {
        pageNum: 1,
        pageSize: 10,
        patientName: undefined,
        visitNo: undefined,
        chargeItemId: undefined,
        departmentId: undefined,
        processed: undefined,
        beginChargeDate: undefined,
        endChargeDate: undefined,
        beginProcessTime: undefined,
        endProcessTime: undefined,
        orderByColumn: undefined,
        isAsc: undefined
      }
      this.detailSelection = []
      if (this.$refs.detailTable && this.$refs.detailTable.clearSort) {
        this.$refs.detailTable.clearSort()
      }
      this.loadDetailList()
    },
    handleDetailSort({ prop, order }) {
      if (prop !== 'highValueStockQty' && prop !== 'lowValueStockQty') {
        this.detailQuery.orderByColumn = undefined
        this.detailQuery.isAsc = undefined
      } else {
        this.detailQuery.orderByColumn = prop
        if (order === 'ascending') {
          this.detailQuery.isAsc = 'asc'
        } else if (order === 'descending') {
          this.detailQuery.isAsc = 'desc'
        } else {
          this.detailQuery.isAsc = undefined
          this.detailQuery.orderByColumn = undefined
        }
      }
      this.detailQuery.pageNum = 1
      this.loadDetailList()
    },
    loadDetailList() {
      this.detailLoading = true
      const q = { ...this.detailQuery }
      q.beginChargeDate = this.toQueryDayStart(q.beginChargeDate)
      q.endChargeDate = this.toQueryDayEnd(q.endChargeDate)
      q.beginProcessTime = this.toQueryDayStart(q.beginProcessTime)
      q.endProcessTime = this.toQueryDayEnd(q.endProcessTime)
      if (this.detailVisitType === 'IN') {
        q.inpatientNo = q.visitNo
        delete q.visitNo
        listInpatientMirror(q).then(res => {
          this.detailList = (res.rows || []).map(r => ({ ...r, visitType: 'INPATIENT' }))
          this.detailTotal = res.total || 0
        }).finally(() => { this.detailLoading = false })
      } else if (this.detailVisitType === 'OUT') {
        q.outpatientNo = q.visitNo
        delete q.visitNo
        listOutpatientMirror(q).then(res => {
          this.detailList = (res.rows || []).map(r => ({ ...r, visitType: 'OUTPATIENT' }))
          this.detailTotal = res.total || 0
        }).finally(() => { this.detailLoading = false })
      } else {
        listAllMirror(q).then(res => {
          this.detailList = res.rows || []
          this.detailTotal = res.total || 0
        }).finally(() => { this.detailLoading = false })
      }
    },
    handleSummaryQuery() {
      if (!this.summaryQuery.beginChargeDate || !this.summaryQuery.endChargeDate) {
        this.$modal.msgWarning('请选择计费起止日期')
        return
      }
      this.loadSummary()
    },
    loadSummary() {
      this.summaryLoading = true
      listChargeSummary({
        beginChargeDate: this.summaryQuery.beginChargeDate,
        endChargeDate: this.summaryQuery.endChargeDate
      }).then(res => {
        this.summaryList = res.rows || []
      }).finally(() => { this.summaryLoading = false })
    },
    openFetchDialog(kind) {
      this.fetchKind = kind
      this.fetchDialogVisible = true
    },
    resetFetchForm() {
      this.fetchForm = { beginDate: undefined, endDate: undefined }
    },
    processLowValue(row) {
      const visitKind = row && row.visitType ? row.visitType : this.currentVisitKind
      this.$modal.confirm('按低值一次性扣减：须一次满足整行计费数量的科室二级库库存；不足则不会生成消耗，本行仍为「待处理」。是否继续？').then(() => {
        return processMirrorLowValue({ visitKind, mirrorRowId: row.id })
      }).then(res => {
        const d = res.data || {}
        this.$modal.msgSuccess(
          `已生成 ${d.consumeBillCount || 0} 张消耗单，明细 ${d.consumeEntryCount || 0} 条，追溯 ${d.linkRowCount || 0} 条`
        )
        this.handleDetailQuery()
      }).catch(() => {})
    },
    batchProcessLowValue() {
      if (!this.detailSelection.length) {
        this.$modal.msgWarning('请先勾选待处理的计费明细')
        return
      }
      if (this.detailVisitType === 'ALL') {
        this.$modal.msgWarning('“全部”模式下批量低值核销请先切换到住院或门诊后分别执行')
        return
      }
      const ids = this.detailSelection.map(r => r.id)
      this.$modal
        .confirm(`将对勾选的 ${ids.length} 条明细逐条执行低值核销；单条失败不影响其它条（失败原因将汇总提示）。是否继续？`)
        .then(() => {
          return processMirrorLowValueBatch({ visitKind: this.currentVisitKind, mirrorRowIds: ids })
        })
        .then(res => {
          const d = res.data || {}
          const ok = d.successCount != null ? d.successCount : 0
          const fail = d.failCount != null ? d.failCount : 0
          const lines = (d.failMessages || []).slice(0, 8)
          let extra = lines.length ? `；失败示例：${lines.join('；')}` : ''
          if ((d.failMessages || []).length > lines.length) {
            extra += '…'
          }
          this.$modal.msgSuccess(`完成：成功 ${ok} 条，失败 ${fail} 条${extra}`)
          this.detailSelection = []
          this.handleDetailQuery()
        })
        .catch(() => {})
    },
    openHighDialog(row) {
      this.highMirrorRow = row
      this.highLines = []
      this.highScanCode = ''
      this.highBillRemaining = null
      this.highDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.highScanInput && this.$refs.highScanInput.focus) {
          this.$refs.highScanInput.focus()
        }
      })
    },
    resetHighDialog() {
      this.highMirrorRow = null
      this.highLines = []
      this.highScanCode = ''
      this.highBillRemaining = null
    },
    doHighScan() {
      const code = (this.highScanCode || '').trim()
      if (!code || !this.highMirrorRow) {
        return
      }
      scanMirrorHighBarcode({
        visitKind: this.highMirrorRow && this.highMirrorRow.visitType ? this.highMirrorRow.visitType : this.currentVisitKind,
        mirrorRowId: this.highMirrorRow.id,
        inHospitalCode: code
      }).then(res => {
        const d = res.data || {}
        if (d.billRemainingQty != null) {
          this.highBillRemaining = d.billRemainingQty
        }
        const maxQ = Number(d.maxApplyQty)
        const line = {
          gzDepInventoryId: d.gzDepInventoryId,
          inHospitalCode: d.inHospitalCode,
          materialName: d.materialName,
          batchNo: d.batchNo,
          gzAvailableQty: d.gzAvailableQty,
          maxApplyQty: d.maxApplyQty,
          applyQty: maxQ > 0 ? maxQ : undefined
        }
        this.highLines.push(line)
        this.highScanCode = ''
      })
    },
    removeHighLine(index) {
      this.highLines.splice(index, 1)
    },
    submitHighConsume() {
      if (!this.highMirrorRow || this.highLines.length === 0) {
        return
      }
      for (const ln of this.highLines) {
        if (ln.applyQty == null || Number(ln.applyQty) <= 0) {
          this.$modal.msgWarning('请填写每行本次消耗数量')
          return
        }
        if (Number(ln.applyQty) > Number(ln.maxApplyQty)) {
          this.$modal.msgWarning('本次消耗不能超过「最大可消耗」')
          return
        }
      }
      this.highSubmitting = true
      applyMirrorHighConsume({
        visitKind: this.highMirrorRow && this.highMirrorRow.visitType ? this.highMirrorRow.visitType : this.currentVisitKind,
        mirrorRowId: this.highMirrorRow.id,
        lines: this.highLines.map(l => ({ gzDepInventoryId: l.gzDepInventoryId, qty: l.applyQty }))
      }).then(res => {
        const d = res.data || {}
        this.$modal.msgSuccess(`消耗单 ${d.consumeBillId || ''} 已审核；镜像状态 ${d.mirrorProcessStatus || ''}；剩余计费数量 ${d.remainingBillQty != null ? d.remainingBillQty : ''}`)
        this.highDialogVisible = false
        this.handleDetailQuery()
      }).finally(() => { this.highSubmitting = false })
    },
    submitFetch() {
      if (!this.fetchForm.beginDate || !this.fetchForm.endDate) {
        this.$modal.msgWarning('请选择起止日期')
        return
      }
      this.fetchSubmitting = true
      const body = { beginDate: this.fetchForm.beginDate, endDate: this.fetchForm.endDate }
      const req = this.fetchKind === 'IN' ? fetchInpatientMirror(body) : fetchOutpatientMirror(body)
      req.then(res => {
        const d = res.data || {}
        this.$modal.msgSuccess(
          `批次 ${d.fetchBatchId || ''}：新增 ${d.insertedCount || 0}，跳过 ${d.skippedCount || 0}，指纹不一致 ${d.driftCount || 0}`
        )
        this.fetchDialogVisible = false
        this.handleDetailQuery()
      }).finally(() => { this.fetchSubmitting = false })
    }
  }
}
</script>
