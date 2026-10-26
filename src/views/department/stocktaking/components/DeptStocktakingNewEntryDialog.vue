<template>
    <el-dialog
      custom-class="profit-pending-dialog"
      title="新增盘盈明细信息"
      :visible.sync="newEntryDialogVisible"
      width="1080px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-table :data="pendingNewEntries" border size="small" v-loading="profitNameSpecStockLoading">
        <el-table-column label="产品编码" width="120" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '--' }}</template>
        </el-table-column>
        <el-table-column label="规格" min-width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" width="80" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName ? scope.row.material.fdUnit.unitName : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.unitPrice" type="number" placeholder="请输入单价" @input="priceChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="盘点数量" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.stockQty" type="number" placeholder="请输入盘点数量" @input="stockQtyChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="当前库存" width="110" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatProfitNameSpecStockQty(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" min-width="340" width="360">
          <template slot-scope="scope">
            <div class="profit-batch-cell">
              <el-input
                v-model="scope.row.batchNumber"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 14 }"
                :disabled="scope.row._batchLocked"
                placeholder="请输入批号"
                class="profit-batch-textarea"
                @input="onProfitBatchNumberInput(scope.row)"
              />
              <div class="profit-batch-checks">
                <el-checkbox v-model="scope.row._cbBatchNone" @change="() => profitBatchNoneChange(scope.row)">无</el-checkbox>
                <el-checkbox v-model="scope.row._cbBatchUnknown" @change="() => profitBatchUnknownChange(scope.row)">未知</el-checkbox>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="240">
          <template slot-scope="scope">
            <div class="profit-expiry-cell">
              <el-date-picker
                v-model="scope.row.endTime"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择"
                :disabled="scope.row._longTerm"
                style="width: 150px"
                @change="onProfitExpiryManualChange(scope.row)"
              />
              <el-checkbox v-model="scope.row._longTerm" @change="profitLongTermChange(scope.row)">长期</el-checkbox>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="生产日期" min-width="140">
          <template slot-scope="scope">
            <el-date-picker v-model="scope.row.beginTime" type="date" value-format="yyyy-MM-dd" placeholder="可不填" />
          </template>
        </el-table-column>
        <el-table-column label="归属仓库" min-width="180">
          <template slot-scope="scope">
            <SelectWarehouse v-model="scope.row.returnWarehouseId" finance-pick-mode placeholder="请选择仓库" />
          </template>
        </el-table-column>
        <el-table-column label="供应商" min-width="220">
          <template slot-scope="scope">
            <template v-if="profitEntryMaterialMissingSupplier(scope.row)">
              <SelectSupplier
                :value="scope.row.supplierId"
                finance-pick-mode
                placeholder="请选择供应商"
                style="width: 100%"
                @input="(v) => $set(scope.row, 'supplierId', v)"
              />
            </template>
            <span v-else>{{
              (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) ||
                scope.row._supplierName ||
                '--'
            }}</span>
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
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'

export default {
  name: 'DeptStocktakingNewEntryDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DeptStocktaking')],
  components: { SelectWarehouse, SelectSupplier },
  inheritAttrs: false
}
</script>
