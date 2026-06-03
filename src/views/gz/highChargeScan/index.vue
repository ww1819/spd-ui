<template>
  <div class="app-container high-charge-scan-page">
    <div class="hc-query-wrap">
      <el-form :model="detailQuery" inline size="small" class="hc-query-form">
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
        <el-form-item :label="detailVisitType === 'IN' ? '住院号' : (detailVisitType === 'OUT' ? '门诊号' : '住院/门诊号')">
          <el-input
            v-model="detailQuery.visitNo"
            :placeholder="detailVisitType === 'IN' ? '住院号' : (detailVisitType === 'OUT' ? '门诊号' : '住院号或门诊号')"
            clearable
            style="width:160px"
            @keyup.enter.native="handleDetailQuery"
          />
        </el-form-item>
        <el-form-item label="收费项ID">
          <el-input v-model="detailQuery.chargeItemId" placeholder="收费项目编码" clearable style="width:160px" @keyup.enter.native="handleDetailQuery" />
        </el-form-item>
        <el-form-item label="科室">
          <el-select v-model="detailQuery.departmentId" placeholder="按权限科室" clearable filterable style="width:200px">
            <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否处理">
          <el-select v-model="detailQuery.processed" placeholder="全部" clearable style="width:110px">
            <el-option label="已处理" value="Y" />
            <el-option label="未处理" value="N" />
          </el-select>
        </el-form-item>
        <el-form-item label="高低值类型">
          <el-select v-model="detailQuery.valueLevel" placeholder="默认仅高值" clearable style="width:130px">
            <el-option label="高值收费项" value="1" />
            <el-option label="低值收费项" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费日期">
          <el-date-picker v-model="detailQuery.beginChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="起" style="width:140px" clearable />
          <span style="margin:0 6px">至</span>
          <el-date-picker v-model="detailQuery.endChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="止" style="width:140px" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleDetailQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetDetailQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      ref="detailTable"
      v-loading="detailLoading"
      :data="detailList"
      height="60vh"
      border
      stripe
      class="hc-detail-table"
    >
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
      <el-table-column label="高低值类型" prop="valueLevel" width="110" align="center">
        <template slot-scope="scope">
          <span>{{ valueLevelText(scope.row.valueLevel) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="计费时间" prop="chargeDate" width="160" show-overflow-tooltip />
      <el-table-column label="数量" prop="quantity" width="90" align="right" />
      <el-table-column label="金额" prop="totalAmount" width="100" align="right" />
      <el-table-column label="处理状态" prop="processStatus" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ processStatusText(scope.row.processStatus) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="处理情况" prop="processSituation" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="text"
            size="mini"
            v-hasPermi="highScanPermi"
            @click="openHighDialog(scope.row)"
          >高值</el-button>
          <el-button
            type="text"
            size="mini"
            v-hasPermi="['gz:highChargeScan:list','department:patientCharge:list']"
            @click="openConsumeRecordDialog(scope.row)"
          >消耗记录</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="hc-pagination-wrap">
      <pagination
        v-show="detailTotal > 0"
        :total="detailTotal"
        :page.sync="detailQuery.pageNum"
        :limit.sync="detailQuery.pageSize"
        @pagination="loadDetailList"
      />
    </div>

    <el-dialog :title="consumeRecordDialog.title" :visible.sync="consumeRecordDialog.visible" width="92%" append-to-body>
      <el-table v-loading="consumeRecordDialog.loading" :data="consumeRecordDialog.rows" border size="small" max-height="420" empty-text="暂无消耗记录">
        <el-table-column label="消耗单号" prop="consumeBillNo" min-width="178" show-overflow-tooltip />
        <el-table-column label="耗材" prop="materialName" min-width="110" show-overflow-tooltip />
        <el-table-column label="数量" prop="entryQty" width="80" align="right" />
        <el-table-column label="院内码/条码" prop="inHospitalCode" min-width="120" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="consumeRecordDialog.visible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <el-dialog title="高值计费扫码消耗" :visible.sync="highDialogVisible" width="960px" append-to-body @closed="resetHighDialog">
      <div v-if="highMirrorRow" class="mb8">
        <span>患者 {{ highMirrorRow.patientName }} · 计费数量 {{ highMirrorRow.quantity }} · </span>
        <span v-if="highBillRemaining != null">当前剩余计费数量 {{ highBillRemaining }}</span>
      </div>
      <el-alert type="warning" :closable="false" show-icon class="mb8" title="请扫描本科室高值院内码；虚拟库存满足才可带出；可多次扫码、修改本次消耗数量后一次保存并审核。" />
      <el-input
        ref="highScanInput"
        v-model="highScanCode"
        placeholder="扫描或输入院内码后回车"
        clearable
        @keyup.enter.native="doHighScan"
      />
      <el-table :data="highLines" border size="small" class="mt8 high-consume-dialog-table" empty-text="请先扫码添加行">
        <el-table-column label="院内码" prop="inHospitalCode" min-width="220" align="left" class-name="high-col-code-wrap" />
        <el-table-column label="耗材" prop="materialName" min-width="120" show-overflow-tooltip />
        <el-table-column label="批次号" prop="batchNo" min-width="200" align="left" class-name="high-col-code-wrap" />
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
  </div>
</template>

<script>
import { parseTime } from '@/utils/ruoyi'
import { listdepartAll } from '@/api/foundation/depart'
import {
  listHighChargeInpatientMirror,
  listHighChargeOutpatientMirror,
  listHighChargeAllMirror,
  listHighChargeConsumeRecords,
  scanHighChargeBarcode,
  applyHighChargeConsume
} from '@/api/gz/highChargeScan'

export default {
  name: 'GzHighChargeScan',
  data() {
    return {
      detailVisitType: 'ALL',
      detailLoading: false,
      detailList: [],
      detailTotal: 0,
      deptOptions: [],
      detailQuery: {
        pageNum: 1,
        pageSize: 10,
        patientName: undefined,
        visitNo: undefined,
        chargeItemId: undefined,
        departmentId: undefined,
        processed: undefined,
        valueLevel: '1',
        beginChargeDate: undefined,
        endChargeDate: undefined
      },
      highDialogVisible: false,
      highSubmitting: false,
      highMirrorRow: null,
      highScanCode: '',
      highLines: [],
      highBillRemaining: null,
      consumeRecordDialog: {
        visible: false,
        loading: false,
        title: '消耗记录',
        rows: []
      }
    }
  },
  computed: {
    currentVisitKind() {
      if (this.detailVisitType === 'IN') return 'INPATIENT'
      if (this.detailVisitType === 'OUT') return 'OUTPATIENT'
      return ''
    },
    /** 与患者收费查询原「高值」按钮权限兼容 */
    highScanPermi() {
      return [
        'gz:highChargeScan:list',
        'gz:highChargeScan:scan',
        'gz:highChargeScan:apply',
        'department:patientCharge:processMirrorHigh',
        'department:patientCharge:generateConsume'
      ]
    }
  },
  created() {
    this.loadDeptOptions()
    this.loadDetailList()
  },
  mounted() {
    this.$nextTick(() => this.layoutDetailTable())
  },
  methods: {
    layoutDetailTable() {
      const table = this.$refs.detailTable
      if (table && table.doLayout) {
        table.doLayout()
      }
    },
    loadDeptOptions() {
      const uid = this.$store.getters.userId
      if (!uid) return
      listdepartAll(uid).then(res => {
        const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : [])
        this.deptOptions = list.filter(d => d && d.id != null && d.hisId != null && String(d.hisId).trim() !== '')
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
    processStatusText(v) {
      const m = {
        PENDING_CONSUME: '待处理',
        PARTIALLY_CONSUMED: '部分消耗',
        CONSUMED: '已处理',
        REFUNDED: '已退费返还'
      }
      return m[v] || v || ''
    },
    valueLevelText(v) {
      if (v === '1' || v === 1) return '高值'
      if (v === '2' || v === 2 || v === '0' || v === 0) return '低值'
      return v ? String(v) : '低值'
    },
    isLowValueLevel(row) {
      const v = row && row.valueLevel
      return v !== '1' && v !== 1
    },
    canScanHigh(row) {
      if (!row || row.valueLevel !== '1' && row.valueLevel !== 1) {
        return false
      }
      return row.processStatus !== 'CONSUMED'
    },
    openHighDialog(row) {
      if (this.isLowValueLevel(row)) {
        this.$modal.msgWarning('该行为低值收费项（未维护高低值视同低值），请至患者收费查询进行低值核销')
        return
      }
      if (row.processStatus === 'CONSUMED') {
        this.$modal.msgWarning('该行已处理完成')
        return
      }
      if (row.valueLevel !== '1' && row.valueLevel !== 1) {
        return
      }
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
      if (!code || !this.highMirrorRow) return
      scanHighChargeBarcode({
        visitKind: this.highMirrorRow.visitType || this.currentVisitKind,
        mirrorRowId: this.highMirrorRow.id,
        inHospitalCode: code
      }).then(res => {
        const d = res.data || {}
        if (d.billRemainingQty != null) {
          this.highBillRemaining = d.billRemainingQty
        }
        const maxQ = Number(d.maxApplyQty)
        this.highLines.push({
          gzDepInventoryId: d.gzDepInventoryId,
          inHospitalCode: d.inHospitalCode,
          materialName: d.materialName,
          batchNo: d.batchNo,
          gzAvailableQty: d.gzAvailableQty,
          maxApplyQty: d.maxApplyQty,
          applyQty: maxQ > 0 ? maxQ : undefined
        })
        this.highScanCode = ''
      })
    },
    removeHighLine(index) {
      this.highLines.splice(index, 1)
    },
    submitHighConsume() {
      if (!this.highMirrorRow || this.highLines.length === 0) return
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
      applyHighChargeConsume({
        visitKind: this.highMirrorRow.visitType || this.currentVisitKind,
        mirrorRowId: this.highMirrorRow.id,
        lines: this.highLines.map(l => ({ gzDepInventoryId: l.gzDepInventoryId, qty: l.applyQty }))
      }).then(res => {
        const d = res.data || {}
        this.$modal.msgSuccess(`消耗单 ${d.consumeBillId || ''} 已审核；镜像状态 ${d.mirrorProcessStatus || ''}`)
        this.highDialogVisible = false
        this.handleDetailQuery()
      }).finally(() => { this.highSubmitting = false })
    },
    openConsumeRecordDialog(row) {
      if (!row || !row.id) return
      const vk = row.visitType === 'OUTPATIENT' ? 'OUTPATIENT' : 'INPATIENT'
      this.consumeRecordDialog.title = `消耗记录 · ${row.patientName || ''} · 收费项 ${row.chargeItemId || ''}`
      this.consumeRecordDialog.visible = true
      this.consumeRecordDialog.loading = true
      this.consumeRecordDialog.rows = []
      listHighChargeConsumeRecords(vk, row.id).then(res => {
        this.consumeRecordDialog.rows = res.data || []
      }).finally(() => {
        this.consumeRecordDialog.loading = false
      })
    },
    handleDetailQuery() {
      this.detailQuery.pageNum = 1
      this.loadDetailList()
    },
    resetDetailQuery() {
      this.detailVisitType = 'ALL'
      this.detailQuery = {
        pageNum: 1,
        pageSize: 10,
        patientName: undefined,
        visitNo: undefined,
        chargeItemId: undefined,
        departmentId: undefined,
        processed: undefined,
        valueLevel: '1',
        beginChargeDate: undefined,
        endChargeDate: undefined
      }
      this.loadDetailList()
    },
    loadDetailList() {
      this.detailLoading = true
      const q = { ...this.detailQuery }
      q.beginChargeDate = this.toQueryDayStart(q.beginChargeDate)
      q.endChargeDate = this.toQueryDayEnd(q.endChargeDate)
      const done = () => {
        this.detailLoading = false
        this.$nextTick(() => this.layoutDetailTable())
      }
      if (this.detailVisitType === 'IN') {
        q.inpatientNo = q.visitNo
        delete q.visitNo
        listHighChargeInpatientMirror(q).then(res => {
          this.detailList = (res.rows || []).map(r => ({ ...r, visitType: 'INPATIENT' }))
          this.detailTotal = res.total || 0
        }).finally(done)
      } else if (this.detailVisitType === 'OUT') {
        q.outpatientNo = q.visitNo
        delete q.visitNo
        listHighChargeOutpatientMirror(q).then(res => {
          this.detailList = (res.rows || []).map(r => ({ ...r, visitType: 'OUTPATIENT' }))
          this.detailTotal = res.total || 0
        }).finally(done)
      } else {
        delete q.visitNo
        listHighChargeAllMirror(q).then(res => {
          this.detailList = res.rows || []
          this.detailTotal = res.total || 0
        }).finally(done)
      }
    }
  }
}
</script>

<style scoped>
.high-consume-dialog-table >>> td.high-col-code-wrap .cell {
  white-space: normal;
  word-break: break-all;
  vertical-align: top;
  line-height: 1.45;
  text-align: left;
}
</style>

<style>
.high-charge-scan-page {
  padding: 1vh 0.8vw 1.5vh !important;
  box-sizing: border-box;
}
.high-charge-scan-page .hc-query-wrap {
  max-height: 14vh;
  overflow-y: auto;
  margin-bottom: 0.8vh;
}
.high-charge-scan-page .hc-pagination-wrap {
  margin-top: 0.5vh;
  min-height: 8vh;
}
.high-charge-scan-page .hc-pagination-wrap >>> .pagination-container {
  position: relative !important;
  height: 100% !important;
  margin: 0 !important;
}
</style>
