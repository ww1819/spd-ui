<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact profit-loss-modal-head-form" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="billStatus" class="head-label-nowrap">
                      <el-input :value="billStatusLabel" :disabled="true" placeholder="单据状态" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="盈亏单号" prop="billNo" class="form-item-header-billno head-label-nowrap">
                      <el-input v-model="form.billNo" placeholder="保存后自动生成" :disabled="true" :title="form.billNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="盘点单号" prop="stocktakingNo" class="form-item-header-billno head-label-nowrap">
                      <el-input v-model="form.stocktakingNo" :disabled="true" :title="form.stocktakingNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="head-label-nowrap">
                      <el-input :value="warehouseDisplayName" :disabled="true" placeholder="仓库" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">盈亏明细信息</span>
                  <el-button
                    v-if="detailEditable && !form.id"
                    type="primary"
                    icon="el-icon-connection"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="openStocktakingPickDialog"
                  >引入盘点单</el-button>
                  <el-button
                    v-if="detailEditable && entryFullList.length"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    icon="el-icon-check"
                    @click="submitForm"
                    :loading="submitLoading"
                  >保 存</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    ref="profitLossEntryTable"
                    class="profit-loss-detail-table apply-detail-table"
                    :data="entryFullList"
                    :row-class-name="applyDetailRowClassName"
                    :height="detailTableHeight"
                    border
                    show-summary
                    :summary-method="getEntrySummaries"
                  >
                    <el-table-column label="序号" align="center" header-align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable />
                    <el-table-column label="产品编码" align="center" header-align="center" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="产品名称" align="left" header-align="center" min-width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批次号" align="center" header-align="center" prop="batchNo" width="120" show-overflow-tooltip resizable />
                    <el-table-column label="当前库存" align="center" header-align="center" prop="bookQty" width="95" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.bookQty) }}</template>
                    </el-table-column>
                    <el-table-column label="盘点库存" align="center" header-align="center" prop="stockQty" width="95" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.stockQty) }}</template>
                    </el-table-column>
                    <el-table-column label="盈亏数量" align="center" header-align="center" prop="profitQty" width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span :style="{ color: scope.row.profitQty > 0 ? '#67c23a' : scope.row.profitQty < 0 ? '#f56c6c' : '' }">{{ formatNum(scope.row.profitQty) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单价" align="right" header-align="center" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.unitPrice) }}</template>
                    </el-table-column>
                    <el-table-column label="盈亏金额" align="right" header-align="center" prop="profitAmount" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.profitAmount) }}</template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'ProfitLossEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'ProfitLoss')],
  inheritAttrs: false
}
</script>
