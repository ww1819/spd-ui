<template>
  <div class="app-container list-page high-charge-scan-page" ref="pageRoot">
    <div class="hc-main">
      <div class="form-fields-container list-query-panel" v-show="showSearch">
        <el-form :model="detailQuery" ref="queryForm" size="small" :inline="true" class="query-form">
          <div class="hc-query-row">
            <el-radio-group
              v-model="detailVisitType"
              size="small"
              class="hc-query-type-group"
              @change="onDetailVisitTypeChange"
            >
              <el-radio-button label="ALL">全部</el-radio-button>
              <el-radio-button label="IN">住院</el-radio-button>
              <el-radio-button label="OUT">门诊</el-radio-button>
            </el-radio-group>
            <el-input
              v-model="detailQuery.patientName"
              placeholder="患者姓名"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.visitNo"
              :placeholder="detailVisitType === 'IN' ? '住院号' : (detailVisitType === 'OUT' ? '门诊号' : '住院/门诊号')"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.chargeItemId"
              placeholder="收费编码"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-input
              v-model="detailQuery.hisChargeId"
              placeholder="收费明细主键"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleDetailQuery"
            />
            <el-select
              v-model="detailQuery.departmentId"
              placeholder="执行科室"
              clearable
              filterable
              :filter-method="filterDeptMethod"
              class="hc-query-control"
            >
              <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
            <div class="hc-query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleDetailQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetDetailQuery">重置</el-button>
            </div>
          </div>
          <div class="hc-query-row hc-query-row--second">
            <el-date-picker
              v-model="detailQuery.beginChargeDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="计费日期起"
              clearable
              class="hc-query-control"
            />
            <el-date-picker
              v-model="detailQuery.endChargeDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="计费日期止"
              clearable
              class="hc-query-control"
            />
            <el-select
              v-model="detailQuery.processed"
              placeholder="是否处理"
              clearable
              class="hc-query-control"
            >
              <el-option label="已处理" value="Y" />
              <el-option label="未处理" value="N" />
            </el-select>
            <el-input
              v-model="detailQuery.itemName"
              placeholder="项目名称"
              clearable
              class="hc-query-control"
              @keyup.enter.native="handleDetailQuery"
            />
          </div>
        </el-form>
      </div>

      <el-row :gutter="0" class="list-toolbar hc-toolbar">
        <div class="list-toolbar-left">
          <el-button
            type="primary"
            size="small"
            class="spd-btn spd-btn--primary"
            v-hasPermi="['department:patientCharge:fetchInpatient', 'department:patientCharge:fetchOutpatient']"
            @click="openFetchDialog"
          >收费记录提取</el-button>
        </div>
        <div class="list-toolbar-right">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="loadDetailList" />
        </div>
      </el-row>

      <div class="apply-table-panel" ref="tablePanel">
    <el-table
      ref="detailTable"
      v-loading="detailLoading"
      :data="detailList"
      :height="mainTableHeight"
      border
      stripe
      row-key="id"
      class="apply-main-table"
      @selection-change="handleSelectionChange"
      @sort-change="handleDetailSortChange"
    >
      <el-table-column type="selection" width="55" align="center" fixed="left" class-name="apply-select-col" />
      <el-table-column label="序号" type="index" width="60" align="center" fixed="left" :index="detailRowIndex" />
      <el-table-column label="就诊类型" prop="visitType" width="90" align="center" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.visitType === 'INPATIENT' ? '住院' : '门诊' }}</span>
        </template>
      </el-table-column>
      <template v-if="detailVisitType === 'IN'">
        <el-table-column label="住院号" prop="inpatientNo" width="145" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="开单科室" prop="deptName" min-width="110" show-overflow-tooltip />
        <el-table-column label="执行科室" prop="execDeptName" min-width="110" show-overflow-tooltip />
      </template>
      <template v-else-if="detailVisitType === 'OUT'">
        <el-table-column label="门诊号" prop="outpatientNo" width="145" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="开单科室" prop="clinicName" min-width="110" show-overflow-tooltip />
        <el-table-column label="执行科室" prop="execDeptName" min-width="110" show-overflow-tooltip />
      </template>
      <template v-else>
        <el-table-column label="住院/门诊号" prop="visitNo" width="145" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
        <el-table-column label="开单科室" prop="deptDisplayName" min-width="110" show-overflow-tooltip />
        <el-table-column label="执行科室" prop="execDeptName" min-width="110" show-overflow-tooltip />
      </template>
      <el-table-column label="患者姓名" prop="patientName" width="110" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
      <el-table-column label="收费编码" prop="chargeItemId" width="130" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
      <el-table-column label="费用明细主键" prop="hisChargeId" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.hisChargeId || scope.row.hisInpatientChargeId || scope.row.hisOutpatientChargeId || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="项目名称" prop="itemName" min-width="180" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
      <el-table-column label="规格" prop="specModel" width="120" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
      <el-table-column label="数量" prop="quantity" width="90" align="center" show-overflow-tooltip />
      <el-table-column label="计费时间" prop="chargeDate" width="165" show-overflow-tooltip />
      <el-table-column label="下载时间" prop="createTime" width="165" show-overflow-tooltip />
      <el-table-column label="抓取记录" width="90" align="center">
        <template slot-scope="scope">
          <el-button
            type="text"
            size="small"
            class="hc-table-op-btn"
            v-hasPermi="['gz:highChargeScan:list','department:patientCharge:list']"
            @click="openFetchTraceDialog(scope.row)"
          >查看</el-button>
        </template>
      </el-table-column>
      <el-table-column label="金额" prop="totalAmount" width="110" align="right" show-overflow-tooltip sortable="custom" :sort-orders="['ascending', 'descending']" />
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
      <el-table-column label="操作" align="center" width="160" fixed="right" class-name="apply-action-col">
        <template slot-scope="scope">
          <el-button
            v-if="canScanHigh(scope.row)"
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

        <div class="apply-pagination-wrap apply-pager-bar">
          <div class="pagination-summary" />
          <pagination
            v-show="detailTotal > 0"
            :total="detailTotal"
            :page.sync="detailQuery.pageNum"
            :limit.sync="detailQuery.pageSize"
            @pagination="loadDetailList"
          />
        </div>
      </div>
    </div>

    <el-dialog :title="consumeRecordDialog.title" :visible.sync="consumeRecordDialog.visible" width="92%" append-to-body>
      <el-table v-loading="consumeRecordDialog.loading" :data="consumeRecordDialog.rows" border size="small" max-height="420" empty-text="暂无消耗记录">
        <el-table-column label="消耗单号" prop="consumeBillNo" min-width="178" show-overflow-tooltip />
        <el-table-column label="产品名称" prop="materialName" min-width="110" show-overflow-tooltip />
        <el-table-column label="规格" prop="materialSpeci" min-width="90" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.materialSpeci || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" prop="materialModel" min-width="90" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.materialModel || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" prop="unit" width="64" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.unit || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" prop="unitPrice" width="88" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatMoney(scope.row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="entryQty" width="80" align="right" />
        <el-table-column label="生产日期" prop="beginTime" width="108" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatDateOnly(scope.row.beginTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" prop="endTime" width="108" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatDateOnly(scope.row.endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" prop="batchNumber" min-width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.batchNumber || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="院内码/条码" prop="inHospitalCode" min-width="120" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="consumeRecordDialog.visible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="fetchTraceDialog.title" :visible.sync="fetchTraceDialog.visible" width="920px" append-to-body>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="mb8"
        :title="fetchTraceDialog.hint"
      />
      <el-table v-loading="fetchTraceDialog.loading" :data="fetchTraceDialog.rows" border size="small" max-height="420" empty-text="暂无相关抓取记录">
        <el-table-column label="抓取时间" prop="createTime" width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatDateTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" prop="chargeKind" width="72" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.chargeKind === 'OUTPATIENT' ? '门诊' : '住院' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="查询条件" prop="queryCondition" min-width="280" show-overflow-tooltip />
        <el-table-column label="新增" prop="insertedCount" width="70" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.insertedCount != null ? scope.row.insertedCount : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="跳过" prop="skippedCount" width="70" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.skippedCount != null ? scope.row.skippedCount : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="需核对" prop="driftCount" width="80" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.driftCount != null ? scope.row.driftCount : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="本条结果" width="110" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.downloadSuccess" type="success" size="mini">本条下载成功</el-tag>
            <span v-else>--</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="fetchTraceDialog.visible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <el-dialog title="高值计费扫码消耗" :visible.sync="highDialogVisible" width="960px" append-to-body @closed="resetHighDialog">
      <div v-if="highMirrorRow" class="mb8">
        <span>患者 {{ highMirrorRow.patientName }} · 计费数量 {{ highMirrorRow.quantity }}</span>
        <span v-if="highBillRemaining != null"> · 待核销数量 {{ highBillRemaining }}</span>
        <span v-else> · 待核销数量 {{ highMirrorRow.quantity }}</span>
      </div>
      <el-form v-if="highMirrorRow" :model="highConsumeForm" label-width="88px" size="small" class="hc-high-dept-form mb8">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="开单科室">
              <span class="hc-high-dept-text">{{ mirrorOrderingDeptName(highMirrorRow) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="执行科室">
              <span class="hc-high-dept-text">{{ mirrorExecDeptName(highMirrorRow) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="核销科室" required>
              <el-select
                v-model="highConsumeForm.consumeDepartmentId"
                placeholder="名称/编码/简拼"
                filterable
                :filter-method="filterConsumeDeptMethod"
                style="width:100%"
                @change="onHighConsumeDepartmentChange"
              >
                <el-option v-for="d in consumeDeptOptions" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-alert type="warning" :closable="false" show-icon class="mb8" title="须一次性核销全部待核销数量（可扫多条院内码，保存时合计须与待核销数量一致）；不支持部分核销；冲销后可再次核销。" />
      <el-input
        ref="highScanInput"
        v-model="highScanCode"
        class="high-scan-input-ime-off"
        placeholder="扫描院内码（扫码枪自动识别）；手工输入后按回车"
        autocomplete="off"
        spellcheck="false"
        clearable
        :disabled="!highConsumeForm.consumeDepartmentId"
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
        <el-table-column label="本次消耗" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.applyQty }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="removeHighLine(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="highDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="highSubmitting" :disabled="highLines.length === 0" @click="submitHighConsume">保存并审核</el-button>
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
        <el-button class="spd-btn spd-btn--secondary" @click="fetchDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="fetchSubmitting" @click="submitFetch">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { parseTime } from '@/utils/ruoyi'
import { checkPermi } from '@/utils/permission'
import {
  normalizeBarcodeInput,
  isImeProcessKey,
  isScannerEnterKey,
  isRapidScannerBurst
} from '@/utils/barcodeInput'
import { listDepartTenantOptionselect, listDepartOptionselect } from '@/api/foundation/depart'
import { normalizeDepartPickResponse, filterDepartPickList } from '@/utils/deptPick'
import { fetchInpatientMirror, fetchOutpatientMirror } from '@/api/department/patientCharge'
import {
  listHighChargeInpatientMirror,
  listHighChargeOutpatientMirror,
  listHighChargeAllMirror,
  listHighChargeConsumeRecords,
  listHighChargeFetchBatches,
  scanHighChargeBarcode,
  applyHighChargeConsume
} from '@/api/gz/highChargeScan'

function buildDefaultChargeDateRange() {
  const today = new Date()
  const endChargeDate = parseTime(today, '{y}-{m}-{d}')
  // 默认本月1日～今天，避免无起日扫全历史导致 list+count 超 2s
  const beginDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const beginChargeDate = parseTime(beginDate, '{y}-{m}-{d}')
  return { beginChargeDate, endChargeDate }
}

export default {
  // 须与菜单 path「highChargeScan」→ 路由 name「HighChargeScan」一致，keep-alive 才能保留查询条件
  name: 'HighChargeScan',
  data() {
    return {
      showSearch: true,
      mainTableHeight: 400,
      selectedRows: [],
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
        itemName: undefined,
        processed: undefined,
        sortField: undefined,
        sortOrder: undefined,
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
      highConsumeForm: {
        consumeDepartmentId: undefined
      },
      allConsumeDeptOptions: [],
      consumeDeptOptions: [],
      consumeRecordDialog: {
        visible: false,
        loading: false,
        title: '消耗记录',
        rows: []
      },
      fetchTraceDialog: {
        visible: false,
        loading: false,
        title: '抓取记录',
        hint: '',
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
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight())
    }
  },
  created() {
    this.loadDeptOptions()
    this.loadDetailList()
  },
  mounted() {
    this.$nextTick(() => {
      this.updateMainTableHeight()
      setTimeout(() => this.updateMainTableHeight(), 80)
      setTimeout(() => this.updateMainTableHeight(), 200)
    })
    window.addEventListener('resize', this.updateMainTableHeight)
  },
  activated() {
    // keep-alive 切回：仅重算表格高度，不重新拉数，保留查询条件与列表
    this.$nextTick(() => this.updateMainTableHeight())
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateMainTableHeight)
  },
  methods: {
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
      return this.formatAmount(n)
    },
    /** 明细框高度：底边对齐页面内容区底部（与高值核销确认一致） */
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel
      const root = this.$refs.pageRoot || this.$el
      if (!panel || !panel.getBoundingClientRect || !root || !root.getBoundingClientRect) return
      const panelTop = panel.getBoundingClientRect().top
      const targetBottom = root.getBoundingClientRect().bottom
      const pagEl = panel.querySelector('.apply-pagination-wrap')
      let pagH = pagEl ? pagEl.getBoundingClientRect().height : 52
      if (pagH < 40) pagH = 52
      const borderY =
        (parseFloat(window.getComputedStyle(panel).borderTopWidth) || 0) +
        (parseFloat(window.getComputedStyle(panel).borderBottomWidth) || 0)
      const next = Math.max(240, Math.floor(targetBottom - panelTop - pagH - borderY))
      if (Math.abs((this.mainTableHeight || 0) - next) >= 2) {
        this.mainTableHeight = next
      }
      this.$nextTick(() => {
        if (this.$refs.detailTable && this.$refs.detailTable.doLayout) {
          this.$refs.detailTable.doLayout()
        }
      })
    },
    detailRowIndex(index) {
      const page = Number(this.detailQuery.pageNum) || 1
      const size = Number(this.detailQuery.pageSize) || 10
      return (page - 1) * size + index + 1
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows || []
    },
    loadDeptOptions() {
      listDepartTenantOptionselect().then(res => {
        const list = normalizeDepartPickResponse(res).filter(d => d.hisId != null && String(d.hisId).trim() !== '')
        this.allDeptOptions = list
        this.deptOptions = list
      })
      listDepartOptionselect().then(res => {
        const list = normalizeDepartPickResponse(res)
        this.allConsumeDeptOptions = list
        this.consumeDeptOptions = list
      })
    },
    filterDeptMethod(query) {
      this.deptOptions = filterDepartPickList(this.allDeptOptions, query)
    },
    mirrorOrderingDeptName(row) {
      if (!row) return '--'
      if (row.visitType === 'INPATIENT') return row.deptName || '--'
      if (row.visitType === 'OUTPATIENT') return row.clinicName || '--'
      return row.deptDisplayName || row.deptName || row.clinicName || '--'
    },
    mirrorExecDeptName(row) {
      return (row && row.execDeptName) ? row.execDeptName : '--'
    },
    resolveDefaultConsumeDepartmentId(row) {
      if (!row || !row.execDeptId) return undefined
      const his = String(row.execDeptId).trim()
      const hit = this.allConsumeDeptOptions.find(d => d.hisId && String(d.hisId).trim() === his)
      return hit ? hit.id : undefined
    },
    onHighConsumeDepartmentChange() {
      if (this.highLines.length) {
        this.highLines = []
        this.highBillRemaining = null
        this.$modal.msgWarning('已切换核销科室，已清空扫码明细，请重新扫码')
      }
      if (this.highConsumeForm.consumeDepartmentId) {
        this.focusHighScanInput()
      }
    },
    filterConsumeDeptMethod(query) {
      this.consumeDeptOptions = filterDepartPickList(this.allConsumeDeptOptions, query)
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
      if (v === 'PARTIALLY_CONSUMED') return '部分核销(历史)'
      if (v === 'REFUNDED') return '已退费'
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
    formatHighApplySuccessMessage() {
      return '高值核销成功，本条计费已全部完成'
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
      if (!row || (row.valueLevel !== '1' && row.valueLevel !== 1)) {
        return false
      }
      if (row.processStatus === 'REFUNDED' || row.processStatus === 'PARTIALLY_CONSUMED') {
        return false
      }
      return row.processStatus === 'PENDING_CONSUME'
    },
    openHighDialog(row) {
      if (this.isLowValueLevel(row)) {
        this.$modal.msgWarning('该行为低值收费项（未维护高低值视同低值），请至患者收费查询进行低值核销')
        return
      }
      if (row.processStatus === 'CONSUMED') {
        this.$modal.msgWarning('该行已核销，如需再次核销请先冲销')
        return
      }
      if (row.processStatus === 'REFUNDED') {
        this.$modal.msgWarning('该行是退费记录，不可高值核销')
        return
      }
      if (row.processStatus === 'PARTIALLY_CONSUMED') {
        this.$modal.msgWarning('该行存在历史部分核销数据，请联系管理员处理')
        return
      }
      if (row.valueLevel !== '1' && row.valueLevel !== 1) {
        return
      }
      this.highMirrorRow = row
      this.highLines = []
      this.resetHighScanInputState()
      this.highBillRemaining = null
      this.highConsumeForm.consumeDepartmentId = this.resolveDefaultConsumeDepartmentId(row)
      this.consumeDeptOptions = this.allConsumeDeptOptions
      this.highDialogVisible = true
      this.$nextTick(() => {
        if (this.highConsumeForm.consumeDepartmentId && this.$refs.highScanInput && this.$refs.highScanInput.focus) {
          this.$refs.highScanInput.focus()
        }
      })
    },
    resetHighDialog() {
      this.clearHighScanAutoTimer()
      this.highMirrorRow = null
      this.highLines = []
      this.highConsumeForm.consumeDepartmentId = undefined
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
      if (!this.highConsumeForm.consumeDepartmentId) {
        this.$modal.msgWarning('请先选择核销科室')
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
        inHospitalCode: code,
        consumeDepartmentId: this.highConsumeForm.consumeDepartmentId
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
      if (!this.highConsumeForm.consumeDepartmentId) {
        this.$modal.msgWarning('请先选择核销科室')
        return
      }
      const target = this.highBillRemaining != null ? Number(this.highBillRemaining) : null
      if (target == null || isNaN(target) || target <= 0) {
        this.$modal.msgWarning('请先扫码以获取待核销数量')
        return
      }
      let sum = 0
      for (const ln of this.highLines) {
        if (ln.applyQty == null || Number(ln.applyQty) <= 0) {
          this.$modal.msgWarning('扫码明细数量无效，请重新扫码')
          return
        }
        if (Number(ln.applyQty) > Number(ln.maxApplyQty)) {
          this.$modal.msgWarning('本次消耗不能超过该行最大可消耗')
          return
        }
        sum += Number(ln.applyQty)
      }
      if (Math.abs(sum - target) > 1e-6) {
        this.$modal.msgWarning(`本次消耗合计 ${sum} 须与待核销数量 ${target} 一致，请继续扫码补齐或删除多余明细`)
        return
      }
      this.highSubmitting = true
      applyHighChargeConsume({
        visitKind: this.highMirrorRow.visitType || this.currentVisitKind,
        mirrorRowId: this.highMirrorRow.id,
        consumeDepartmentId: this.highConsumeForm.consumeDepartmentId,
        lines: this.highLines.map(l => ({ gzDepInventoryId: l.gzDepInventoryId, qty: l.applyQty }))
      }).then(() => {
        this.$modal.msgSuccess(this.formatHighApplySuccessMessage())
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
    openFetchTraceDialog(row) {
      if (!row || !row.id) return
      const vk = row.visitType === 'OUTPATIENT' ? 'OUTPATIENT' : 'INPATIENT'
      const chargeAt = this.formatDateTime(row.chargeDate)
      const downloadAt = this.formatDateTime(row.createTime)
      this.fetchTraceDialog.title = `抓取记录 · ${row.patientName || ''} · 收费项 ${row.chargeItemId || ''}`
      this.fetchTraceDialog.hint = `计费时间 ${chargeAt}，下载时间 ${downloadAt}。下列为相关抓取；标记「本条下载成功」的是写入本条的那一次。`
      this.fetchTraceDialog.visible = true
      this.fetchTraceDialog.loading = true
      this.fetchTraceDialog.rows = []
      listHighChargeFetchBatches(vk, row.id).then(res => {
        this.fetchTraceDialog.rows = res.data || []
      }).finally(() => {
        this.fetchTraceDialog.loading = false
      })
    },
    handleDetailQuery() {
      this.detailQuery.pageNum = 1
      if (!this.detailQuery.beginChargeDate && this.detailQuery.endChargeDate) {
        const end = new Date(String(this.detailQuery.endChargeDate).replace(/-/g, '/'))
        if (!isNaN(end.getTime())) {
          this.detailQuery.beginChargeDate = parseTime(new Date(end.getFullYear(), end.getMonth(), 1), '{y}-{m}-{d}')
        } else {
          Object.assign(this.detailQuery, buildDefaultChargeDateRange())
        }
      }
      this.loadDetailList()
    },
    onDetailVisitTypeChange() {
      this.detailQuery.sortField = undefined
      this.detailQuery.sortOrder = undefined
      this.handleDetailQuery()
    },
    handleDetailSortChange({ prop, order }) {
      this.detailQuery.sortField = order ? prop : undefined
      this.detailQuery.sortOrder = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : undefined
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
        itemName: undefined,
        processed: undefined,
        sortField: undefined,
        sortOrder: undefined,
        ...buildDefaultChargeDateRange()
      }
      this.loadDetailList()
    },
    loadDetailList() {
      if (!this.detailQuery.beginChargeDate && this.detailQuery.endChargeDate) {
        const end = new Date(String(this.detailQuery.endChargeDate).replace(/-/g, '/'))
        if (!isNaN(end.getTime())) {
          this.detailQuery.beginChargeDate = parseTime(new Date(end.getFullYear(), end.getMonth(), 1), '{y}-{m}-{d}')
        } else {
          Object.assign(this.detailQuery, buildDefaultChargeDateRange())
        }
      }
      this.detailLoading = true
      const q = { ...this.detailQuery }
      q.beginChargeDate = this.toQueryDayStart(q.beginChargeDate)
      q.endChargeDate = this.toQueryDayEnd(q.endChargeDate)
      const done = () => {
        this.detailLoading = false
        this.$nextTick(() => this.updateMainTableHeight())
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

.hc-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
  gap: 4px;
}

.high-charge-scan-page .hc-main > .list-query-panel,
.high-charge-scan-page .hc-main > .hc-toolbar,
.high-charge-scan-page .hc-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.high-charge-scan-page .hc-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.hc-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.hc-query-row--second {
  margin-top: 8px;
}

.hc-query-type-group {
  flex-shrink: 0;
}

.hc-query-type-group ::v-deep .el-radio-button__inner {
  padding: 8px 14px;
}

.hc-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.hc-query-control.el-select,
.hc-query-control.el-input,
.hc-query-control.el-date-editor {
  width: 160px !important;
}

.hc-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.apply-table-panel {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0 !important;
  background: #fff !important;
  border: 1px solid #e8ecf1 !important;
  border-radius: 10px !important;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05) !important;
  overflow: hidden;
  height: auto !important;
  width: 100%;
  box-sizing: border-box;
}

.apply-table-panel > .apply-main-table {
  flex: 0 0 auto;
  min-height: 0;
  margin-bottom: 0 !important;
  border-radius: 0;
  box-shadow: none;
}

.apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 12px 14px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.apply-pagination-wrap ::v-deep .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 0 0 auto !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  overflow: visible !important;
}

.apply-pagination-wrap ::v-deep .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
  margin: 0 !important;
}

.high-charge-scan-page .apply-main-table.el-table {
  position: relative;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

/* 固定列抬高，横向滚动条露在固定列之上可拖拽 */
.high-charge-scan-page .apply-main-table ::v-deep .el-table__fixed,
.high-charge-scan-page .apply-main-table ::v-deep .el-table__fixed-right {
  height: auto !important;
  bottom: 12px !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__fixed-right-patch {
  background-color: transparent !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.high-charge-scan-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.high-charge-scan-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.high-charge-scan-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.high-charge-scan-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.high-charge-scan-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.high-charge-scan-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.high-charge-scan-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell {
  background-color: #D6EBFF !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.high-charge-scan-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
}

.hc-writeoff-done {
  color: #67c23a;
  font-weight: 500;
}
.hc-writeoff-partial {
  color: #e6a23c;
  font-weight: 500;
}
.hc-writeoff-pending {
  color: #f56c6c;
  font-weight: 500;
}
.hc-table-op-btn {
  font-size: 14px;
  padding: 0 6px;
}
.hc-high-dept-text {
  line-height: 32px;
  color: #606266;
}
</style>

<style>
.app-container.high-charge-scan-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.high-charge-scan-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.high-charge-scan-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}
</style>
