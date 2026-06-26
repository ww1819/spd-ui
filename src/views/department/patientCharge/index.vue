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
          <el-form-item label="执行科室">
            <el-select
              v-model="detailQuery.departmentId"
              placeholder="按权限执行科室"
              clearable
              filterable
              style="width:200px"
            >
              <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="执行科室名称">
            <el-input
              v-model="detailQuery.execDeptName"
              placeholder="执行科室模糊"
              clearable
              style="width:160px"
              @keyup.enter.native="handleDetailQuery"
            />
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
          <el-form-item>
            <el-button
              type="primary"
              plain
              @click="openExecDeptBackfillDialog"
              v-hasPermi="['department:patientCharge:fetchInpatient', 'department:patientCharge:fetchOutpatient']"
            >补全执行科室</el-button>
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
            <el-table-column label="开单科室" prop="deptName" min-width="120" show-overflow-tooltip />
            <el-table-column label="执行科室" prop="execDeptName" min-width="120" show-overflow-tooltip />
          </template>
          <template v-else-if="detailVisitType === 'OUT'">
            <el-table-column label="门诊号" prop="outpatientNo" width="120" show-overflow-tooltip />
            <el-table-column label="开单科室" prop="clinicName" min-width="120" show-overflow-tooltip />
            <el-table-column label="执行科室" prop="execDeptName" min-width="120" show-overflow-tooltip />
          </template>
          <template v-else>
            <el-table-column label="号" prop="visitNo" width="120" show-overflow-tooltip />
            <el-table-column label="开单科室" prop="deptDisplayName" min-width="120" show-overflow-tooltip />
            <el-table-column label="执行科室" prop="execDeptName" min-width="120" show-overflow-tooltip />
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
          <el-table-column label="处理情况" prop="processSituation" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ formatProcessSituation(scope.row.processSituation) }}</span>
            </template>
          </el-table-column>
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
        <el-table-column label="核销科室" prop="writeOffDeptName" min-width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.writeOffDeptName || '--' }}</span>
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
        <el-form-item label="间隔天数">
          <el-input-number
            v-model="fetchForm.chunkDays"
            :min="1"
            :max="7"
            :step="1"
            controls-position="right"
            style="width: 120px"
          />
          <span class="charge-fetch-chunk-tip">跨度较大时按此间隔自动分段抓取（默认5天，最大7天）</span>
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon :title="patientChargeHisSlowHint" />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="fetchDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="fetchSubmitting" @click="submitFetch">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="补全历史执行科室" :visible.sync="execDeptBackfillDialogVisible" width="520px" append-to-body @close="resetExecDeptBackfillForm">
      <el-form :model="execDeptBackfillForm" label-width="100px" size="small">
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="execDeptBackfillForm.beginDate"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="yyyy-MM-dd HH:mm:ss"
            style="width:100%"
            default-time="00:00:00"
          />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="execDeptBackfillForm.endDate"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="yyyy-MM-dd HH:mm:ss"
            style="width:100%"
            default-time="23:59:59"
          />
        </el-form-item>
        <el-form-item label="补全范围">
          <el-checkbox v-model="execDeptBackfillForm.fetchInpatient" :disabled="!canFetchInpatient">住院</el-checkbox>
          <el-checkbox v-model="execDeptBackfillForm.fetchOutpatient" :disabled="!canFetchOutpatient" style="margin-left:16px">门诊</el-checkbox>
        </el-form-item>
        <el-form-item label="间隔天数">
          <el-input-number
            v-model="execDeptBackfillForm.chunkDays"
            :min="1"
            :max="7"
            :step="1"
            controls-position="right"
            style="width: 120px"
          />
          <span class="charge-fetch-chunk-tip">跨度较大时按此间隔自动分段补全（默认5天，最大7天）</span>
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon :title="patientChargeHisSlowHint + ' 仅更新已有收费行缺失的执行科室，不新增。'" />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="execDeptBackfillDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="execDeptBackfillSubmitting" @click="submitExecDeptBackfill">确 定</el-button>
      </div>
    </el-dialog>
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
import { listdepartAll } from '@/api/foundation/depart'
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
  writeOffMirrorLowValue
} from '@/api/department/patientCharge'

export default {
  name: 'PatientChargeHis',
  data() {
    return {
      patientChargeHisSlowHint: PATIENT_CHARGE_HIS_SLOW_HINT,
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
        execDeptName: undefined,
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
        // 仅保留可用于 HIS 执行科室映射的科室：exec_dept_id = fd_department.his_id
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
        execDeptName: undefined,
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

.charge-fetch-chunk-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
</style>
