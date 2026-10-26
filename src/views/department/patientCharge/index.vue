<template>
  <div class="app-container list-page patient-charge-page">
    <el-tabs v-model="activeMainTab" class="pc-tabs" @tab-click="onMainTabClick">
      <el-tab-pane label="患者费用明细" name="detail">
        <div class="pc-detail-layout">
        <div class="form-fields-container list-query-panel pc-query-wrap">
        <el-form ref="detailQueryForm" :model="detailQuery" inline size="small" class="query-form pc-query-form">
          <div class="pc-detail-query-bar">
            <div class="pc-detail-query-row pc-detail-query-row--fields">
            <el-input
              v-model="detailQuery.patientName"
              placeholder="患者姓名"
              clearable
              class="pc-query-field"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.visitNo"
              :placeholder="detailVisitType === 'IN' ? '住院号' : (detailVisitType === 'OUT' ? '门诊号' : '住院/门诊号')"
              clearable
              class="pc-query-field"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.chargeItemId"
              placeholder="收费编码"
              clearable
              class="pc-query-field"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.itemName"
              placeholder="收费名称模糊"
              clearable
              class="pc-query-field pc-query-field--wide"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.hisChargeId"
              placeholder="HIS费用明细主键"
              clearable
              class="pc-query-field"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.chargeIdTf"
              placeholder="退费关联ID"
              clearable
              class="pc-query-field"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.execDeptName"
              placeholder="执行科室"
              clearable
              class="pc-query-field pc-query-field--wide"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-select v-model="detailQuery.processed" placeholder="是否处理" clearable size="small" class="pc-query-inline-select">
              <el-option label="已处理" value="Y" />
              <el-option label="未处理" value="N" />
            </el-select>
            <el-input
              v-model="detailQuery.orderDeptName"
              placeholder="开单科室"
              clearable
              class="pc-query-field pc-query-field--wide"
              @keyup.enter.native="handleDetailQuery"
            />
            </div>
            <div class="pc-detail-query-row pc-detail-query-row--date">
            <el-radio-group v-model="detailDateRangeType" size="small" class="pc-date-type-switch">
              <el-radio-button label="CHARGE">计费日期</el-radio-button>
              <el-radio-button label="PROCESS">核销日期</el-radio-button>
            </el-radio-group>
            <div class="pc-query-date-group">
              <el-date-picker
                v-model="detailDateRangeBegin"
                type="date"
                value-format="yyyy-MM-dd"
                :placeholder="detailDateRangeType === 'CHARGE' ? '计费起' : '核销起'"
                style="width:140px"
                clearable
                size="small"
              />
              <span class="pc-query-date-sep">至</span>
              <el-date-picker
                v-model="detailDateRangeEnd"
                type="date"
                value-format="yyyy-MM-dd"
                :placeholder="detailDateRangeType === 'CHARGE' ? '计费止' : '核销止'"
                style="width:140px"
                clearable
                size="small"
              />
            </div>
            <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleDetailQuery">搜索</el-button>
            <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetDetailQuery">重置</el-button>
            </div>
          </div>
        </el-form>
        </div>

        <el-row :gutter="0" class="mb8 list-toolbar">
          <div class="list-toolbar-left">
            <el-radio-group v-model="detailVisitType" size="small" class="pc-visit-type-group" @change="handleDetailQuery">
              <el-radio-button label="ALL">全部</el-radio-button>
              <el-radio-button label="IN">住院</el-radio-button>
              <el-radio-button label="OUT">门诊</el-radio-button>
            </el-radio-group>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              @click="handleExport"
            >导出</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              :disabled="detailVisitType === 'ALL' || batchLowSubmitting"
              :loading="batchLowSubmitting"
              v-hasPermi="['department:patientCharge:generateConsume','department:patientCharge:processMirrorLow']"
              @click="openBatchLowDialog"
            >批量低值核销</el-button>
            <span v-if="cachedSelectionCount > 0" class="pc-cached-sel-hint">已跨页勾选 {{ cachedSelectionCount }} 条</span>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              @click="openFetchDialog"
              v-hasPermi="['department:patientCharge:fetchInpatient', 'department:patientCharge:fetchOutpatient']"
            >HIS收费数据抓取</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              @click="openExecDeptBackfillDialog"
              v-hasPermi="['department:patientCharge:fetchInpatient', 'department:patientCharge:fetchOutpatient']"
            >补全执行科室</el-button>
          </div>
        </el-row>

        <div class="apply-table-panel" ref="tablePanel">
        <el-table
          ref="detailTable"
          v-loading="detailLoading"
          :data="detailList"
          :row-key="getDetailRowKey"
          :height="mainTableHeight"
          border
          stripe
          class="table-compact apply-main-table"
          :row-class-name="applyDetailRowClassName"
          @selection-change="onDetailSelectionChange"
          @row-dblclick="handleDetailRowDblclick"
        >
          <el-table-column type="selection" width="48" align="center" :reserve-selection="true" class-name="apply-select-col" :selectable="row => canProcessLow(row)" />
          <el-table-column label="类型" prop="visitType" width="72" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.visitType === 'INPATIENT' ? '住院' : '门诊' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="费用明细主键" prop="hisChargeId" width="118" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.hisChargeId || scope.row.hisInpatientChargeId || scope.row.hisOutpatientChargeId || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="开单科室编码" width="108" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ orderDeptCode(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="开单科室" min-width="128" show-overflow-tooltip sortable :sort-method="sortByOrderDeptName">
            <template slot-scope="scope">
              <span>{{ orderDeptName(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="执行科室编码" prop="execDeptId" width="108" show-overflow-tooltip />
          <el-table-column label="执行科室" prop="execDeptName" min-width="128" show-overflow-tooltip sortable />
          <template v-if="detailVisitType === 'IN'">
            <el-table-column label="住院号" prop="inpatientNo" width="108" show-overflow-tooltip sortable />
          </template>
          <template v-else-if="detailVisitType === 'OUT'">
            <el-table-column label="门诊号" prop="outpatientNo" width="108" show-overflow-tooltip sortable />
          </template>
          <template v-else>
            <el-table-column label="住院号-门诊号" width="118" show-overflow-tooltip sortable :sort-method="sortByVisitNo">
              <template slot-scope="scope">
                <span>{{ visitNoText(scope.row) }}</span>
              </template>
            </el-table-column>
          </template>
          <el-table-column label="患者姓名" prop="patientName" width="92" show-overflow-tooltip />
          <el-table-column label="收费编码" prop="chargeItemId" width="96" show-overflow-tooltip />
          <el-table-column label="收费名称" prop="itemName" min-width="148" show-overflow-tooltip />
          <el-table-column label="规格" prop="specModel" width="100" show-overflow-tooltip />
          <el-table-column label="数量" prop="quantity" width="90" align="right" />
          <el-table-column label="金额" prop="totalAmount" width="100" align="right" />
          <el-table-column label="高低值类型" prop="valueLevel" width="110" align="center">
            <template slot-scope="scope">
              <span>{{ valueLevelText(scope.row.valueLevel) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="计费时间" prop="chargeDate" width="160" show-overflow-tooltip />
          <el-table-column label="下载时间" prop="createTime" width="160" show-overflow-tooltip />
          <el-table-column label="抓取记录" width="90" align="center">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="mini"
                v-hasPermi="['department:patientCharge:list']"
                @click="openFetchTraceDialog(scope.row)"
              >查看</el-button>
            </template>
          </el-table-column>
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
          <el-table-column label="处理情况" prop="processSituation" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ formatProcessSituation(scope.row.processSituation) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理时间" prop="processTime" width="160" show-overflow-tooltip />
          <el-table-column label="退费关联ID" width="130" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.chargeIdTf || scope.row.hisInpatientChargeIdTf || scope.row.hisOutpatientChargeIdTf || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="300" fixed="right" class-name="apply-action-col">
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
                v-hasPermi="['department:patientCharge:generateConsume','department:patientCharge:processMirrorLow']"
                :disabled="!canProcessLow(scope.row)"
                @click="openSelfDeptLowConsume(scope.row)"
              >自选科室核销</el-button>
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
              >操作记录</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="apply-pagination-wrap" ref="paginationWrap">
          <pagination
            :total="detailTotal"
            :page.sync="detailQuery.pageNum"
            :limit.sync="detailQuery.pageSize"
            @pagination="loadDetailList"
          />
        </div>
        </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="患者费用汇总" name="summary">
        <div class="form-fields-container list-query-panel">
          <el-form ref="summaryQueryForm" :model="summaryQuery" inline size="small" class="query-form">
            <more-search-bar
              v-model="summaryMoreSearchTypes"
              :options="summaryMoreSearchOptions"
              storage-key="spd.department.patientCharge.summary.moreSearchTypes"
              :default-types="[]"
              :auto-load="false"
              @search="handleSummaryQuery"
              @reset="resetSummaryQuery"
            />
            <el-row :gutter="16" class="query-row-second">
              <el-col :span="24" class="query-row-second-inner">
                <el-form-item class="query-item-inline">
                  <el-date-picker v-model="summaryQuery.beginChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="计费起" style="width:140px" clearable />
                  <span style="margin:0 6px">至</span>
                  <el-date-picker v-model="summaryQuery.endChargeDate" type="date" value-format="yyyy-MM-dd" placeholder="计费止" style="width:140px" clearable />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
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

    <PatientChargeRecordDialog v-if="consumeRecordDialog.visible" />
    <PatientChargeTraceDialog v-if="fetchTraceDialog.visible" />
    <PatientChargeFetchDialog v-if="fetchDialogVisible" />
    <PatientChargeExecDeptDialog v-if="execDeptBackfillDialogVisible" />
    <PatientChargeSelfDeptDialog v-if="selfDeptLowDialog.visible" />
    <PatientChargeBatchLowDialog v-if="batchLowDialog.visible" />
    <PatientChargeBatchResultDialog v-if="batchLowResultDialog.visible" />
  </div>
</template>

<script>
import { parseTime } from '@/utils/ruoyi'
import { checkPermi } from '@/utils/permission'
import {
  splitChargeFetchDateRange,
  normalizeChargeFetchChunkDays,
  CHARGE_FETCH_DEFAULT_CHUNK_DAYS,
  PATIENT_CHARGE_HIS_SLOW_HINT,
  runPatientChargeSegments,
  formatHisChargeSlowError
} from '@/utils/patientChargeFetch'
import {
  listInpatientMirror,
  listOutpatientMirror,
  listAllMirror,
  listChargeSummary,
  fetchInpatientMirror,
  fetchOutpatientMirror,
  backfillInpatientExecDept,
  backfillOutpatientExecDept,
  processMirrorLowValue,
  processMirrorLowValueBatch,
  listMirrorConsumeRecords,
  listMirrorProcessLogs,
  listFetchBatchesForMirror,
  writeOffMirrorLowValue
} from '@/api/department/patientCharge'
import { fetchFinancePickDepartments } from '@/api/finance/settlementSummary'

function buildDefaultChargeDateRange() {
  const today = new Date()
  const endChargeDate = parseTime(today, '{y}-{m}-{d}')
  const beginDate = new Date(today)
  beginDate.setDate(beginDate.getDate() - 5)
  const beginChargeDate = parseTime(beginDate, '{y}-{m}-{d}')
  return { beginChargeDate, endChargeDate }
}

export default {
  name: 'PatientChargeHis',
  components: {
    PatientChargeRecordDialog: () => import('./components/PatientChargeRecordDialog'),
    PatientChargeTraceDialog: () => import('./components/PatientChargeTraceDialog'),
    PatientChargeFetchDialog: () => import('./components/PatientChargeFetchDialog'),
    PatientChargeExecDeptDialog: () => import('./components/PatientChargeExecDeptDialog'),
    PatientChargeSelfDeptDialog: () => import('./components/PatientChargeSelfDeptDialog'),
    PatientChargeBatchLowDialog: () => import('./components/PatientChargeBatchLowDialog'),
    PatientChargeBatchResultDialog: () => import('./components/PatientChargeBatchResultDialog')
  },
  data() {
    return {
      patientChargeHisSlowHint: PATIENT_CHARGE_HIS_SLOW_HINT,
      activeMainTab: 'detail',
      detailVisitType: 'IN',
      /** 日期筛选：CHARGE=计费日期 PROCESS=核销日期 */
      detailDateRangeType: 'CHARGE',
      detailLoading: false,
      summaryMoreSearchTypes: [],
      summaryMoreSearchOptions: [],
      detailList: [],
      detailTotal: 0,
      mainTableHeight: 400,
      detailSelection: [],
      /** 跨页勾选缓存：key = visitType:id */
      detailSelectionCache: Object.create(null),
      detailSelectionSyncing: false,
      batchLowSubmitting: false,
      batchLowDialog: {
        visible: false,
        scope: 'SELECTED'
      },
      batchLowResultDialog: {
        visible: false,
        successCount: 0,
        failCount: 0,
        failReasonStats: []
      },
      detailQuery: {
        pageNum: 1,
        pageSize: 10,
        patientName: undefined,
        visitNo: undefined,
        chargeItemId: undefined,
        hisChargeId: undefined,
        chargeIdTf: undefined,
        itemName: undefined,
        execDeptName: undefined,
        orderDeptName: undefined,
        processed: undefined,
        ...buildDefaultChargeDateRange(),
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
        fetchOutpatient: true,
        chunkDays: CHARGE_FETCH_DEFAULT_CHUNK_DAYS
      },
      execDeptBackfillDialogVisible: false,
      execDeptBackfillSubmitting: false,
      execDeptBackfillForm: {
        beginDate: undefined,
        endDate: undefined,
        fetchInpatient: true,
        fetchOutpatient: true,
        chunkDays: CHARGE_FETCH_DEFAULT_CHUNK_DAYS
      },
      consumeRecordDialog: {
        visible: false,
        loading: false,
        processLogLoading: false,
        activeTab: 'process',
        title: '操作记录',
        rows: [],
        processLogRows: []
      },
      fetchTraceDialog: {
        visible: false,
        loading: false,
        title: '抓取记录',
        hint: '',
        rows: []
      },
      selfDeptLowDialog: {
        visible: false,
        submitting: false,
        row: null,
        execDeptText: '',
        consumeDepartmentId: undefined
      }
    }
  },
  computed: {
    detailDateRangeBegin: {
      get() {
        return this.detailDateRangeType === 'CHARGE'
          ? this.detailQuery.beginChargeDate
          : this.detailQuery.beginProcessTime
      },
      set(val) {
        if (this.detailDateRangeType === 'CHARGE') {
          this.detailQuery.beginChargeDate = val
        } else {
          this.detailQuery.beginProcessTime = val
        }
      }
    },
    detailDateRangeEnd: {
      get() {
        return this.detailDateRangeType === 'CHARGE'
          ? this.detailQuery.endChargeDate
          : this.detailQuery.endProcessTime
      },
      set(val) {
        if (this.detailDateRangeType === 'CHARGE') {
          this.detailQuery.endChargeDate = val
        } else {
          this.detailQuery.endProcessTime = val
        }
      }
    },
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
    cachedSelectionCount() {
      return Object.keys(this.detailSelectionCache || {}).length
    }
  },
  created() {
    this.loadDetailList()
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize)
    this.scheduleApplyLayoutRefresh()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize)
  },
  watch: {
    detailTotal() {
      this.$nextTick(() => this.updateMainTableHeight())
    },
    detailLoading(val) {
      if (!val) {
        this.scheduleApplyLayoutRefresh()
      }
    },
    activeMainTab(val) {
      if (val === 'detail') {
        this.scheduleApplyLayoutRefresh()
      }
    }
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight()
    },
    scheduleApplyLayoutRefresh() {
      const run = () => this.updateMainTableHeight()
      this.$nextTick(() => {
        run()
        requestAnimationFrame(() => {
          run()
          ;[50, 120, 300].forEach((ms) => setTimeout(run, ms))
        })
      })
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel
      const pagWrap = this.$refs.paginationWrap
      if (!panel || !panel.getBoundingClientRect) return
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 52) + 8
      const top = panel.getBoundingClientRect().top
      const bottomPad = 14
      const available = Math.floor(window.innerHeight - top - bottomPad - pagH)
      const height = Math.max(240, available)
      const heightChanged = Math.abs(this.mainTableHeight - height) >= 2
      if (heightChanged) {
        this.mainTableHeight = height
      }
      this.$nextTick(() => {
        const table = this.$refs.detailTable
        if (!table) return
        const runSticky = () => {
          this.syncApplyTableSticky()
          requestAnimationFrame(() => this.syncApplyTableSticky())
        }
        if (!heightChanged) {
          runSticky()
          return
        }
        if (table.doLayout) {
          this.detailSelectionSyncing = true
          table.doLayout()
        }
        this.$nextTick(() => {
          runSticky()
          this.restoreDetailSelection()
        })
      })
    },
    syncApplyTableSticky() {
      const table = this.$refs.detailTable
      const root = table && table.$el
      if (!root) return
      const bodyWrap = root.querySelector('.el-table__body-wrapper')
      if (!bodyWrap) return
      const sw = Math.max(0, bodyWrap.offsetWidth - bodyWrap.clientWidth)
      const gutter = root.querySelector('th.gutter')
      if (gutter) {
        gutter.style.width = `${sw}px`
        gutter.style.display = sw > 0 ? '' : 'none'
      }
    },
    applyDetailRowClassName({ row }) {
      const key = this.selectionCacheKey(row)
      if (key && this.detailSelectionCache && this.detailSelectionCache[key]) {
        return 'apply-row-selected'
      }
      const rowId = row && row.id != null ? String(row.id) : ''
      if (rowId && (this.detailSelection || []).some(r => r && String(r.id) === rowId)) {
        return 'apply-row-selected'
      }
      return ''
    },
    /** 双击行切换勾选；再双击取消。仅可选低值待处理行；勾选列/操作列除外 */
    handleDetailRowDblclick(row, column) {
      if (!row || !this.canProcessLow(row)) return
      if (column && (column.type === 'selection' || column.label === '操作' || column.className === 'apply-action-col' || column.className === 'apply-select-col')) {
        return
      }
      const table = this.$refs.detailTable
      if (!table || typeof table.toggleRowSelection !== 'function') return
      const key = this.selectionCacheKey(row)
      const selected = !!(key && this.detailSelectionCache && this.detailSelectionCache[key])
        || !!(row.id != null && (this.detailSelection || []).some(r => r && String(r.id) === String(row.id)))
      table.toggleRowSelection(row, !selected)
    },
    orderDeptCode(row) {
      if (!row) return ''
      return row.deptCode || row.clinicCode || ''
    },
    orderDeptName(row) {
      if (!row) return ''
      return row.deptName || row.clinicName || row.deptDisplayName || ''
    },
    sortByOrderDeptName(a, b) {
      const va = this.orderDeptName(a) || ''
      const vb = this.orderDeptName(b) || ''
      if (va < vb) return -1
      if (va > vb) return 1
      return 0
    },
    visitNoText(row) {
      if (!row) return ''
      return row.inpatientNo || row.outpatientNo || row.visitNo || ''
    },
    sortByVisitNo(a, b) {
      const va = this.visitNoText(a) || ''
      const vb = this.visitNoText(b) || ''
      if (va < vb) return -1
      if (va > vb) return 1
      return 0
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
    formatProcessSituation(text) {
      if (text == null || text === '') return ''
      const t = String(text).trim()
      if (t === '处理成功' || t === '核销成功') return '核销成功'
      if (t === '高值核销失败' || t === '低值核销失败') {
        return '核销未完成，请重试或联系信息科'
      }
      return t
    },
    processTypeText(v) {
      const m = { LOW_VALUE: '低值耗材', HIGH_VALUE: '高值耗材', REFUND: '计费退费' }
      return m[v] || v || ''
    },
    valueLevelText(v) {
      // 业务仅两档：档案标高值=高值，其余（含历史未识别 0/空）=低值
      if (v === '1' || v === 1) return '高值'
      return '低值'
    },
    isUnknownValueLevel(row) {
      return false
    },
    isLowValueLevel(row) {
      const v = row && row.valueLevel
      return !(v === '1' || v === 1)
    },
    canProcessLow(row) {
      if (!row || row.processStatus !== 'PENDING_CONSUME') {
        return false
      }
      return this.isLowValueLevel(row)
    },
    getDetailRowKey(row) {
      if (!row || row.id == null || row.id === '') return ''
      return String(row.id)
    },
    selectionCacheKey(row) {
      if (!row || row.id == null || row.id === '') return ''
      const vk = row.visitType || this.currentVisitKind || 'UNKNOWN'
      return `${vk}:${String(row.id)}`
    },
    /**
     * 跨页勾选：依赖 el-table row-key + reserve-selection + 自维护 cache。
     * 翻页/换数时 Element 常先回调 []，且可能发生在 restore 之前；
     * 绝不可用空回调整表清空，也不可在 loading/syncing 期间按「本页曾勾过」误删 cache。
     */
    onDetailSelectionChange(rows) {
      if (this.detailSelectionSyncing || this.detailLoading) {
        return
      }
      const list = rows || []
      this.detailSelection = list
      const pageKeys = (this.detailList || []).map(r => this.selectionCacheKey(r)).filter(Boolean)
      pageKeys.forEach(k => {
        if (this.detailSelectionCache[k]) {
          this.$delete(this.detailSelectionCache, k)
        }
      })
      list.forEach(r => {
        const k = this.selectionCacheKey(r)
        if (!k || !this.canProcessLow(r)) return
        this.$set(this.detailSelectionCache, k, {
          id: String(r.id),
          visitType: r.visitType || this.currentVisitKind,
          execDeptId: r.execDeptId
        })
      })
      this.$nextTick(() => {
        if (this.$refs.detailTable) {
          this.$refs.detailTable.$forceUpdate()
        }
      })
    },
    restoreDetailSelection() {
      const table = this.$refs.detailTable
      if (!table || typeof table.toggleRowSelection !== 'function') {
        this.detailSelectionSyncing = false
        return
      }
      this.detailSelectionSyncing = true
      try {
        ;(this.detailList || []).forEach(row => {
          const k = this.selectionCacheKey(row)
          if (k && this.detailSelectionCache[k] && this.canProcessLow(row)) {
            table.toggleRowSelection(row, true)
          }
        })
      } finally {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.detailSelectionSyncing = false
            const table = this.$refs.detailTable
            if (table) {
              table.$forceUpdate()
            }
          })
        })
      }
    },
    clearDetailSelectionCache() {
      Object.keys(this.detailSelectionCache || {}).forEach(k => {
        this.$delete(this.detailSelectionCache, k)
      })
      this.detailSelection = []
      const table = this.$refs.detailTable
      if (table && typeof table.clearSelection === 'function') {
        this.detailSelectionSyncing = true
        table.clearSelection()
        this.$nextTick(() => {
          this.detailSelectionSyncing = false
        })
      }
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
    processLogOperationText(v) {
      if (v === 'LOW_WRITE_OFF') return '低值冲销'
      if (v === 'HIGH_CONSUME') return '高值核销'
      return '低值核销'
    },
    processLogOutcomeText(v) {
      if (v === 'FAIL') return '失败'
      if (v === 'SUCCESS') return '成功'
      return v != null && v !== '' ? String(v) : '--'
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
      this.consumeRecordDialog.title = `操作记录 · ${row.patientName || ''} · 收费项 ${row.chargeItemId || ''}`
      this.consumeRecordDialog.visible = true
      this.consumeRecordDialog.activeTab = 'process'
      this.consumeRecordDialog.loading = true
      this.consumeRecordDialog.processLogLoading = true
      this.consumeRecordDialog.rows = []
      this.consumeRecordDialog.processLogRows = []
      listMirrorProcessLogs(vk, row.id).then(res => {
        this.consumeRecordDialog.processLogRows = res.data || []
      }).finally(() => {
        this.consumeRecordDialog.processLogLoading = false
      })
      listMirrorConsumeRecords(vk, row.id).then(res => {
        this.consumeRecordDialog.rows = res.data || []
      }).finally(() => {
        this.consumeRecordDialog.loading = false
      })
    },
    openFetchTraceDialog(row) {
      if (!row || !row.id) {
        return
      }
      const vk = row.visitType === 'OUTPATIENT' ? 'OUTPATIENT' : 'INPATIENT'
      const chargeAt = this.formatDateTime(row.chargeDate)
      const downloadAt = this.formatDateTime(row.createTime)
      this.fetchTraceDialog.title = `抓取记录 · ${row.patientName || ''} · 收费项 ${row.chargeItemId || ''}`
      this.fetchTraceDialog.hint = `计费时间 ${chargeAt}，下载时间 ${downloadAt}。下列为相关抓取；标记「本条下载成功」的是写入本条的那一次。`
      this.fetchTraceDialog.visible = true
      this.fetchTraceDialog.loading = true
      this.fetchTraceDialog.rows = []
      listFetchBatchesForMirror(vk, row.id).then(res => {
        this.fetchTraceDialog.rows = res.data || []
      }).finally(() => {
        this.fetchTraceDialog.loading = false
      })
    },
    onMainTabClick(tab) {
      if (tab.name === 'summary' && this.summaryList.length === 0 && this.summaryQuery.beginChargeDate) {
        this.loadSummary()
      }
    },
    handleDetailQuery() {
      this.detailQuery.pageNum = 1
      this.clearDetailSelectionCache()
      this.loadDetailList()
    },
    resetDetailQuery() {
      this.detailDateRangeType = 'CHARGE'
      this.detailQuery = {
        pageNum: 1,
        pageSize: 10,
        patientName: undefined,
        visitNo: undefined,
        chargeItemId: undefined,
        hisChargeId: undefined,
        chargeIdTf: undefined,
        itemName: undefined,
        execDeptName: undefined,
        orderDeptName: undefined,
        processed: undefined,
        ...buildDefaultChargeDateRange(),
        beginProcessTime: undefined,
        endProcessTime: undefined
      }
      this.clearDetailSelectionCache()
      this.loadDetailList()
    },
    buildDetailQueryParams() {
      const q = { ...this.detailQuery }
      if (this.detailDateRangeType === 'CHARGE') {
        q.beginChargeDate = this.toQueryDayStart(q.beginChargeDate)
        q.endChargeDate = this.toQueryDayEnd(q.endChargeDate)
        q.beginProcessTime = null
        q.endProcessTime = null
      } else {
        q.beginProcessTime = this.toQueryDayStart(q.beginProcessTime)
        q.endProcessTime = this.toQueryDayEnd(q.endProcessTime)
        q.beginChargeDate = null
        q.endChargeDate = null
      }
      return q
    },
    loadDetailList() {
      // 换页换数前先锁住 selection 回调，避免 data 替换瞬间的 [] 误清跨页 cache
      this.detailSelectionSyncing = true
      this.detailLoading = true
      const q = this.buildDetailQueryParams()
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
          this.$nextTick(() => {
            this.restoreDetailSelection()
            this.scheduleApplyLayoutRefresh()
          })
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
          this.$nextTick(() => {
            this.restoreDetailSelection()
            this.scheduleApplyLayoutRefresh()
          })
        })
      } else {
        listAllMirror(q).then(res => {
          this.detailList = res.rows || []
          this.detailTotal = res.total || 0
        }).finally(() => {
          this.detailLoading = false
          this.$nextTick(() => {
            this.restoreDetailSelection()
            this.scheduleApplyLayoutRefresh()
          })
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
    resetSummaryQuery() {
      this.summaryQuery = {
        beginChargeDate: undefined,
        endChargeDate: undefined
      }
      this.summaryList = []
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
        fetchOutpatient: true,
        chunkDays: CHARGE_FETCH_DEFAULT_CHUNK_DAYS
      }
      this.fetchDialogVisible = true
    },
    resetFetchForm() {
      this.fetchForm = {
        beginDate: undefined,
        endDate: undefined,
        fetchInpatient: true,
        fetchOutpatient: true,
        chunkDays: CHARGE_FETCH_DEFAULT_CHUNK_DAYS
      }
    },
    openExecDeptBackfillDialog() {
      const day = parseTime(new Date(), '{y}-{m}-{d}')
      this.execDeptBackfillForm = {
        beginDate: `${day} 00:00:00`,
        endDate: `${day} 23:59:59`,
        fetchInpatient: true,
        fetchOutpatient: true,
        chunkDays: CHARGE_FETCH_DEFAULT_CHUNK_DAYS
      }
      this.execDeptBackfillDialogVisible = true
    },
    resetExecDeptBackfillForm() {
      this.execDeptBackfillForm = {
        beginDate: undefined,
        endDate: undefined,
        fetchInpatient: true,
        fetchOutpatient: true,
        chunkDays: CHARGE_FETCH_DEFAULT_CHUNK_DAYS
      }
    },
    formatBackfillResult(label, d, segmentCount) {
      const data = d || {}
      const segHint = segmentCount > 1 ? `（共 ${segmentCount} 段）` : ''
      return `${label}${segHint} 更新 ${data.updatedCount || 0}，跳过 ${data.skippedCount || 0}，HIS无执行科室 ${data.hisMissingExecCount || 0}，本地无记录 ${data.notFoundCount || 0}，统一表同步 ${data.unifiedSyncedCount || 0}`
    },
    mergeBackfillAgg(agg, data) {
      if (!data) return agg
      if (!agg) {
        return { ...data }
      }
      return {
        updatedCount: (agg.updatedCount || 0) + (data.updatedCount || 0),
        skippedCount: (agg.skippedCount || 0) + (data.skippedCount || 0),
        hisMissingExecCount: (agg.hisMissingExecCount || 0) + (data.hisMissingExecCount || 0),
        notFoundCount: (agg.notFoundCount || 0) + (data.notFoundCount || 0),
        unifiedSyncedCount: data.unifiedSyncedCount != null ? data.unifiedSyncedCount : agg.unifiedSyncedCount
      }
    },
    async submitExecDeptBackfill() {
      if (!this.execDeptBackfillForm.beginDate || !this.execDeptBackfillForm.endDate) {
        this.$modal.msgWarning('请选择起止时间')
        return
      }
      const wantIn = !!this.execDeptBackfillForm.fetchInpatient
      const wantOut = !!this.execDeptBackfillForm.fetchOutpatient
      if (!wantIn && !wantOut) {
        this.$modal.msgWarning('请至少勾选住院或门诊其中一项')
        return
      }
      const canIn = this.canFetchInpatient
      const canOut = this.canFetchOutpatient
      if (wantIn && !canIn) {
        this.$modal.msgWarning('已勾选住院但无住院抓取权限')
        return
      }
      if (wantOut && !canOut) {
        this.$modal.msgWarning('已勾选门诊但无门诊抓取权限')
        return
      }
      const chunkDays = normalizeChargeFetchChunkDays(this.execDeptBackfillForm.chunkDays)
      const segments = splitChargeFetchDateRange(
        this.execDeptBackfillForm.beginDate,
        this.execDeptBackfillForm.endDate,
        chunkDays
      )
      if (!segments.length) {
        this.$modal.msgWarning('起止时间无效')
        return
      }
      this.execDeptBackfillSubmitting = true
      try {
        let inAgg = null
        let outAgg = null
        await runPatientChargeSegments({
          segments,
          getProgressText: (cur, total, seg) =>
            `正在补全执行科室 第 ${cur}/${total} 段（${seg.beginDate} ~ ${seg.endDate}），HIS 响应较慢请耐心等待`,
          runOneSegment: async (seg) => {
            const body = { beginDate: seg.beginDate, endDate: seg.endDate, chunkDays }
            if (wantIn && canIn) {
              const data = await backfillInpatientExecDept(body).then(res => res.data)
              inAgg = this.mergeBackfillAgg(inAgg, data)
            }
            if (wantOut && canOut) {
              const data = await backfillOutpatientExecDept(body).then(res => res.data)
              outAgg = this.mergeBackfillAgg(outAgg, data)
            }
          }
        })
        const msgs = []
        if (inAgg) {
          msgs.push(this.formatBackfillResult('住院', inAgg, segments.length))
        }
        if (outAgg) {
          msgs.push(this.formatBackfillResult('门诊', outAgg, segments.length))
        }
        if (!msgs.length) {
          this.$modal.msgWarning('未执行任何补全')
          return
        }
        this.$modal.msgSuccess(msgs.join('；'))
        this.execDeptBackfillDialogVisible = false
        this.handleDetailQuery()
      } catch (e) {
        this.$modal.msgError(formatHisChargeSlowError(e, {
          timeoutMsg: `HIS 补全执行科室超时（共 ${segments.length} 段）。请缩小时间跨度或减小间隔天数后重试。`
        }))
      } finally {
        this.execDeptBackfillSubmitting = false
      }
    },
    isRefundMirrorRow(row) {
      const tf = row && (row.chargeIdTf || row.hisInpatientChargeIdTf || row.hisOutpatientChargeIdTf)
      return tf != null && String(tf).trim() !== ''
    },
    canWriteOffLow(row) {
      if (!row) {
        return false
      }
      // 已低值核销的计费行：以 processType 为准，不受耗材档案后续高低值变更影响
      if (row.processStatus === 'CONSUMED' && row.processType === 'LOW_VALUE') {
        return true
      }
      // 退费返还行仍按收费项目高低值判断（低值退费才走本冲销）
      if (row.processStatus === 'REFUNDED' && this.isLowValueLevel(row)) {
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
      }).catch(() => {
        // 失败原因已写入处理情况，刷新列表以便展示
        this.handleDetailQuery()
      })
    },
    openSelfDeptLowConsume(row) {
      if (this.isUnknownValueLevel(row)) {
        this.$modal.msgWarning('收费项目未维护高低值标识，请先在耗材档案维护是否高值后再核销')
        return
      }
      if (!this.isLowValueLevel(row)) {
        this.$modal.msgWarning('该行为高值收费项，请至高值管理-高值使用-高值扫描核销处理')
        return
      }
      if (!this.canProcessLow(row)) {
        this.$modal.msgWarning('仅待处理的低值明细可自选科室核销')
        return
      }
      const code = row.execDeptId || ''
      const name = row.execDeptName || ''
      this.selfDeptLowDialog = {
        visible: true,
        submitting: false,
        row,
        execDeptText: code && name ? `${code} / ${name}` : (code || name || '--'),
        consumeDepartmentId: undefined
      }
      this.prefillSelfDeptFromExec(code)
    },
    /** 默认带出执行科室：按 HIS 编码在 pick 列表匹配；不在列表或无法匹配则保持空 */
    prefillSelfDeptFromExec(execHisCode) {
      const key = execHisCode != null ? String(execHisCode).trim() : ''
      if (!key) {
        return
      }
      fetchFinancePickDepartments()
        .then(res => {
          const rows = res && res.data != null ? res.data : res
          const list = Array.isArray(rows) ? rows : []
          const hit = list.find(d => {
            if (!d) return false
            const code = d.code != null ? String(d.code).trim() : ''
            const hisId = d.hisId != null ? String(d.hisId).trim() : ''
            return code === key || hisId === key
          })
          if (hit && hit.id != null && this.selfDeptLowDialog.visible) {
            this.selfDeptLowDialog.consumeDepartmentId = hit.id
          }
        })
        .catch(() => {})
    },
    resetSelfDeptLowDialog() {
      this.selfDeptLowDialog = {
        visible: false,
        submitting: false,
        row: null,
        execDeptText: '',
        consumeDepartmentId: undefined
      }
    },
    submitSelfDeptLowConsume() {
      const row = this.selfDeptLowDialog.row
      if (!row || !row.id) {
        this.$modal.msgWarning('未选择计费明细')
        return
      }
      if (!this.selfDeptLowDialog.consumeDepartmentId) {
        this.$modal.msgWarning('请选择核销科室')
        return
      }
      const visitKind = row.visitType ? row.visitType : this.currentVisitKind
      if (!visitKind) {
        this.$modal.msgWarning('请先切换到住院或门诊后再核销')
        return
      }
      const consumeDepartmentId = Number(this.selfDeptLowDialog.consumeDepartmentId)
      if (Number.isNaN(consumeDepartmentId)) {
        this.$modal.msgWarning('核销科室无效，请重新选择')
        return
      }
      this.selfDeptLowDialog.submitting = true
      processMirrorLowValue({
        visitKind,
        mirrorRowId: row.id,
        consumeDepartmentId,
        requireConsumeDepartment: true
      }).then(res => {
        const d = res.data || {}
        this.$modal.msgSuccess(
          `自选科室核销完成：消耗单 ${d.consumeBillCount || 0} 张，明细 ${d.consumeEntryCount || 0} 条，追溯 ${d.linkRowCount || 0} 条`
        )
        this.selfDeptLowDialog.visible = false
        this.handleDetailQuery()
      }).catch(() => {
        this.handleDetailQuery()
      }).finally(() => {
        this.selfDeptLowDialog.submitting = false
      })
    },
    openBatchLowDialog() {
      if (this.detailVisitType === 'ALL') {
        this.$modal.msgWarning('“全部”模式下批量低值核销请先切换到住院或门诊后分别执行')
        return
      }
      this.batchLowDialog.scope = this.cachedSelectionCount > 0 ? 'SELECTED' : 'QUERY'
      this.batchLowDialog.visible = true
    },
    isExecDeptEmpty(row) {
      if (!row) return true
      const id = row.execDeptId != null ? String(row.execDeptId).trim() : ''
      return id === ''
    },
    async resolveBatchWriteOffCandidates(scope) {
      if (scope === 'SELECTED') {
        const rows = Object.values(this.detailSelectionCache || {}).filter(x => x && x.id)
        let emptyCount = 0
        const writableIds = []
        rows.forEach(r => {
          if (this.isExecDeptEmpty(r)) {
            emptyCount += 1
          } else {
            writableIds.push(String(r.id))
          }
        })
        return { writableIds, emptyCount, totalCount: rows.length }
      }
      return this.collectQueryablePendingLowCandidates()
    },
    async confirmBatchLowProcess() {
      if (this.detailVisitType === 'ALL' || !this.currentVisitKind) {
        this.$modal.msgWarning('“全部”模式下批量低值核销请先切换到住院或门诊后分别执行')
        return
      }
      const scope = this.batchLowDialog.scope
      let candidates
      try {
        if (scope === 'SELECTED') {
          if (!this.cachedSelectionCount) {
            this.$modal.msgWarning('请先勾选待处理的低值计费明细（支持跨页勾选）')
            return
          }
        } else {
          this.batchLowSubmitting = true
        }
        candidates = await this.resolveBatchWriteOffCandidates(scope)
        if (!candidates.totalCount) {
          this.$modal.msgWarning('当前查询条件下没有可低值核销的待处理明细')
          return
        }
        if (!candidates.writableIds.length) {
          this.$modal.msgWarning(`共 ${candidates.emptyCount} 条待处理明细执行科室均为空，无法批量核销；可先补全执行科室或使用「自选科室核销」`)
          return
        }
      } catch (e) {
        return
      } finally {
        if (scope !== 'SELECTED') {
          this.batchLowSubmitting = false
        }
      }
      this.batchLowDialog.visible = false
      const scopeText = scope === 'SELECTED' ? '已勾选' : '查询结果'
      let skipHint = candidates.emptyCount > 0 ? `；${candidates.emptyCount} 条执行科室为空将跳过` : ''
      const go = await this.$modal
        .confirm(
          `将对${scopeText}中执行科室不为空的 ${candidates.writableIds.length} 条逐条低值核销${skipHint}；单条失败不影响其它条。是否继续？`
        )
        .then(() => true)
        .catch(() => false)
      if (!go) {
        return
      }
      this.batchLowSubmitting = true
      try {
        if (candidates.emptyCount > 0) {
          const doBackfill = await this.$modal
            .confirm(
              `当前范围内有 ${candidates.emptyCount} 条执行科室为空。是否先按计费日期从 HIS 补全执行科室？（补全后仍仅核销执行科室不为空的记录）`
            )
            .then(() => true)
            .catch(() => false)
          if (doBackfill) {
            try {
              await this.ensureExecDeptBeforeBatchLow()
            } catch (e) {
              if (e === 'cancel' || (e && e.message === 'cancel')) {
                return
              }
              const cont = await this.$modal
                .confirm(
                  formatHisChargeSlowError(e, {
                    timeoutMsg: '补全执行科室失败或超时。是否仍继续核销（仅执行科室不为空的记录）？'
                  })
                )
                .then(() => true)
                .catch(() => false)
              if (!cont) {
                return
              }
            }
            candidates = await this.resolveBatchWriteOffCandidates(scope)
            if (!candidates.writableIds.length) {
              this.$modal.msgWarning('补全后仍无执行科室不为空的待核销明细')
              return
            }
            skipHint = candidates.emptyCount > 0 ? `；${candidates.emptyCount} 条仍为空已跳过` : ''
          }
        }
        const res = await processMirrorLowValueBatch({
          visitKind: this.currentVisitKind,
          mirrorRowIds: candidates.writableIds
        })
        const d = res.data || {}
        const ok = d.successCount != null ? d.successCount : 0
        const fail = d.failCount != null ? d.failCount : 0
        let stats = Array.isArray(d.failReasonStats) ? d.failReasonStats : []
        if (!stats.length && Array.isArray(d.failMessages) && d.failMessages.length) {
          const map = {}
          d.failMessages.forEach(line => {
            const s = String(line || '')
            const i = s.indexOf(': ')
            const reason = i >= 0 ? s.slice(i + 2).trim() : s.trim() || '(无具体原因)'
            map[reason] = (map[reason] || 0) + 1
          })
          stats = Object.keys(map)
            .map(reason => ({ reason, count: map[reason] }))
            .sort((a, b) => b.count - a.count || String(a.reason).localeCompare(String(b.reason)))
        }
        this.batchLowResultDialog = {
          visible: fail > 0 || stats.length > 0,
          successCount: ok,
          failCount: fail,
          failReasonStats: stats
        }
        const skipMsg = candidates.emptyCount > 0 ? `，跳过 ${candidates.emptyCount} 条（执行科室为空）` : ''
        this.$modal.msgSuccess(
          `完成：成功 ${ok} 条，失败 ${fail} 条${skipMsg}` + (stats.length ? `（已按原因汇总 ${stats.length} 类）` : '')
        )
        this.clearDetailSelectionCache()
        this.handleDetailQuery()
      } catch (e) {
        this.handleDetailQuery()
      } finally {
        this.batchLowSubmitting = false
      }
    },
    copyBatchFailReasons() {
      const rows = this.batchLowResultDialog.failReasonStats || []
      const text = [
        `成功 ${this.batchLowResultDialog.successCount} 条，失败 ${this.batchLowResultDialog.failCount} 条`,
        ...rows.map((r, idx) => `${idx + 1}. [${r.count}] ${r.reason}`)
      ].join('\n')
      const done = () => this.$modal.msgSuccess('失败原因汇总已复制')
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          this.fallbackCopyText(text)
          done()
        })
      } else {
        this.fallbackCopyText(text)
        done()
      }
    },
    fallbackCopyText(text) {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } finally {
        document.body.removeChild(ta)
      }
    },
    /**
     * PC-F-008：批量核销前按当前计费日期区间自动补全空执行科室。
     * 复用既有 backfillExecDept（仅写本地为空且 HIS 有值）。
     */
    async ensureExecDeptBeforeBatchLow() {
      const beginRaw = this.detailQuery.beginChargeDate
      const endRaw = this.detailQuery.endChargeDate
      if (!beginRaw || !endRaw) {
        const go = await this.$modal
          .confirm('当前未设置计费日期，无法自动补全执行科室。将直接核销，缺执行科室的记录可能失败。是否继续？')
          .then(() => true)
          .catch(() => false)
        if (!go) {
          return Promise.reject(new Error('cancel'))
        }
        return { ran: false, reason: 'noDate' }
      }
      const wantIn = this.detailVisitType === 'IN'
      const wantOut = this.detailVisitType === 'OUT'
      if (wantIn && !this.canFetchInpatient) {
        const go = await this.$modal
          .confirm('无住院补全执行科室权限，将直接核销。缺执行科室的记录可能失败。是否继续？')
          .then(() => true)
          .catch(() => false)
        if (!go) {
          return Promise.reject(new Error('cancel'))
        }
        return { ran: false, reason: 'noPerm' }
      }
      if (wantOut && !this.canFetchOutpatient) {
        const go = await this.$modal
          .confirm('无门诊补全执行科室权限，将直接核销。缺执行科室的记录可能失败。是否继续？')
          .then(() => true)
          .catch(() => false)
        if (!go) {
          return Promise.reject(new Error('cancel'))
        }
        return { ran: false, reason: 'noPerm' }
      }
      const beginDate = this.toQueryDayStart(beginRaw)
      const endDate = this.toQueryDayEnd(endRaw)
      const chunkDays = normalizeChargeFetchChunkDays(CHARGE_FETCH_DEFAULT_CHUNK_DAYS)
      const segments = splitChargeFetchDateRange(beginDate, endDate, chunkDays)
      if (!segments.length) {
        const go = await this.$modal
          .confirm('计费日期无效，无法自动补全执行科室。是否仍继续核销？')
          .then(() => true)
          .catch(() => false)
        if (!go) {
          return Promise.reject(new Error('cancel'))
        }
        return { ran: false, reason: 'badDate' }
      }
      let agg = null
      await runPatientChargeSegments({
        segments,
        getProgressText: (cur, total, seg) =>
          `批量核销前补全执行科室 第 ${cur}/${total} 段（${seg.beginDate} ~ ${seg.endDate}）`,
        runOneSegment: async (seg) => {
          const body = { beginDate: seg.beginDate, endDate: seg.endDate, chunkDays }
          let data
          if (wantIn) {
            data = await backfillInpatientExecDept(body).then(res => res.data)
          } else {
            data = await backfillOutpatientExecDept(body).then(res => res.data)
          }
          agg = this.mergeBackfillAgg(agg, data)
        }
      })
      if (agg) {
        const label = wantIn ? '住院' : '门诊'
        this.$modal.msgSuccess(this.formatBackfillResult(`批量前${label}补全`, agg, segments.length))
      }
      return { ran: true, agg }
    },
    async collectQueryablePendingLowCandidates() {
      const pageSize = 200
      let pageNum = 1
      let emptyCount = 0
      const writableIds = []
      const maxPages = 100
      while (pageNum <= maxPages) {
        const q = { ...this.buildDetailQueryParams(), pageNum, pageSize, processed: 'N' }
        let res
        if (this.detailVisitType === 'IN') {
          q.inpatientNo = q.visitNo
          q.hisInpatientChargeId = q.hisChargeId
          q.hisInpatientChargeIdTf = q.chargeIdTf
          delete q.visitNo
          delete q.hisChargeId
          delete q.chargeIdTf
          res = await listInpatientMirror(q)
          ;(res.rows || []).forEach(r => {
            const row = { ...r, visitType: 'INPATIENT', processStatus: r.processStatus, valueLevel: r.valueLevel }
            if (!this.canProcessLow(row)) return
            if (this.isExecDeptEmpty(row)) {
              emptyCount += 1
            } else {
              writableIds.push(String(r.id))
            }
          })
        } else {
          q.outpatientNo = q.visitNo
          q.hisOutpatientChargeId = q.hisChargeId
          q.hisOutpatientChargeIdTf = q.chargeIdTf
          delete q.visitNo
          delete q.hisChargeId
          delete q.chargeIdTf
          res = await listOutpatientMirror(q)
          ;(res.rows || []).forEach(r => {
            const row = { ...r, visitType: 'OUTPATIENT', processStatus: r.processStatus, valueLevel: r.valueLevel }
            if (!this.canProcessLow(row)) return
            if (this.isExecDeptEmpty(row)) {
              emptyCount += 1
            } else {
              writableIds.push(String(r.id))
            }
          })
        }
        const got = (res && res.rows) ? res.rows.length : 0
        if (got < pageSize) break
        pageNum += 1
      }
      return { writableIds, emptyCount, totalCount: writableIds.length + emptyCount }
    },
    async collectQueryablePendingLowIds() {
      const { writableIds } = await this.collectQueryablePendingLowCandidates()
      return writableIds
    },
    buildExportParams() {
      const q = { ...this.buildDetailQueryParams() }
      delete q.pageNum
      delete q.pageSize
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
    formatFetchResult(label, d, segmentCount) {
      const data = d || {}
      const segHint = segmentCount > 1 ? `（共 ${segmentCount} 段）` : ''
      return `${label}${segHint}：新增 ${data.insertedCount || 0}，跳过 ${data.skippedCount || 0}，指纹不一致 ${data.driftCount || 0}`
    },
    mergeFetchAgg(agg, data) {
      if (!data) return agg
      if (!agg) {
        return { ...data }
      }
      return {
        insertedCount: (agg.insertedCount || 0) + (data.insertedCount || 0),
        skippedCount: (agg.skippedCount || 0) + (data.skippedCount || 0),
        driftCount: (agg.driftCount || 0) + (data.driftCount || 0)
      }
    },
    async submitFetch() {
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
      const chunkDays = normalizeChargeFetchChunkDays(this.fetchForm.chunkDays)
      const segments = splitChargeFetchDateRange(this.fetchForm.beginDate, this.fetchForm.endDate, chunkDays)
      if (!segments.length) {
        this.$modal.msgWarning('起止时间无效')
        return
      }
      this.fetchSubmitting = true
      try {
        let inAgg = null
        let outAgg = null
        await runPatientChargeSegments({
          segments,
          getProgressText: (cur, total, seg) =>
            `正在从 HIS 抓取 第 ${cur}/${total} 段（${seg.beginDate} ~ ${seg.endDate}），响应较慢请耐心等待`,
          runOneSegment: async (seg) => {
            const body = { beginDate: seg.beginDate, endDate: seg.endDate, chunkDays }
            if (wantIn && canIn) {
              const data = await fetchInpatientMirror(body).then(res => res.data)
              inAgg = this.mergeFetchAgg(inAgg, data)
            }
            if (wantOut && canOut) {
              const data = await fetchOutpatientMirror(body).then(res => res.data)
              outAgg = this.mergeFetchAgg(outAgg, data)
            }
          }
        })
        const msgs = []
        if (inAgg) {
          msgs.push(this.formatFetchResult('住院', inAgg, segments.length))
        }
        if (outAgg) {
          msgs.push(this.formatFetchResult('门诊', outAgg, segments.length))
        }
        if (!msgs.length) {
          this.$modal.msgWarning('未执行任何抓取')
          return
        }
        this.$modal.msgSuccess(msgs.join('；'))
        this.fetchDialogVisible = false
        this.handleDetailQuery()
      } catch (e) {
        this.$modal.msgError(formatHisChargeSlowError(e, {
          timeoutMsg: `HIS 收费抓取超时（共 ${segments.length} 段）。请缩小时间跨度或减小间隔天数后重试。`
        }))
      } finally {
        this.fetchSubmitting = false
      }
    }
  }
}
</script>

