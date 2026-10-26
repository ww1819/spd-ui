<template>
    <el-dialog
      title="审核前确认（明细库存与仓库实物不一致）"
      :visible.sync="whAuditQtyMismatchVisible"
      width="980px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 8px; color: #e6a23c;">
        以下明细账面库存与当前仓库库存不一致，请逐条确认盘点数量后再审核。
      </div>
      <el-table :data="qtyMismatchAuditList" border size="small">
        <el-table-column label="耗材" prop="materialName" min-width="150" />
        <el-table-column label="批次号" prop="batchNo" min-width="150" />
        <el-table-column label="明细账面数量" prop="detailQty" width="140" />
        <el-table-column label="当前仓库库存" prop="currentQty" width="140" />
        <el-table-column label="盘点数量" min-width="140">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.adjustedStockQty"
              type="number"
              :disabled="scope.row.confirmed"
              placeholder="盘点数量"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="confirmWhAuditMismatchRow(scope.row)">{{ scope.row.confirmed ? '已确定' : '确定' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="whAuditQtyMismatchVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmWhAuditQtyMismatchAndAudit">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'StocktakingProfitAuditConfirmDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InStocktaking' && vm.$el && vm.$el.classList && vm.$el.classList.contains('stocktaking-profit-page'))],
  inheritAttrs: false
}
</script>
