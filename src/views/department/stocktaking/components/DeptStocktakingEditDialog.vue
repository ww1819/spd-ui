<template>
    <!-- 添加或修改盘点对话框（布局与到货验收 inWarehouse/audit 弹窗一致） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="stockStatus">
                      <el-input v-model="stockStatusText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="盘点日期" prop="stockDate" class="form-item-stock-date-no-star">
                      <el-date-picker
                        clearable
                        v-model="form.stockDate"
                        type="date"
                        :disabled="true"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择盘点日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
                      <SelectDepartment v-model="form.departmentId" :disabled="!action || isDepartmentLocked || departmentLockedByAction" filterable/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人">
                      <el-input :value="deptFormCreatorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="盘点单号" prop="stockNo" class="form-item-header-billno">
                      <el-input
                        v-model="form.stockNo"
                        :disabled="true"
                        placeholder="保存后生成"
                        :title="form.stockNo || ''"
                        class="input-stock-no-ellipsis"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单时间">
                      <el-input :value="deptFormCreateTimeText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人">
                      <el-input :value="deptFormAuditorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核时间">
                      <el-input :value="deptFormAuditTimeText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额">
                      <el-input :value="totalAmountText" :disabled="true" class="input-total-amount-inline" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">盘点明细信息</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-minus" size="small" class="spd-btn spd-btn--primary" @click="openAddLossEntry">新增盘亏明细</el-button>
                    <el-button type="warning" icon="el-icon-plus" size="small" @click="openAddProfitEntry">新增盘盈明细</el-button>
                    <el-button
                      type="primary"
                      icon="el-icon-refresh"
                      size="small"
                      class="spd-btn spd-btn--primary"
                      :loading="deptInventoryInitLoading"
                      :disabled="(stkIoStocktakingEntryList || []).length > 0"
                      @click="handleStocktakingInitFromDeptInventory"
                    >盘点初始化</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm" :loading="submitLoading">保 存</el-button>
                  </template>
                </div>
                <div class="list-toolbar-right detail-toolbar-filters">
                  <el-select
                    v-model="detailFilterCounted"
                    size="small"
                    clearable
                    placeholder="是否已盘"
                    class="detail-filter-input"
                  >
                    <el-option label="已盘" :value="1" />
                    <el-option label="未盘" :value="0" />
                  </el-select>
                  <el-input
                    v-model="detailFilterMaterialName"
                    size="small"
                    clearable
                    placeholder="产品名称模糊"
                    class="detail-filter-input"
                  />
                  <el-input
                    v-model="detailFilterSpec"
                    size="small"
                    clearable
                    placeholder="规格模糊"
                    class="detail-filter-input"
                  />
                  <el-input
                    v-model="detailFilterModel"
                    size="small"
                    clearable
                    placeholder="型号模糊"
                    class="detail-filter-input"
                  />
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
        <el-table :data="filteredStkIoStocktakingEntryList" :row-class-name="rowStkIoStocktakingEntryIndex"
                  class="apply-detail-table"
                  @selection-change="handleStkIoStocktakingEntrySelectionChange"
                  ref="stkIoStocktakingEntry"
                  border
                  show-summary
                  :summary-method="getSummaries"
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" resizable class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
          <el-table-column label="产品编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="产品名称" prop="materialId" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')">
            <template slot-scope="scope">
              <span>{{ scope.row.material ? (scope.row.material.name || '--') : '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')">
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
          <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.model')">
            <template slot-scope="scope">
              <span v-if="scope.row.material">{{ scope.row.material.model || '' }}</span>
              <span v-else></span>
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="unitPrice" width="80" align="center" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')">
            <template slot-scope="scope">
              <span>{{ formatEntryUnitPriceDisplay(scope.row) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="库存数量" prop="qty" width="100" min-width="100" align="center" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'qty')">
            <template slot-scope="scope">
              <span>{{ formatEntryQtyDisplay(scope.row, 'qty') }}</span>
            </template>
          </el-table-column>

          <el-table-column label="实盘数量" prop="stockQty" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'stockQty')">
            <template slot-scope="scope">
              <el-input
                v-if="action"
                v-model="scope.row.stockQty"
                type="number"
                size="small"
                :disabled="isEntryStockQtyLocked(scope.row)"
                @input="stockQtyChange(scope.row)"
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
          <el-table-column label="已盘" width="72" align="center" resizable>
            <template slot-scope="scope">
              <el-checkbox
                :true-label="1"
                :false-label="0"
                v-model="scope.row.countedFlag"
                :disabled="!action || stocktakingHeadAudited || deptEntryCountedCheckboxDisabled(scope.row)"
                @change="(v) => onDeptEntryCountedChange(scope.row, v)"
              />
            </template>
          </el-table-column>
          <el-table-column v-if="action" label="盘盈复制" width="96" align="center" resizable>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="copyDetailToProfitDialog(scope.row)">盘盈复制</el-button>
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'amt')">
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏数量" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ getProfitQty(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏标志" align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatProfitLossFlag(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏金额" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ getProfitAmount(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="批次号" />
            </template>
          </el-table-column>

          <el-table-column label="批号" prop="batchNumber" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.beginTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.endTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.fdFactory">{{ scope.row.material.fdFactory.factoryName || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" prop="material.supplier.name" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{
                (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) ||
                  scope.row._supplierName ||
                  '--'
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="所属仓库" align="center" prop="returnWarehouseId" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ stocktakingWarehouseDisplay(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="400" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.remark || '--' }}</span>
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
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

export default {
  name: 'DeptStocktakingEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DeptStocktaking')],
  components: { SelectDepartment },
  inheritAttrs: false
}
</script>