<style>
/* 列表区对齐到货验收（department-apply-list-align.scss）；以下为页内特例 */
.patient-charge-page .pc-tabs.el-tabs {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.patient-charge-page .pc-tabs >>> .el-tabs__header {
  margin-bottom: 4px;
  flex-shrink: 0;
}

.patient-charge-page .pc-tabs >>> .el-tabs__content {
  flex: 1 1 auto;
  min-height: 0;
}

.patient-charge-page .pc-detail-layout {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.patient-charge-page .pc-detail-layout > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 280px;
}

.patient-charge-page .pc-query-wrap {
  max-height: none;
  overflow: visible;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.patient-charge-page .list-query-panel {
  margin-top: 0;
}

.patient-charge-page .list-toolbar {
  flex-shrink: 0;
}

.patient-charge-page .pc-visit-type-group {
  margin-right: 12px;
  vertical-align: middle;
}

.patient-charge-page .list-toolbar-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.patient-charge-page .pc-detail-query-bar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.patient-charge-page .pc-detail-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.patient-charge-page .pc-detail-query-row--date {
  padding-top: 2px;
}

.patient-charge-page .pc-query-field {
  width: 140px;
  flex-shrink: 0;
}

.patient-charge-page .pc-query-field--wide {
  width: 168px;
}

.patient-charge-page .pc-date-type-switch {
  flex-shrink: 0;
}

.patient-charge-page .pc-query-form >>> .query-row-fields-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.patient-charge-page .pc-query-inline-select {
  width: 150px;
  flex-shrink: 0;
}

.patient-charge-page .pc-query-date-group {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
}

.patient-charge-page .pc-query-date-sep {
  color: #606266;
}

.patient-charge-page .pc-cached-sel-hint {
  margin-left: 8px;
  color: #e6a23c;
  font-size: 13px;
}

.patient-charge-page .pc-batch-scope {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin: 8px 0 4px;
}

.patient-charge-page .pc-batch-tip {
  margin: 8px 0 0;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

/* 勾选行高亮（与到货验收一致） */
.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.patient-charge-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.patient-charge-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td,
.patient-charge-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td .cell,
.patient-charge-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.patient-charge-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.patient-charge-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.charge-fetch-chunk-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
</style>
