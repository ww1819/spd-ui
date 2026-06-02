<template>
  <div class="app-container patient-charge-page">
    <el-tabs v-model="activeMainTab" class="pc-tabs" @tab-click="onMainTabClick">
      <el-tab-pane label="患者费用明细" name="detail">
        <div class="pc-detail-layout">
        <div class="pc-query-wrap">
        <el-form :model="detailQuery" inline size="small" class="pc-query-form">
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
          <el-form-item label="费用明细主键">
            <el-input
              v-model="detailQuery.hisChargeId"
              placeholder="HIS费用明细主键"
              clearable
              style="width:160px"
              @keyup.enter.native="handleDetailQuery"
            />
          </el-form-item>
          <el-form-item label="退费关联ID">
            <el-input
              v-model="detailQuery.chargeIdTf"
              placeholder="退费对应收费明细ID"
              clearable
              style="width:180px"
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
          <el-form-item label="高低值类型">
            <el-select v-model="detailQuery.valueLevel" placeholder="全部" clearable style="width:120px">
              <el-option label="高值收费项" value="1" />
              <el-option label="低值收费项" value="2" />
              <el-option label="未识别" value="0" />
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
            <el-button type="warning" plain icon="el-icon-download" @click="handleExport">导出</el-button>
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
              @click="openFetchDialog"
              v-hasPermi="['department:patientCharge:fetchInpatient', 'department:patientCharge:fetchOutpatient']"
            >HIS收费数据抓取</el-button>
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
          class="pc-detail-table"
          @selection-change="rows => (detailSelection = rows)"
        >
          <el-table-column type="selection" width="48" align="center" :selectable="row => canProcessLow(row)" />
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
          <el-table-column label="费用明细主键" prop="hisChargeId" width="130" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.hisChargeId || scope.row.hisInpatientChargeId || scope.row.hisOutpatientChargeId || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="退费关联ID" width="130" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.chargeIdTf || scope.row.hisInpatientChargeIdTf || scope.row.hisOutpatientChargeIdTf || '' }}</span>
            </template>
          </el-table-column>
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
          <el-table-column label="处理类型" prop="processType" width="120" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ processTypeText(scope.row.processType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理状态" prop="processStatus" width="120" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ processStatusText(scope.row.processStatus) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理方" prop="processParty" width="100" show-overflow-tooltip />
          <el-table-column label="处理人" prop="processByName" width="100" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.processByName || scope.row.processBy || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理情况" prop="processSituation" min-width="200" show-overflow-tooltip />
          <el-table-column label="处理方" prop="processParty" width="100" show-overflow-tooltip />
          <el-table-column label="处理时间" prop="processTime" width="160" show-overflow-tooltip />
          <el-table-column label="本地入库" prop="createTime" width="160" />
          <el-table-column label="操作" align="center" width="220" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="mini"
                v-hasPermi="['department:patientCharge:generateConsume','department:patientCharge:processMirrorLow']"
                :disabled="!canProcessLow(scope.row)"
                @click="processLowValue(scope.row)"
              >低值</el-button>
              <el-button
                type="text"
                size="mini"
                v-hasPermi="['department:patientCharge:writeOffLow']"
                :disabled="!canWriteOffLow(scope.row)"
                @click="handleWriteOffLow(scope.row)"
              >冲销</el-button>
              <el-button
                type="text"
                size="mini"
                v-hasPermi="['department:patientCharge:list']"
                @click="openConsumeRecordDialog(scope.row)"
              >消耗记录</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pc-pagination-wrap">
          <pagination
            v-show="detailTotal > 0"
            :total="detailTotal"
            :page.sync="detailQuery.pageNum"
            :limit.sync="detailQuery.pageSize"
            @pagination="loadDetailList"
          />
        </div>
        </div>
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

    <el-dialog :title="consumeRecordDialog.title" :visible.sync="consumeRecordDialog.visible" width="92%" append-to-body class="consume-record-dialog">
      <el-table
        v-loading="consumeRecordDialog.loading"
        :data="consumeRecordDialog.rows"
        border
        size="small"
        max-height="420"
        empty-text="暂无消耗记录"
      >
        <el-table-column label="类型" width="64" align="center" fixed="left">
          <template slot-scope="scope">
            <span>{{ consumeRecordTypeText(scope.row.recordType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消耗单号" prop="consumeBillNo" min-width="178" show-overflow-tooltip />
        <el-table-column label="冲销来源单号" prop="reverseOfBillNo" min-width="178" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.reverseOfBillNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消耗日期" prop="consumeBillDate" width="158" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatDateTime(scope.row.consumeBillDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单状态" width="80" align="center">
          <template slot-scope="scope">
            <span>{{ consumeBillStatusText(scope.row.consumeBillStatus) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材" prop="materialName" min-width="110" show-overflow-tooltip />
        <el-table-column label="单价" prop="unitPrice" width="88" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatMoney(scope.row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="entryQty" width="80" align="right" show-overflow-tooltip />
        <el-table-column label="金额" prop="amt" width="96" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatMoney(scope.row.amt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" prop="batchNo" min-width="200" show-overflow-tooltip />
        <el-table-column label="批号" prop="batchNumber" min-width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.batchNumber || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" prop="endTime" width="108" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatDateOnly(scope.row.endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生产日期" prop="beginTime" width="108" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatDateOnly(scope.row.beginTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分摊数量" prop="allocQty" width="88" align="right" />
        <el-table-column label="关联时间" prop="createTime" width="158" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatDateTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="院内码/条码" prop="inHospitalCode" min-width="120" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="consumeRecordDialog.visible = false">关 闭</el-button>
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
  listMirrorConsumeRecords,
  writeOffMirrorLowValue
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
        hisChargeId: undefined,
        chargeIdTf: undefined,
        departmentId: undefined,
        processed: undefined,
        valueLevel: undefined,
        beginChargeDate: undefined,
        endChargeDate: undefined,
        beginProcessTime: undefined,
        endProcessTime: undefined
      },
      summaryLoading: false,
      summaryList: [],
      summaryQuery: {
        beginChargeDate: undefined,
        endChargeDate: undefined
      },
      fetchDialogVisible: false,
      fetchSubmitting: false,
      fetchForm: {
        beginDate: undefined,
        endDate: undefined,
        fetchInpatient: true,
        fetchOutpatient: true
      },
      consumeRecordDialog: {
        visible: false,
        loading: false,
        title: '消耗记录',
        rows: []
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
        CONSUMED: '已处理',
        REFUNDED: '已退费返还'
      }
      return m[v] || v || ''
    },
    processTypeText(v) {
      const m = { LOW_VALUE: '低值耗材', HIGH_VALUE: '高值耗材', REFUND: '计费退费' }
      return m[v] || v || ''
    },
    valueLevelText(v) {
      if (v === '1' || v === 1) return '高值'
      if (v === '2' || v === 2) return '低值'
      if (v === '0' || v === 0) return '未识别'
      return v ? String(v) : '未识别'
    },
    isUnknownValueLevel(row) {
      const v = row && row.valueLevel
      return v === '0' || v === 0 || v == null || v === ''
    },
    isLowValueLevel(row) {
      const v = row && row.valueLevel
      return v === '2' || v === 2
    },
    canProcessLow(row) {
      if (!row || row.processStatus !== 'PENDING_CONSUME') {
        return false
      }
      return this.isLowValueLevel(row)
    },
    consumeBillStatusText(v) {
      if (v === 1 || v === '1') return '未审核'
      if (v === 2 || v === '2') return '已审核'
      return v != null && v !== '' ? String(v) : '--'
    },
    consumeRecordTypeText(v) {
      if (v === 'REVERSE') return '冲销'
      return '消耗'
    },
    formatDateTime(v) {
      if (!v) return '--'
      return parseTime(v, '{y}-{m}-{d} {h}:{i}:{s}')
    },
    formatDateOnly(v) {
      if (!v) return '--'
      return parseTime(v, '{y}-{m}-{d}')
    },
    formatMoney(v) {
      if (v == null || v === '') return '--'
      const n = Number(v)
      if (isNaN(n)) return String(v)
      return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    },
    openConsumeRecordDialog(row) {
      if (!row || !row.id) {
        return
      }
      const vk = row.visitType === 'OUTPATIENT' ? 'OUTPATIENT' : 'INPATIENT'
      this.consumeRecordDialog.title = `消耗记录 · ${row.patientName || ''} · 收费项 ${row.chargeItemId || ''}`
      this.consumeRecordDialog.visible = true
      this.consumeRecordDialog.loading = true
      this.consumeRecordDialog.rows = []
      listMirrorConsumeRecords(vk, row.id).then(res => {
        this.consumeRecordDialog.rows = res.data || []
      }).finally(() => {
        this.consumeRecordDialog.loading = false
      })
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
        hisChargeId: undefined,
        chargeIdTf: undefined,
        departmentId: undefined,
        processed: undefined,
        valueLevel: undefined,
        beginChargeDate: undefined,
        endChargeDate: undefined,
        beginProcessTime: undefined,
        endProcessTime: undefined
      }
      this.detailSelection = []
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
        q.hisInpatientChargeId = q.hisChargeId
        q.hisInpatientChargeIdTf = q.chargeIdTf
        delete q.visitNo
        delete q.hisChargeId
        delete q.chargeIdTf
        listInpatientMirror(q).then(res => {
          this.detailList = (res.rows || []).map(r => ({
            ...r,
            visitType: 'INPATIENT',
            hisChargeId: r.hisInpatientChargeId,
            chargeIdTf: r.hisInpatientChargeIdTf
          }))
          this.detailTotal = res.total || 0
        }).finally(() => {
          this.detailLoading = false
          this.$nextTick(() => this.layoutDetailTable())
        })
      } else if (this.detailVisitType === 'OUT') {
        q.outpatientNo = q.visitNo
        q.hisOutpatientChargeId = q.hisChargeId
        q.hisOutpatientChargeIdTf = q.chargeIdTf
        delete q.visitNo
        delete q.hisChargeId
        delete q.chargeIdTf
        listOutpatientMirror(q).then(res => {
          this.detailList = (res.rows || []).map(r => ({
            ...r,
            visitType: 'OUTPATIENT',
            hisChargeId: r.hisOutpatientChargeId,
            chargeIdTf: r.hisOutpatientChargeIdTf
          }))
          this.detailTotal = res.total || 0
        }).finally(() => {
          this.detailLoading = false
          this.$nextTick(() => this.layoutDetailTable())
        })
      } else {
        listAllMirror(q).then(res => {
          this.detailList = res.rows || []
          this.detailTotal = res.total || 0
        }).finally(() => {
          this.detailLoading = false
          this.$nextTick(() => this.layoutDetailTable())
        })
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
    isRefundMirrorRow(row) {
      const tf = row && (row.chargeIdTf || row.hisInpatientChargeIdTf || row.hisOutpatientChargeIdTf)
      return tf != null && String(tf).trim() !== ''
    },
    canWriteOffLow(row) {
      if (!row || !this.isLowValueLevel(row)) {
        return false
      }
      if (row.processStatus === 'CONSUMED' && row.processType === 'LOW_VALUE') {
        return true
      }
      if (row.processStatus === 'REFUNDED') {
        return true
      }
      return false
    },
    handleWriteOffLow(row) {
      const visitKind = row && row.visitType ? row.visitType : this.currentVisitKind
      if (!visitKind) {
        this.$modal.msgWarning('请先切换到住院或门诊后再冲销')
        return
      }
      const isCharge = !this.isRefundMirrorRow(row)
      const tip = isCharge
        ? '将反消耗本行低值核销并返还科室库存；若存在已核销或已退费返还的关联退费行，将一并冲销并恢复为待处理。是否继续？'
        : '将撤销本退费行的低值处理/退费返还，恢复为待处理并调整科室库存。是否继续？'
      this.$modal.confirm(tip).then(() => {
        return writeOffMirrorLowValue({ visitKind, mirrorRowId: row.id })
      }).then(res => {
        const d = res.data || {}
        const rev = (d.reverseConsumeBillIds || []).length
        const reapply = (d.reapplyConsumeBillIds || []).length
        const rel = d.relatedRefundWriteOffCount != null ? d.relatedRefundWriteOffCount : 0
        let msg = `冲销完成：反消耗单 ${rev} 张`
        if (reapply > 0) {
          msg += `，撤销退费扣减单 ${reapply} 张`
        }
        if (rel > 0) {
          msg += `，联动退费 ${rel} 条`
        }
        this.$modal.msgSuccess(msg)
        this.handleDetailQuery()
      }).catch(() => {})
    },
    processLowValue(row) {
      if (this.isUnknownValueLevel(row)) {
        this.$modal.msgWarning('收费项目未维护高低值标识，请先在耗材档案维护是否高值后再核销')
        return
      }
      if (!this.isLowValueLevel(row)) {
        this.$modal.msgWarning('该行为高值收费项，请至高值管理-高值使用-高值扫描核销处理')
        return
      }
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
        this.$modal.msgWarning('请先勾选待处理的低值计费明细')
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
    buildExportParams() {
      const q = { ...this.detailQuery }
      delete q.pageNum
      delete q.pageSize
      q.beginChargeDate = this.toQueryDayStart(q.beginChargeDate)
      q.endChargeDate = this.toQueryDayEnd(q.endChargeDate)
      q.beginProcessTime = this.toQueryDayStart(q.beginProcessTime)
      q.endProcessTime = this.toQueryDayEnd(q.endProcessTime)
      if (this.detailVisitType === 'IN') {
        q.visitKind = 'INPATIENT'
        q.inpatientNo = q.visitNo
        q.hisInpatientChargeId = q.hisChargeId
        delete q.visitNo
        delete q.hisChargeId
      } else if (this.detailVisitType === 'OUT') {
        q.visitKind = 'OUTPATIENT'
        q.outpatientNo = q.visitNo
        q.hisOutpatientChargeId = q.hisChargeId
        delete q.visitNo
        delete q.hisChargeId
      }
      return q
    },
    handleExport() {
      const label = this.detailVisitType === 'IN' ? '住院' : (this.detailVisitType === 'OUT' ? '门诊' : '全部')
      this.download(
        'his/patientCharge/mirror/export',
        this.buildExportParams(),
        `患者费用明细_${label}_${new Date().getTime()}.xlsx`
      )
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

<style>
/* 与耗材产品维护一致：表格 height="60vh"；分页覆盖 ruoyi 绝对定位避免被 app-main 裁切 */
.patient-charge-page {
  padding: 1vh 0.8vw 1.5vh !important;
  box-sizing: border-box;
}

.patient-charge-page .pc-tabs >>> .el-tabs__header {
  margin-bottom: 0.8vh;
}

.patient-charge-page .pc-query-wrap {
  max-height: 18vh;
  overflow-y: auto;
  margin-bottom: 0.8vh;
}

.patient-charge-page .pc-detail-table {
  width: 100%;
}

.patient-charge-page .pc-pagination-wrap {
  margin-top: 0.5vh;
  min-height: 8vh;
  height: 8vh;
  box-sizing: border-box;
}

.patient-charge-page .pc-pagination-wrap >>> .pagination-container {
  position: relative !important;
  height: 100% !important;
  min-height: 8vh !important;
  margin: 0 !important;
  padding: 0.8vh 1vw !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  box-sizing: border-box;
}

.patient-charge-page .pc-pagination-wrap >>> .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}
</style>
