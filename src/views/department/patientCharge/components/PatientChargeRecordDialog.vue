<template>
    <el-dialog :title="consumeRecordDialog.title" :visible.sync="consumeRecordDialog.visible" width="92%" append-to-body class="consume-record-dialog">
      <el-tabs v-model="consumeRecordDialog.activeTab">
        <el-tab-pane label="核销操作" name="process">
          <el-table
            v-loading="consumeRecordDialog.processLogLoading"
            :data="consumeRecordDialog.processLogRows"
            border
            size="small"
            max-height="420"
            empty-text="暂无核销操作记录"
          >
            <el-table-column label="时间" prop="processTime" width="158" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ formatDateTime(scope.row.processTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="88" align="center">
              <template slot-scope="scope">
                <span>{{ processLogOperationText(scope.row.operation) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="结果" width="72" align="center">
              <template slot-scope="scope">
                <span :class="scope.row.outcome === 'FAIL' ? 'pc-process-fail' : 'pc-process-ok'">{{ processLogOutcomeText(scope.row.outcome) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="处理方" prop="processParty" width="88" show-overflow-tooltip />
            <el-table-column label="操作人" prop="processBy" width="100" show-overflow-tooltip />
            <el-table-column label="说明/失败原因" prop="situation" min-width="260" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="消耗明细" name="consume">
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
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="consumeRecordDialog.visible = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PatientChargeRecordDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PatientChargeHis')],
  inheritAttrs: false
}
</script>
