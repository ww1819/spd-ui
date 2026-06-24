<template>
  <div class="app-container high-charge-scan-page">
    <div class="hc-filter-panel">
      <el-form :model="detailQuery" inline size="small" class="hc-query-form">
        <el-form-item label="类型">
          <el-radio-group v-model="detailVisitType" @change="handleDetailQuery">
            <el-radio-button label="ALL">全部</el-radio-button>
            <el-radio-button label="IN">住院</el-radio-button>
            <el-radio-button label="OUT">门诊</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="患者姓名">
          <el-input v-model="detailQuery.patientName" placeholder="姓名/首字母" clearable style="width:140px" @keyup.enter.native="handleDetailQuery" />
        </el-form-item>
        <el-form-item :label="detailVisitType === 'IN' ? '住院号' : (detailVisitType === 'OUT' ? '门诊号' : '住院/门诊号')">
          <el-input
            v-model="detailQuery.visitNo"
            :placeholder="detailVisitType === 'IN' ? '住院号模糊' : (detailVisitType === 'OUT' ? '门诊号模糊' : '住院/门诊号模糊')"
            clearable
            style="width:160px"
            @keyup.enter.native="handleDetailQuery"
          />
        </el-form-item>
        <el-form-item label="收费编码">
          <el-input v-model="detailQuery.chargeItemId" placeholder="编码/项目名称/首字母" clearable style="width:180px" @keyup.enter.native="handleDetailQuery" />
        </el-form-item>
        <el-form-item label="收费明细主键">
          <el-input v-model="detailQuery.hisChargeId" placeholder="HIS收费明细主键模糊" clearable style="width:180px" @keyup.enter.native="handleDetailQuery" />
        </el-form-item>
        <el-form-item label="科室">
          <el-select
            v-model="detailQuery.departmentId"
            placeholder="科室名称/首字母"
            clearable
            filterable
            :filter-method="filterDeptMethod"
            style="width:200px"
          >
            <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <div class="hc-query-form-second-row">
          <el-form-item label="计费日期">
            <el-date-picker v-model="detailQuery.beginChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="起" style="width:140px" clearable />
            <span style="margin:0 6px">至</span>
            <el-date-picker v-model="detailQuery.endChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="止" style="width:140px" clearable />
          </el-form-item>
          <el-form-item label="是否处理">
            <el-select v-model="detailQuery.processed" placeholder="全部" clearable style="width:110px">
              <el-option label="已处理" value="Y" />
              <el-option label="未处理" value="N" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <div class="hc-action-bar">
      <el-button
        type="success"
        plain
        size="small"
        v-hasPermi="['department:patientCharge:fetchInpatient', 'department:patientCharge:fetchOutpatient']"
        @click="openFetchDialog"
      >收费记录提取</el-button>
      <el-button type="primary" icon="el-icon-search" size="small" @click="handleDetailQuery">查询</el-button>
      <el-button icon="el-icon-refresh" size="small" @click="resetDetailQuery">重置</el-button>
    </div>

    <div class="hc-detail-box">
    <el-table
      ref="detailTable"
      v-loading="detailLoading"
      :data="detailList"
      height="60vh"
      border
      stripe
      class="hc-detail-table"
    >
      <el-table-column label="序号" type="index" width="60" align="center" :index="detailRowIndex" fixed="left" />
      <el-table-column label="就诊类型" prop="visitType" width="80">
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
        <el-table-column label="住院号/门诊号" prop="visitNo" width="130" show-overflow-tooltip />
        <el-table-column label="科室/就诊" prop="deptDisplayName" min-width="120" show-overflow-tooltip />
      </template>
      <el-table-column label="姓名" prop="patientName" width="100" show-overflow-tooltip />
      <el-table-column label="性别" prop="patientSex" width="60" align="center" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ formatPatientSex(scope.row.patientSex) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="收费编码" prop="chargeItemId" width="120" show-overflow-tooltip />
      <el-table-column label="收费明细主键" prop="hisChargeId" width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.hisChargeId || scope.row.hisInpatientChargeId || scope.row.hisOutpatientChargeId || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="项目名称" prop="itemName" min-width="160" show-overflow-tooltip />
      <el-table-column label="规格" prop="specModel" width="100" show-overflow-tooltip />
      <el-table-column label="数量" prop="quantity" width="90" align="center" />
      <el-table-column label="计费时间" prop="chargeDate" width="160" show-overflow-tooltip />
      <el-table-column label="金额" prop="totalAmount" width="100" align="right" />
      <el-table-column label="核销状态" prop="processStatus" width="100" align="center" show-overflow-tooltip>
        <template slot-scope="scope">
          <span :class="writeOffStatusClass(scope.row.processStatus)">{{ writeOffStatusText(scope.row.processStatus) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="处理情况" prop="processSituation" min-width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ formatProcessSituation(scope.row.processSituation) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="valueLevel" width="90" align="center">
        <template slot-scope="scope">
          <span>{{ valueLevelText(scope.row.valueLevel) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="text"
            size="small"
            class="hc-table-op-btn"
            v-hasPermi="highScanPermi"
            @click="openHighDialog(scope.row)"
          >高值</el-button>
          <el-button
            type="text"
            size="small"
            class="hc-table-op-btn"
            v-hasPermi="['gz:highChargeScan:list','department:patientCharge:list']"
            @click="openConsumeRecordDialog(scope.row)"
          >消耗记录</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

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
        class="high-scan-input-ime-off"
        placeholder="扫描院内码（扫码枪自动识别）；手工输入后按回车"
        autocomplete="off"
        spellcheck="false"
        clearable
        @compositionstart="highScanComposing = true"
        @compositionend="onHighScanCompositionEnd"
        @input="onHighScanInput"
        @keydown.native="onHighScanKeydown"
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

    <el-dialog :title="fetchDialogTitle" :visible.sync="fetchDialogVisible" width="520px" append-to-body @close="resetFetchForm">
      <el-form :model="fetchForm" label-width="100px" size="small">
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="fetchForm.beginDate"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="yyyy-MM-dd HH:mm:ss"
            style="width:100%"
            default-time="00:00:00"
          />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="fetchForm.endDate"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="yyyy-MM-dd HH:mm:ss"
            style="width:100%"
            default-time="23:59:59"
          />
        </el-form-item>
        <el-form-item label="抓取范围">
          <el-checkbox v-model="fetchForm.fetchInpatient" :disabled="!canFetchInpatient">住院</el-checkbox>
          <el-checkbox v-model="fetchForm.fetchOutpatient" :disabled="!canFetchOutpatient" style="margin-left:16px">门诊</el-checkbox>
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon title="按计费时间（含时分秒）从 HIS 视图增量拉取；勾选住院/门诊后确定抓取；多选时先住院后门诊；默认当天 00:00:00～23:59:59；已存在且一致则跳过；跨度受服务端 max-range-days 限制。" />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="fetchDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="fetchSubmitting" @click="submitFetch">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { parseTime } from '@/utils/ruoyi'
import { checkPermi } from '@/utils/permission'
import { pinyin } from 'pinyin-pro'
import {
  normalizeBarcodeInput,
  isImeProcessKey,
  isScannerEnterKey,
  isRapidScannerBurst
} from '@/utils/barcodeInput'
import { listdepartAll } from '@/api/foundation/depart'
import { fetchInpatientMirror, fetchOutpatientMirror } from '@/api/department/patientCharge'
import {
  listHighChargeInpatientMirror,
  listHighChargeOutpatientMirror,
  listHighChargeAllMirror,
  listHighChargeConsumeRecords,
  scanHighChargeBarcode,
  applyHighChargeConsume
} from '@/api/gz/highChargeScan'

function buildDefaultChargeDateRange() {
  const today = new Date()
  const endChargeDate = parseTime(today, '{y}-{m}-{d}')
  const beginDate = new Date(today)
  beginDate.setDate(beginDate.getDate() - 5)
  const beginChargeDate = parseTime(beginDate, '{y}-{m}-{d}')
  return { beginChargeDate, endChargeDate }
}

export default {
  name: 'GzHighChargeScan',
  data() {
    return {
      detailVisitType: 'ALL',
      detailLoading: false,
      detailList: [],
      detailTotal: 0,
      deptOptions: [],
      allDeptOptions: [],
      detailQuery: {
        pageNum: 1,
        pageSize: 10,
        patientName: undefined,
        visitNo: undefined,
        chargeItemId: undefined,
        hisChargeId: undefined,
        departmentId: undefined,
        processed: undefined,
        valueLevel: '1',
        ...buildDefaultChargeDateRange()
      },
      highDialogVisible: false,
      highSubmitting: false,
      highMirrorRow: null,
      highScanCode: '',
      highScanComposing: false,
      highScanBuffer: '',
      highScanFirstKeyAt: 0,
      highScanLastKeyAt: 0,
      highScanAutoTimer: null,
      highScanSubmitting: false,
      highScanLastSubmitCode: '',
      highScanLastSubmitAt: 0,
      highLines: [],
      highBillRemaining: null,
      consumeRecordDialog: {
        visible: false,
        loading: false,
        title: '消耗记录',
        rows: []
      },
      fetchDialogVisible: false,
      fetchSubmitting: false,
      fetchForm: {
        beginDate: undefined,
        endDate: undefined,
        fetchInpatient: true,
        fetchOutpatient: true
      }
    }
  },
  computed: {
    fetchDialogTitle() {
      return 'HIS收费数据抓取'
    },
    canFetchInpatient() {
      return checkPermi(['department:patientCharge:fetchInpatient'])
    },
    canFetchOutpatient() {
      return checkPermi(['department:patientCharge:fetchOutpatient'])
    },
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
    detailRowIndex(index) {
      const page = Number(this.detailQuery.pageNum) || 1
      const size = Number(this.detailQuery.pageSize) || 10
      return (page - 1) * size + index + 1
    },
    loadDeptOptions() {
      const uid = this.$store.getters.userId
      if (!uid) return
      listdepartAll(uid).then(res => {
        const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : [])
        this.allDeptOptions = list.filter(d => d && d.id != null && d.hisId != null && String(d.hisId).trim() !== '')
        this.deptOptions = this.allDeptOptions
      })
    },
    filterDeptMethod(query) {
      if (!query) {
        this.deptOptions = this.allDeptOptions
        return
      }
      const queryUpper = query.toUpperCase()
      this.deptOptions = this.allDeptOptions.filter(item => {
        if (!item || !item.name) return false
        const name = item.name
        const code = (item.code || '').toUpperCase()
        const referred = (item.referredName || '').toUpperCase()
        if (name.includes(query) || name.toUpperCase().includes(queryUpper) || code.includes(queryUpper) || referred.includes(queryUpper)) {
          return true
        }
        if (/^[a-zA-Z]+$/.test(query)) {
          try {
            const initials = pinyin(name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toUpperCase()
            if (initials.includes(queryUpper)) return true
          } catch (e) {
            return false
          }
        }
        return false
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
    formatPatientSex(v) {
      if (v == null || String(v).trim() === '') {
        return '--'
      }
      const s = String(v).trim()
      if (s === '0' || s === '男' || s.toUpperCase() === 'M') {
        return '男'
      }
      if (s === '1' || s === '女' || s.toUpperCase() === 'F') {
        return '女'
      }
      return s
    },
    /** 列表展示：核销状态（用户可读） */
    writeOffStatusText(v) {
      if (v === 'CONSUMED') return '已核销'
      if (v === 'PARTIALLY_CONSUMED') return '部分核销'
      return '待核销'
    },
    writeOffStatusClass(v) {
      if (v === 'CONSUMED') return 'hc-writeoff-done'
      if (v === 'PARTIALLY_CONSUMED') return 'hc-writeoff-partial'
      return 'hc-writeoff-pending'
    },
    formatProcessSituation(text) {
      if (text == null || text === '') return ''
      const t = String(text).trim()
      if (t === '处理成功' || t === '核销成功') return '核销成功'
      if (t === '高值核销失败' || t === '低值核销失败') {
        return '核销未完成，请重试或联系信息科'
      }
      return t
    },
    formatHighApplySuccessMessage(d) {
      const data = d || {}
      const applied = data.appliedQty != null ? Number(data.appliedQty) : null
      const remaining = data.remainingBillQty != null ? Number(data.remainingBillQty) : null
      const status = data.mirrorProcessStatus
      const done = status === 'CONSUMED' || (remaining != null && !isNaN(remaining) && remaining <= 0)
      if (done) {
        return '高值核销成功，本条计费已全部完成'
      }
      if (status === 'PARTIALLY_CONSUMED' && applied != null && !isNaN(applied) && remaining != null && !isNaN(remaining)) {
        return `高值核销成功，本次消耗 ${applied}，还剩 ${remaining} 待核销，可继续扫码`
      }
      return '高值核销成功'
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
        this.$modal.msgWarning('该行已核销')
        return
      }
      if (row.valueLevel !== '1' && row.valueLevel !== 1) {
        return
      }
      this.highMirrorRow = row
      this.highLines = []
      this.resetHighScanInputState()
      this.highBillRemaining = null
      this.highDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.highScanInput && this.$refs.highScanInput.focus) {
          this.$refs.highScanInput.focus()
        }
      })
    },
    resetHighDialog() {
      this.clearHighScanAutoTimer()
      this.highMirrorRow = null
      this.highLines = []
      this.resetHighScanInputState()
      this.highBillRemaining = null
    },
    resetHighScanInputState() {
      this.highScanCode = ''
      this.highScanComposing = false
      this.highScanBuffer = ''
      this.highScanFirstKeyAt = 0
      this.highScanLastKeyAt = 0
      this.highScanLastSubmitCode = ''
      this.highScanLastSubmitAt = 0
    },
    clearHighScanAutoTimer() {
      if (this.highScanAutoTimer) {
        clearTimeout(this.highScanAutoTimer)
        this.highScanAutoTimer = null
      }
    },
    focusHighScanInput() {
      this.$nextTick(() => {
        const input = this.$refs.highScanInput
        if (input && input.focus) {
          input.focus()
        }
      })
    },
    scheduleHighScanAutoSubmit(code, charCount) {
      this.clearHighScanAutoTimer()
      if (!code) {
        return
      }
      const count = charCount != null ? charCount : (this.highScanBuffer || '').length
      if (!isRapidScannerBurst(this.highScanFirstKeyAt, this.highScanLastKeyAt, count)) {
        return
      }
      this.highScanAutoTimer = setTimeout(() => {
        this.highScanAutoTimer = null
        if (normalizeBarcodeInput(this.highScanCode) === code) {
          this.submitHighScanNow()
        }
      }, 80)
    },
    submitHighScanNow() {
      if (this.highScanComposing) {
        this.$nextTick(() => {
          setTimeout(() => this.doHighScan(), 30)
        })
        return
      }
      this.doHighScan()
    },
    onHighScanCompositionEnd(e) {
      this.highScanComposing = false
      const normalized = normalizeBarcodeInput(e && e.target ? e.target.value : this.highScanCode)
      if (normalized !== this.highScanCode) {
        this.highScanCode = normalized
      }
      this.syncHighScanBurstTiming(normalized)
    },
    onHighScanInput(val) {
      if (this.highScanComposing) {
        return
      }
      const normalized = normalizeBarcodeInput(val)
      if (normalized !== val) {
        this.highScanCode = normalized
      }
      this.syncHighScanBurstTiming(normalized)
    },
    /** 仅记录连击时间供扫码枪识别，不修改/清空已输入内容 */
    syncHighScanBurstTiming(normalized) {
      const now = Date.now()
      if (!normalized) {
        this.highScanFirstKeyAt = 0
        this.highScanLastKeyAt = 0
        this.highScanBuffer = ''
        return
      }
      if (!this.highScanFirstKeyAt || now - this.highScanLastKeyAt > 500) {
        this.highScanFirstKeyAt = now
      }
      this.highScanLastKeyAt = now
      this.highScanBuffer = normalized
      this.scheduleHighScanAutoSubmit(normalized, normalized.length)
    },
    onHighScanKeydown(e) {
      if (isImeProcessKey(e)) {
        return
      }
      if (isScannerEnterKey(e)) {
        e.preventDefault()
        e.stopPropagation()
        this.clearHighScanAutoTimer()
        this.submitHighScanNow()
      }
    },
    doHighScan() {
      if (this.highScanSubmitting) {
        return
      }
      this.clearHighScanAutoTimer()
      const code = normalizeBarcodeInput(this.highScanCode)
      if (!code || !this.highMirrorRow) return
      const now = Date.now()
      if (this.highScanLastSubmitCode === code && now - this.highScanLastSubmitAt < 300) {
        return
      }
      this.highScanLastSubmitCode = code
      this.highScanLastSubmitAt = now
      this.highScanCode = code
      this.highScanSubmitting = true
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
        this.resetHighScanInputState()
        this.focusHighScanInput()
      }).finally(() => {
        this.highScanSubmitting = false
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
        this.$modal.msgSuccess(this.formatHighApplySuccessMessage(d))
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
        hisChargeId: undefined,
        departmentId: undefined,
        processed: undefined,
        valueLevel: '1',
        ...buildDefaultChargeDateRange()
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
        q.hisInpatientChargeId = q.hisChargeId
        delete q.visitNo
        delete q.hisChargeId
        listHighChargeInpatientMirror(q).then(res => {
          this.detailList = (res.rows || []).map(r => ({
            ...r,
            visitType: 'INPATIENT',
            hisChargeId: r.hisInpatientChargeId
          }))
          this.detailTotal = res.total || 0
        }).finally(done)
      } else if (this.detailVisitType === 'OUT') {
        q.outpatientNo = q.visitNo
        q.hisOutpatientChargeId = q.hisChargeId
        delete q.visitNo
        delete q.hisChargeId
        listHighChargeOutpatientMirror(q).then(res => {
          this.detailList = (res.rows || []).map(r => ({
            ...r,
            visitType: 'OUTPATIENT',
            hisChargeId: r.hisOutpatientChargeId
          }))
          this.detailTotal = res.total || 0
        }).finally(done)
      } else {
        delete q.visitNo
        listHighChargeAllMirror(q).then(res => {
          this.detailList = res.rows || []
          this.detailTotal = res.total || 0
        }).finally(done)
      }
    },
    openFetchDialog() {
      const day = parseTime(new Date(), '{y}-{m}-{d}')
      this.fetchForm = {
        beginDate: `${day} 00:00:00`,
        endDate: `${day} 23:59:59`,
        fetchInpatient: true,
        fetchOutpatient: true
      }
      this.fetchDialogVisible = true
    },
    resetFetchForm() {
      this.fetchForm = {
        beginDate: undefined,
        endDate: undefined,
        fetchInpatient: true,
        fetchOutpatient: true
      }
    },
    formatFetchResult(label, d) {
      const data = d || {}
      return `${label} 批次 ${data.fetchBatchId || ''}：新增 ${data.insertedCount || 0}，跳过 ${data.skippedCount || 0}，指纹不一致 ${data.driftCount || 0}`
    },
    submitFetch() {
      if (!this.fetchForm.beginDate || !this.fetchForm.endDate) {
        this.$modal.msgWarning('请选择起止时间')
        return
      }
      const wantIn = !!this.fetchForm.fetchInpatient
      const wantOut = !!this.fetchForm.fetchOutpatient
      if (!wantIn && !wantOut) {
        this.$modal.msgWarning('请至少勾选住院或门诊其中一项')
        return
      }
      const canIn = this.canFetchInpatient
      const canOut = this.canFetchOutpatient
      if (!canIn && !canOut) {
        this.$modal.msgWarning('无住院/门诊抓取权限')
        return
      }
      if (wantIn && !canIn) {
        this.$modal.msgWarning('已勾选住院但无住院抓取权限')
        return
      }
      if (wantOut && !canOut) {
        this.$modal.msgWarning('已勾选门诊但无门诊抓取权限')
        return
      }
      this.fetchSubmitting = true
      const body = { beginDate: this.fetchForm.beginDate, endDate: this.fetchForm.endDate }
      const runInpatient = () => {
        if (!wantIn || !canIn) {
          return Promise.resolve(null)
        }
        return fetchInpatientMirror(body).then(res => res.data)
      }
      const runOutpatient = () => {
        if (!wantOut || !canOut) {
          return Promise.resolve(null)
        }
        return fetchOutpatientMirror(body).then(res => res.data)
      }
      runInpatient()
        .then(inData => runOutpatient().then(outData => ({ inData, outData })))
        .then(({ inData, outData }) => {
          const msgs = []
          if (inData) {
            msgs.push(this.formatFetchResult('住院', inData))
          }
          if (outData) {
            msgs.push(this.formatFetchResult('门诊', outData))
          }
          if (!msgs.length) {
            this.$modal.msgWarning('未执行任何抓取')
            return
          }
          this.$modal.msgSuccess(msgs.join('；'))
          this.fetchDialogVisible = false
          this.handleDetailQuery()
        })
        .catch(() => {})
        .finally(() => { this.fetchSubmitting = false })
    }
  }
}
</script>

<style scoped>
.high-scan-input-ime-off >>> .el-input__inner {
  ime-mode: disabled;
}
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

.high-charge-scan-page .hc-filter-panel,
.high-charge-scan-page .hc-action-bar,
.high-charge-scan-page .hc-detail-box {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-sizing: border-box;
}

.high-charge-scan-page .hc-filter-panel {
  padding: 10px 12px 4px;
  margin-bottom: 0;
}

.high-charge-scan-page .hc-action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.high-charge-scan-page .hc-action-bar .el-button {
  margin: 0;
}

.high-charge-scan-page .hc-filter-panel .hc-query-form .el-form-item {
  margin-bottom: 8px;
}

.high-charge-scan-page .hc-query-form-second-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  clear: both;
}

.high-charge-scan-page .hc-query-form-second-row .el-form-item {
  margin-bottom: 0;
}

/* 筛选区输入框聚焦：提高发光对比度，便于识别当前焦点 */
.high-charge-scan-page .hc-filter-panel .el-input__inner:focus,
.high-charge-scan-page .hc-filter-panel .el-textarea__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.55);
}

