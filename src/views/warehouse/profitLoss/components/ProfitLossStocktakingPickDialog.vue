<template>
    <el-dialog
      title="引入盘点单"
      :visible.sync="stocktakingPickVisible"
      width="920px"
      append-to-body
      :close-on-click-modal="false"
      @open="handleStocktakingPickDialogOpen"
    >
      <el-form :model="stocktakingPickQuery" ref="stocktakingPickForm" size="small" :inline="true" label-width="80px">
        <el-form-item label="业务单号" prop="stockNo">
          <el-input v-model="stocktakingPickQuery.stockNo" placeholder="业务单号" clearable style="width: 180px" @keyup.enter.native="searchStocktakingPickList" />
        </el-form-item>
        <el-form-item label="仓库" prop="warehouseId">
          <div class="query-select-wrapper">
            <SelectWarehouse v-model="stocktakingPickQuery.warehouseId" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="searchStocktakingPickList">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetStocktakingPickQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table
        v-loading="stocktakingPickLoading"
        :data="stocktakingPickList"
        highlight-current-row
        border
        stripe
        height="360px"
        @current-change="handleStocktakingPickCurrentChange"
      >
        <el-table-column label="业务单号" align="center" prop="stockNo" min-width="160" show-overflow-tooltip />
        <el-table-column label="仓库" align="center" prop="warehouse.name" min-width="120" show-overflow-tooltip />
        <el-table-column label="制单日期" align="center" prop="stockDate" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核日期" align="center" prop="auditDate" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatNum(scope.row.profitAmount) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        :total="stocktakingPickTotal"
        :page.sync="stocktakingPickQuery.pageNum"
        :limit.sync="stocktakingPickQuery.pageSize"
        @pagination="searchStocktakingPickList"
      />
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="stocktakingPickVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :disabled="!stocktakingPickSelected" :loading="loadDraftLoading" @click="confirmStocktakingPick">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'ProfitLossStocktakingPickDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'ProfitLoss')],
  components: { SelectWarehouse },
  inheritAttrs: false
}
</script>
