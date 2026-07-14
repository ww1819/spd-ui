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
          <el-form-item label="项目名称">
            <el-input
              v-model="detailQuery.itemName"
              placeholder="项目名称模糊"
              clearable
              style="width:180px"
              @keyup.enter.native="handleDetailQuery"
            />
          </el-form-item>
          <el-form-item label="执行科室">
            <el-input
              v-model="detailQuery.execDeptName"
              placeholder="编码/名称/简码"
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
              :disabled="detailVisitType === 'ALL' || batchLowSubmitting"
              :loading="batchLowSubmitting"
              v-hasPermi="['department:patientCharge:generateConsume','department:patientCharge:processMirrorLow']"
              @click="openBatchLowDialog"
            >批量低值核销</el-button>
            <span v-if="cachedSelectionCount > 0" class="pc-cached-sel-hint">已跨页勾选 {{ cachedSelectionCount }} 条</span>
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
          :row-key="getDetailRowKey"
          height="60vh"
          border
          stripe
          class="pc-detail-table"
          @selection-change="onDetailSelectionChange"
        >
          <el-table-column type="selection" width="48" align="center" :reserve-selection="true" :selectable="row => canProcessLow(row)" />
          <el-table-column label="类型" prop="visitType" width="80">
            <template slot-scope="scope">
              <span>{{ scope.row.visitType === 'INPATIENT' ? '住院' : '门诊' }}</span>
            </template>
          </el-table-column>
          <template v-if="detailVisitType === 'IN'">
            <el-table-column label="住院号" prop="inpatientNo" width="120" show-overflow-tooltip />
          </template>
          <template v-else-if="detailVisitType === 'OUT'">
            <el-table-column label="门诊号" prop="outpatientNo" width="120" show-overflow-tooltip />
          </template>
          <template v-else>
            <el-table-column label="号" prop="visitNo" width="120" show-overflow-tooltip />
          </template>
          <el-table-column label="开单科室编码" min-width="100" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ orderDeptCode(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="开单科室" min-width="220" class-name="pc-dept-name-col">
            <template slot-scope="scope">
              <div class="pc-dept-name-wrap">{{ orderDeptName(scope.row) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="执行科室编码" prop="execDeptId" min-width="100" show-overflow-tooltip />
          <el-table-column label="执行科室" min-width="220" class-name="pc-dept-name-col">
            <template slot-scope="scope">
              <div class="pc-dept-name-wrap">{{ scope.row.execDeptName || '' }}</div>
            </template>
          </el-table-column>
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
          <el-table-column label="操作" align="center" width="300" fixed="right">
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
        <el-table-column label="核销科室编码" prop="writeOffDeptCode" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.writeOffDeptCode || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="核销科室" prop="writeOffDeptName" min-width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.writeOffDeptName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材名称" prop="materialName" min-width="110" show-overflow-tooltip />
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
        <el-table-column label="数量" prop="entryQty" width="80" align="right" show-overflow-tooltip />
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
        <el-table-column label="金额" prop="amt" width="96" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatMoney(scope.row.amt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" prop="batchNo" min-width="200" show-overflow-tooltip />
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
    <el-dialog title="自选科室核销" :visible.sync="selfDeptLowDialog.visible" width="480px" append-to-body @close="resetSelfDeptLowDialog">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="mb8"
        title="请使用「自选科室核销」并选择库存所在科室（看编码，勿点普通「低值」）。同名科室可能编码不同：库存为 487 的「二科」与执行科室对照的其它呼吸危重症科室不是同一科室。"
      />
      <el-form label-width="100px" size="small">
        <el-form-item label="执行科室">
          <span>{{ selfDeptLowDialog.execDeptText || '--' }}</span>
        </el-form-item>
        <el-form-item label="核销科室" required>
          <SelectDepartment
            v-model="selfDeptLowDialog.consumeDepartmentId"
            field-placeholder="编码/名称/简码（请核对该编码与库存一致，如 487）"
            :show-code-in-label="true"
            :finance-pick-mode="true"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="selfDeptLowDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="selfDeptLowDialog.submitting" @click="submitSelfDeptLowConsume">确 定</el-button>
      </div>
    </el-dialog>
    <el-dialog title="批量低值核销" :visible.sync="batchLowDialog.visible" width="520px" append-to-body>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="mb8"
        title="请选择核销范围。并发下同一条只能被一名用户核销成功，另一人将提示「正在核销或已被他人处理」。"
      />
      <el-radio-group v-model="batchLowDialog.scope" class="pc-batch-scope">
        <el-radio label="SELECTED">已勾选记录（跨页 {{ cachedSelectionCount }} 条）</el-radio>
        <el-radio label="QUERY">当前查询条件下全部待处理低值结果</el-radio>
      </el-radio-group>
      <p class="pc-batch-tip">「全部」将按当前筛选条件分页收集待处理低值明细后再核销，条数多时可能较久。</p>
      <p class="pc-batch-tip">开始核销前：若已设计费日期且有权限，将按该区间自动「补全执行科室」（仅回写本地为空且 HIS 有值的行），再逐条核销。</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="batchLowDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="batchLowSubmitting" @click="confirmBatchLowProcess">开始核销</el-button>
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
import { fetchFinancePickDepartments } from '@/api/finance/settlementSummary'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

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
  components: { SelectDepartment },
  data() {
    return {
      patientChargeHisSlowHint: PATIENT_CHARGE_HIS_SLOW_HINT,
      activeMainTab: 'detail',
      detailVisitType: 'IN',
      detailLoading: false,
      detailList: [],
      detailTotal: 0,
      detailSelection: [],
      /** 跨页勾选缓存：key = visitType:id */
      detailSelectionCache: Object.create(null),
      detailSelectionSyncing: false,
      batchLowSubmitting: false,
      batchLowDialog: {
        visible: false,
        scope: 'SELECTED'
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
        title: '消耗记录',
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
    this.$nextTick(() => this.layoutDetailTable())
  },
  methods: {
    layoutDetailTable() {
      const table = this.$refs.detailTable
      if (table && table.doLayout) {
        table.doLayout()
      }
    },
    orderDeptCode(row) {
      if (!row) return ''
      return row.deptCode || row.clinicCode || ''
    },
    orderDeptName(row) {
      if (!row) return ''
      return row.deptName || row.clinicName || row.deptDisplayName || ''
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
      if (list.length === 0) {
        // 稳定态下用户取消本页全部勾选：只移除本页 cache，保留其它页
        ;(this.detailList || []).forEach(r => {
          const k = this.selectionCacheKey(r)
          if (k && this.detailSelectionCache[k]) this.$delete(this.detailSelectionCache, k)
        })
        return
      }
      // reserve-selection 时 rows 含跨页已选；本页未出现在 rows 中的视为取消
      const next = Object.create(null)
      Object.keys(this.detailSelectionCache).forEach(k => {
        const onPage = (this.detailList || []).some(r => this.selectionCacheKey(r) === k)
        if (!onPage) next[k] = this.detailSelectionCache[k]
      })
      list.forEach(r => {
        const k = this.selectionCacheKey(r)
        if (!k || !this.canProcessLow(r)) return
        next[k] = { id: String(r.id), visitType: r.visitType || this.currentVisitKind }
      })
      this.detailSelectionCache = next
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
          })
        })
      }
    },
    clearDetailSelectionCache() {
      this.detailSelectionCache = Object.create(null)
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
      this.clearDetailSelectionCache()
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
        itemName: undefined,
        execDeptName: undefined,
        processed: undefined,
        ...buildDefaultChargeDateRange(),
        beginProcessTime: undefined,
        endProcessTime: undefined
      }
      this.clearDetailSelectionCache()
      this.loadDetailList()
    },
    loadDetailList() {
      // 换页换数前先锁住 selection 回调，避免 data 替换瞬间的 [] 误清跨页 cache
      this.detailSelectionSyncing = true
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
          this.$nextTick(() => {
            this.restoreDetailSelection()
            this.layoutDetailTable()
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
            this.layoutDetailTable()
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
            this.layoutDetailTable()
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
      }).catch(() => {}).finally(() => {
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
    async confirmBatchLowProcess() {
      if (this.detailVisitType === 'ALL' || !this.currentVisitKind) {
        this.$modal.msgWarning('“全部”模式下批量低值核销请先切换到住院或门诊后分别执行')
        return
      }
      let ids = []
      try {
        if (this.batchLowDialog.scope === 'SELECTED') {
          ids = Object.values(this.detailSelectionCache).map(x => x.id).filter(Boolean)
          if (!ids.length) {
            this.$modal.msgWarning('请先勾选待处理的低值计费明细（支持跨页勾选）')
            return
          }
        } else {
          this.batchLowSubmitting = true
          ids = await this.collectQueryablePendingLowIds()
          if (!ids.length) {
            this.$modal.msgWarning('当前查询条件下没有可低值核销的待处理明细')
            this.batchLowSubmitting = false
            return
          }
        }
      } catch (e) {
        this.batchLowSubmitting = false
        return
      }
      this.batchLowDialog.visible = false
      const scopeText = this.batchLowDialog.scope === 'SELECTED' ? '已勾选' : '查询结果'
      this.$modal
        .confirm(
          `将对${scopeText}共 ${ids.length} 条：先按计费日期自动补全空执行科室（有权限时），再逐条低值核销；单条失败不影响其它条。是否继续？`
        )
        .then(async () => {
          this.batchLowSubmitting = true
          try {
            await this.ensureExecDeptBeforeBatchLow()
          } catch (e) {
            if (e === 'cancel' || (e && e.message === 'cancel')) {
              return
            }
            const cont = await this.$modal
              .confirm(
                formatHisChargeSlowError(e, {
                  timeoutMsg: '补全执行科室失败或超时。是否仍继续核销（缺执行科室的记录可能失败）？'
                })
              )
              .then(() => true)
              .catch(() => false)
            if (!cont) {
              return
            }
          }
          return processMirrorLowValueBatch({ visitKind: this.currentVisitKind, mirrorRowIds: ids })
        })
        .then(res => {
          if (!res) return
          const d = res.data || {}
          const ok = d.successCount != null ? d.successCount : 0
          const fail = d.failCount != null ? d.failCount : 0
          const lines = (d.failMessages || []).slice(0, 8)
          let extra = lines.length ? `；失败示例：${lines.join('；')}` : ''
          if ((d.failMessages || []).length > lines.length) {
            extra += '…'
          }
          this.$modal.msgSuccess(`完成：成功 ${ok} 条，失败 ${fail} 条${extra}`)
          this.clearDetailSelectionCache()
          this.handleDetailQuery()
        })
        .catch(() => {})
        .finally(() => {
          this.batchLowSubmitting = false
        })
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
    async collectQueryablePendingLowIds() {
      const pageSize = 200
      let pageNum = 1
      const ids = []
      const maxPages = 100
      while (pageNum <= maxPages) {
        const q = { ...this.detailQuery, pageNum, pageSize, processed: 'N' }
        q.beginChargeDate = this.toQueryDayStart(q.beginChargeDate)
        q.endChargeDate = this.toQueryDayEnd(q.endChargeDate)
        q.beginProcessTime = this.toQueryDayStart(q.beginProcessTime)
        q.endProcessTime = this.toQueryDayEnd(q.endProcessTime)
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
            if (this.canProcessLow(row)) ids.push(r.id)
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
            if (this.canProcessLow(row)) ids.push(r.id)
          })
        }
        const got = (res && res.rows) ? res.rows.length : 0
        if (got < pageSize) break
        pageNum += 1
      }
      return ids
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

.patient-charge-page .pc-detail-table >>> .pc-dept-name-col .cell {
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}

.patient-charge-page .pc-dept-name-wrap {
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
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
