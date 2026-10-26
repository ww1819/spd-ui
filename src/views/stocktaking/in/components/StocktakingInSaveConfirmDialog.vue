<template>
    <el-dialog
      title="保存前确认（明细库存与仓库实物不一致）"
      :visible.sync="saveQtyConfirmVisible"
      width="1020px"
      append-to-body
      :close-on-click-modal="false"
      v-loading="saveQtyConfirmLoading"
    >
      <div style="margin-bottom: 8px; color: #e6a23c;">
        以下明细「账面数量(qty)」与当前仓库库存不一致，请逐条点击「确定」确认；确认后将把明细账面更新为当前仓库数量，并重新计算金额。「盈亏数量」= 盘点数量 − 明细账面（第一列）。普通盘盈/盘亏（仅盘点与账面不同、但与仓库实时库存一致）不会进入本表。
      </div>
      <el-table :data="saveQtyConfirmList" border size="small">
        <el-table-column label="产品编码" width="120" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.material && scope.row.material.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="规格" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" width="72" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName ? scope.row.material.fdUnit.unitName : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" prop="batchNo" min-width="140" />
        <el-table-column label="明细账面数量" prop="detailQty" width="120" align="center" />
        <el-table-column label="当前仓库库存" prop="currentQty" width="120" align="center" />
        <el-table-column label="盘点数量" min-width="100" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.adjustedStockQty != null && scope.row.adjustedStockQty !== '' ? scope.row.adjustedStockQty : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盈亏数量" width="120">
          <template slot-scope="scope">
            <span>{{ formatWhSaveConfirmProfitQty(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="confirmWhSaveQtyRow(scope.row)">{{ scope.row.confirmed ? '已确定' : '确定' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="saveQtyConfirmVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmWhSaveQtyAndSubmit">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'StocktakingInSaveConfirmDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InStocktaking' && vm.$el && vm.$el.classList && vm.$el.classList.contains('stocktaking-in-page'))],
  inheritAttrs: false
}
</script>
