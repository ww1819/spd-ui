<template>
    <!-- 添加或修改盘点对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact stocktaking-modal-head-form" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="stockStatus" class="apply-modal-label-required">
                      <el-input :value="stockStatusLabel" :disabled="true" placeholder="单据状态" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="业务单号" prop="stockNo" class="form-item-header-billno">
                      <el-input v-model="form.stockNo" placeholder="业务单号" :disabled="true" :title="form.stockNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse v-model="form.warehouseId" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="stockDate" class="apply-modal-label-required">
                      <el-date-picker clearable
                                      v-model="form.stockDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 100%"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input :value="createrDisplayName" :disabled="true" placeholder="制单人" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">盘点明细信息</span>
            <template v-if="detailEditable">
              <el-button type="primary" icon="el-icon-minus" size="small" class="spd-btn spd-btn--primary" @click="openAddLossEntry">新增盘亏明细</el-button>
              <el-button type="warning" icon="el-icon-plus" size="small" class="spd-btn" @click="openAddProfitEntry">新增盘盈明细</el-button>
              <el-button type="danger" icon="el-icon-delete" size="small" class="spd-btn" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
              <el-button type="success" icon="el-icon-refresh" size="small" class="spd-btn" @click="handleStocktakingInit">盘点初始化</el-button>
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" icon="el-icon-check" @click="submitForm" :loading="submitLoading">保 存</el-button>
            </template>
          </div>
        </el-row>

        <div class="modal-detail-section apply-modal-table-panel">
        <div class="table-wrapper">
        <el-table class="stocktaking-detail-table apply-detail-table" :data="stkIoStocktakingEntryList" v-loading="detailLoading" :row-class-name="applyDetailRowClassName" @selection-change="handleStkIoStocktakingEntrySelectionChange" ref="stkIoStocktakingEntry" :height="detailTableHeight" border show-summary :summary-method="getSummaries">
          <el-table-column v-if="detailEditable" type="selection" width="60" align="center" header-align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" resizable />
          <el-table-column label="序号" align="center" header-align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
          <el-table-column label="产品编码" align="center" header-align="center" width="100" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="产品名称"
            align="left"
            header-align="center"
            width="130"
            min-width="110"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.name) || '--'"
              >{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="规格"
            align="left"
            header-align="center"
            width="120"
            min-width="100"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.speci) || '--'"
              >{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" header-align="center" width="56" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="账面数量" align="center" header-align="center" prop="qty" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盘点数量" align="center" header-align="center" prop="stockQty" width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input
                v-if="detailEditable"
                clearable
                v-model="scope.row.stockQty"
                placeholder="盘点数量"
                size="small"
                class="detail-input-compact"
                onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                @blur="handleStockQtyBlur(scope.row)"
                @input="stockQtyChange(scope.row)"
              />
              <span v-else>{{ scope.row.stockQty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" align="right" header-align="center" prop="price" width="80" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.price != null && scope.row.price !== '' ? formatPrice(scope.row.price) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏数量" align="center" header-align="center" prop="profitQty" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.profitQty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" align="right" header-align="center" prop="amt" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盘点金额" align="right" header-align="center" prop="stockAmount" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.stockAmount || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏金额" align="right" header-align="center" prop="profitAmount" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.profitAmount || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" header-align="center" prop="beginTime" width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.beginTime ? parseTime(scope.row.beginTime, '{y}-{m}-{d}') : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" align="center" header-align="center" prop="endTime" width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.endTime ? parseTime(scope.row.endTime, '{y}-{m}-{d}') : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" header-align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="detailEditable" v-model="scope.row.batchNumber" size="small" class="detail-input-compact" placeholder="批号" />
              <span v-else>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" header-align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" header-align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="型号"
            align="left"
            header-align="center"
            width="100"
            min-width="90"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.model) || '--'"
              >{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="计费" align="center" header-align="center" width="56" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1 || scope.row.material.isBilling === true || scope.row.material.isBilling === 'true')">是</span>
              <span v-else-if="scope.row.material && (scope.row.material.isBilling === '0' || scope.row.material.isBilling === 0 || scope.row.material.isBilling === '2' || scope.row.material.isBilling === false || scope.row.material.isBilling === 'false')">否</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" header-align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" align="center" header-align="center" prop="batchNo" width="160" class-name="detail-col-batch-no" :show-overflow-tooltip="false" resizable>
            <template slot-scope="scope">
              <span class="detail-batch-no-cell" :title="scope.row.batchNo || ''">{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="第三方库存明细ID" align="center" header-align="center" prop="hisId" width="168" label-class-name="col-his-id-header" class-name="col-his-id" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.hisId || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="第三方批次号" align="center" header-align="center" prop="thirdPartyBatchNo" width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.thirdPartyBatchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" header-align="center" prop="remark" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="detailEditable" v-model="scope.row.remark" size="small" placeholder="备注" />
              <span v-else>{{ scope.row.remark || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="detailEditable" label="操作" align="center" header-align="center" class-name="small-padding fixed-width" width="72" fixed="right">
            <template slot-scope="scope">
              <el-button
                size="small"
                type="text"
                icon="el-icon-delete"
                @click="handleDeleteDetailRow(scope.row)"
                style="padding: 0 5px; margin: 0;"
              >删除</el-button>
            </template>
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
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'StocktakingProfitEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InStocktaking' && vm.$el && vm.$el.classList && vm.$el.classList.contains('stocktaking-profit-page'))],
  components: { SelectWarehouse },
  inheritAttrs: false
}
</script>
