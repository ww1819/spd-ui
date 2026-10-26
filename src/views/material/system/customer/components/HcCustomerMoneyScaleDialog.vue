<template>
    <el-dialog title="金额小数位设置" :visible.sync="openMoneyScale" width="720px" append-to-body @open="loadMoneyScaleAudits">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px"
        title="仅影响显示/打印/导出；审核通过后租户重新登录生效。允许自审。入库精度不变。" />
      <el-form ref="moneyScaleForm" :model="moneyScaleForm" label-width="120px" size="small">
        <el-form-item label="客户">{{ moneyScaleForm.customerName }}</el-form-item>
        <el-form-item label="当前生效">
          单价 {{ moneyScaleForm.currentPrice }} 位 / 金额 {{ moneyScaleForm.currentAmount }} 位 /
          {{ moneyScaleForm.currentRoundMode || 'HALF_UP' }}
        </el-form-item>
        <el-form-item label="单价小数位" required>
          <el-input-number v-model="moneyScaleForm.priceDecimalPlaces" :min="0" :max="6" />
        </el-form-item>
        <el-form-item label="金额小数位" required>
          <el-input-number v-model="moneyScaleForm.amountDecimalPlaces" :min="0" :max="6" />
        </el-form-item>
        <el-form-item label="舍入规则">
          <el-select v-model="moneyScaleForm.moneyRoundMode" style="width: 220px">
            <el-option label="四舍五入 (HALF_UP)" value="HALF_UP" />
            <el-option label="银行家舍入 (HALF_EVEN)" value="HALF_EVEN" />
            <el-option label="截断 (DOWN)" value="DOWN" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请说明">
          <el-input v-model="moneyScaleForm.applyRemark" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 8px">
        <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitMoneyScaleForm">提交审核</el-button>
      </div>
      <el-table :data="moneyScaleAuditList" size="mini" border max-height="280">
        <el-table-column label="申请时间" width="150" align="center">
          <template slot-scope="scope">{{ parseTime(scope.row.applyTime) }}</template>
        </el-table-column>
        <el-table-column label="单价位" prop="priceDecimalPlaces" width="70" align="center" />
        <el-table-column label="金额位" prop="amountDecimalPlaces" width="70" align="center" />
        <el-table-column label="舍入" prop="moneyRoundMode" width="100" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.auditStatus === '0'" type="warning">待审</el-tag>
            <el-tag v-else-if="scope.row.auditStatus === '1'" type="success">通过</el-tag>
            <el-tag v-else type="info">驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请人" prop="applyBy" width="90" show-overflow-tooltip />
        <el-table-column label="操作" width="140" align="center">
          <template slot-scope="scope">
            <template v-if="scope.row.auditStatus === '0'">
              <el-button type="text" size="mini" @click="approveMoneyScaleRow(scope.row)">通过</el-button>
              <el-button type="text" size="mini" @click="rejectMoneyScaleRow(scope.row)">驳回</el-button>
            </template>
            <span v-else>{{ scope.row.auditBy || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="openMoneyScale = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcCustomerMoneyScaleDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomer')],
  inheritAttrs: false
}
</script>
