<template>
    <!-- 添加或修改盘点对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" size="small" class="stocktaking-modal-form">
        <div class="form-fields-container stocktaking-modal-head-form">
        <el-row :gutter="8" class="stocktaking-head-row">
          <el-col :span="4">
            <el-form-item label="单据状态" prop="stockStatus" label-width="88px">
              <el-select v-model="form.stockStatus" placeholder="请选择单据状态"
                         :disabled="true"
                         clearable style="width: 100%">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="供应商" prop="supplerId" label-width="72px">
              <SelectSupplier v-model="form.supplerId" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单日期" prop="stockDate" label-width="88px">
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
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="72px">
              <SelectWarehouse v-model="form.warehouseId" :disabled="!action || warehouseLockedByAction"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="72px">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="盘点类型" prop="stockType" label-width="88px">
              <el-select v-model="form.stockType" placeholder="请选择盘点类型"
                         :disabled="true"
                         clearable style="width: 100%">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8" class="stocktaking-head-row">
          <el-col :span="4">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-row :gutter="10" class="mb8 wh-stocktaking-detail-toolbar">
          <el-col :span="24">
            <div class="wh-stocktaking-detail-toolbar-inner">
              <span>盘点明细信息</span>
              <div v-show="detailEditable" class="wh-stocktaking-detail-toolbar-actions">
                <el-button type="primary" icon="el-icon-minus" size="small" @click="openAddLossEntry">新增盘亏明细</el-button>
                <el-button type="warning" icon="el-icon-plus" size="small" @click="openAddProfitEntry">新增盘盈明细</el-button>
                <el-button
                  type="primary"
                  icon="el-icon-refresh"
                  size="small"
                  :loading="whInventoryInitLoading"
                  :disabled="(stkIoStocktakingEntryList || []).length > 0"
                  @click="handleStocktakingInitFromWarehouseInventory"
                >盘点初始化</el-button>
                <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
              </div>
              <div class="wh-stocktaking-detail-toolbar-filters">
                <el-select
                  v-model="detailFilterCounted"
                  size="small"
                  clearable
                  placeholder="是否已盘"
                  class="wh-detail-filter-counted"
                >
                  <el-option label="已盘" :value="1" />
                  <el-option label="未盘" :value="0" />
                </el-select>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-table :data="filteredWhStocktakingEntryList" v-loading="detailLoading" :row-class-name="rowStkIoStocktakingEntryIndex" @selection-change="handleStkIoStocktakingEntrySelectionChange" ref="stkIoStocktakingEntry" height="calc(42vh)" border>
          <el-table-column v-if="detailEditable" type="selection" width="50" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="产品编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="产品名称" prop="materialId" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-if="!scope.row.kcNo && action" v-model="scope.row.materialId" :value2="isShow"/>
              <span v-else>{{ scope.row.material ? (scope.row.material.name || '--') : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="material.speci" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material">{{ scope.row.material.speci || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.fdUnit">{{ scope.row.material.fdUnit.unitName || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>

          <el-table-column label="明细账面数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatEntryQtyDisplay(scope.row, 'qty') }}</span>
            </template>
          </el-table-column>

          <el-table-column label="实盘数量" prop="stockQty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input
                v-if="detailEditable"
                v-model="scope.row.stockQty"
                type="number"
                :disabled="isEntryStockQtyLocked(scope.row)"
                @input="stockQtyChangeWh(scope.row)"
                @blur="handleStockQtyBlur(scope.row)"
                placeholder="实盘数量"
              />
              <span v-else>{{ formatEntryQtyDisplay(scope.row, 'stockQty') }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!action" label="当前库存数量" width="120" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatEntryCurrentInventoryQty(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏数量" align="center" width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ getProfitQty(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏标志" align="center" width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatProfitLossFlag(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已盘" width="72" align="center" resizable>
            <template slot-scope="scope">
              <el-checkbox
                :true-label="1"
                :false-label="0"
                v-model="scope.row.countedFlag"
                :disabled="!action || stocktakingHeadAudited || whEntryCountedCheckboxDisabled(scope.row)"
                @change="(v) => onWhEntryCountedChange(scope.row, v)"
              />
            </template>
          </el-table-column>
          <el-table-column v-if="detailEditable" label="盘盈复制" width="96" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="copyDetailToProfitDialog(scope.row)">盘盈复制</el-button>
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="!scope.row.kcNo && detailEditable" v-model="scope.row.price" type="number" @input="priceChange(scope.row)" placeholder="单价" />
              <span v-else>{{ scope.row.unitPrice != null ? this.formatPrice(scope.row.unitPrice) : (scope.row.price != null ? this.formatAmount(scope.row.price) : '--') }}</span>
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>

          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" label-width="200px" placeholder="批次号" />
            </template>
          </el-table-column>
          <el-table-column label="第三方库存明细ID" prop="hisId" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.hisId || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="第三方批次号" prop="thirdPartyBatchNo" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.thirdPartyBatchNo || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="供应商" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectSupplier
                v-if="!scope.row.kcNo && detailEditable"
                :value="scope.row.supplierId"
                finance-pick-mode
                placeholder="请选择供应商"
                style="width: 100%"
                @input="(v) => $set(scope.row, 'supplierId', v)"
              />
              <span v-else>{{ formatEntrySupplierName(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="detailEditable" v-model="scope.row.batchNumber" label-width="200px" placeholder="批号" />
              <span v-else>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker
                v-if="detailEditable"
                clearable
                v-model="scope.row.beginTime"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择出库日期"
              />
              <span v-else>{{ scope.row.beginTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker
                v-if="detailEditable"
                clearable
                v-model="scope.row.endTime"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择出库日期"
              />
              <span v-else>{{ scope.row.endTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="detailEditable" v-model="scope.row.remark" placeholder="备注" />
              <span v-else>{{ scope.row.remark || '--' }}</span>
            </template>
          </el-table-column>
        </el-table>
            </el-form>
            <div class="modal-footer" v-show="detailEditable">
              <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
              <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm" :loading="submitLoading">确 定</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectMaterial from '@/components/SelectModel/SelectMaterial'

export default {
  name: 'StocktakingInEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InStocktaking' && vm.$el && vm.$el.classList && vm.$el.classList.contains('stocktaking-in-page'))],
  components: { SelectSupplier, SelectWarehouse, SelectMaterial },
  dicts: ['biz_status','bill_type'],
  inheritAttrs: false
}
</script>