.high-charge-scan-page .hc-filter-panel .el-input.is-focus .el-input__inner {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.55);
}

.high-charge-scan-page .hc-filter-panel .el-date-editor.is-active .el-input__inner,
.high-charge-scan-page .hc-filter-panel .el-select .el-input.is-focus .el-input__inner {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.55);
}

.high-charge-scan-page .hc-detail-box {
  padding: 0;
  overflow: hidden;
}

.high-charge-scan-page .hc-detail-table {
  width: 100%;
}

/* 横向滚动条：默认可见；鼠标移入表格数据区时加粗，便于拖拽（不用 padding 撑高页面） */
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 8px !important;
  transition: height 0.2s ease;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper:hover::-webkit-scrollbar:horizontal {
  height: 16px !important;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper:hover::-webkit-scrollbar:vertical {
  width: 12px !important;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #eef0f3 !important;
  border-radius: 6px !important;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 6px !important;
  border: 2px solid #eef0f3 !important;
  background-clip: padding-box !important;
  min-width: 40px !important;
  min-height: 8px !important;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper:hover::-webkit-scrollbar-thumb {
  background: #606266 !important;
  border-color: #e4e7ed !important;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #303133 !important;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #909399 #eef0f3;
}
.high-charge-scan-page .hc-detail-table.el-table .el-table__body-wrapper:hover {
  scrollbar-width: auto;
  scrollbar-color: #606266 #e4e7ed;
}

.high-charge-scan-page .hc-pagination-wrap {
  margin-top: 12px;
  padding: 0 4px 8px;
}
.high-charge-scan-page .hc-pagination-wrap .pagination-container {
  position: relative !important;
  margin: 0 !important;
  padding: 10px 16px !important;
}

.high-charge-scan-page .hc-writeoff-done {
  color: #67c23a;
  font-weight: 500;
}
.high-charge-scan-page .hc-writeoff-partial {
  color: #e6a23c;
  font-weight: 500;
}
.high-charge-scan-page .hc-writeoff-pending {
  color: #f56c6c;
  font-weight: 500;
}
.high-charge-scan-page .hc-table-op-btn {
  font-size: 14px;
  padding: 0 6px;
}
</style>
