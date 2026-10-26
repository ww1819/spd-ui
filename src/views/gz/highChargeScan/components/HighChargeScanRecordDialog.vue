<template>
    <el-dialog :title="consumeRecordDialog.title" :visible.sync="consumeRecordDialog.visible" width="92%" append-to-body>
      <el-table v-loading="consumeRecordDialog.loading" :data="consumeRecordDialog.rows" border size="small" max-height="420" empty-text="暂无消耗记录">
        <el-table-column label="类型" width="88" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.recordType === 'REVERSE' || scope.row.reverseFlag === 1" type="warning" size="mini">冲销</el-tag>
            <el-tag v-else type="success" size="mini">消耗</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="消耗单号" prop="consumeBillNo" min-width="178" show-overflow-tooltip />
        <el-table-column label="冲销原单" prop="reverseOfBillNo" min-width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.reverseOfBillNo || '--' }}</span>
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
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HighChargeScanRecordDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HighChargeScan')],
  inheritAttrs: false
}
</script>
