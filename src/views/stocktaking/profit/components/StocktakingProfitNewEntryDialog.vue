<template>
    <el-dialog
      title="新增盘盈明细信息"
      :visible.sync="newEntryDialogVisible"
      width="1000px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-table :data="pendingNewEntries" border size="small">
        <el-table-column label="产品名称" min-width="150">
          <template slot-scope="scope">{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '--' }}</template>
        </el-table-column>
        <el-table-column label="规格" min-width="120">
          <template slot-scope="scope">{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '--' }}</template>
        </el-table-column>
        <el-table-column label="盘点数量" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.stockQty" type="number" @input="stockQtyChangePending(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="批号" min-width="140">
          <template slot-scope="scope">
            <el-input v-model="scope.row.batchNumber" placeholder="批号" />
          </template>
        </el-table-column>
        <el-table-column label="生产日期" min-width="160">
          <template slot-scope="scope">
            <el-date-picker
              v-model="scope.row.beginTime"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="生产日期"
              clearable
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="160">
          <template slot-scope="scope">
            <el-date-picker v-model="scope.row.endTime" type="date" value-format="yyyy-MM-dd" placeholder="有效期" />
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="cancelPendingNewEntries">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmPendingNewEntries">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'StocktakingProfitNewEntryDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InStocktaking' && vm.$el && vm.$el.classList && vm.$el.classList.contains('stocktaking-profit-page'))],
  inheritAttrs: false
}
</script>
