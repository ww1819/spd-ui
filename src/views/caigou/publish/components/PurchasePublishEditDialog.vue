<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
              <div class="form-fields-container apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="单据状态" prop="orderStatus">
                      <el-select v-model="form.orderStatus" placeholder="请选择单据状态" :disabled="true" clearable>
                        <el-option
                          v-for="dict in dict.type.biz_status"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="供应商编码">
                      <el-input :value="formatSpdSupplierCode(form)" :disabled="true" placeholder="fd_supplier.code" :title="formatSpdSupplierCode(form)" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="对照平台编码" class="publish-field-long-label">
                      <el-input :value="formatBindScmSupplierCode(form)" :disabled="true" placeholder="绑定表当前对照" :title="formatBindScmSupplierCode(form)" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="发布平台编码" class="publish-field-long-label">
                      <el-input :value="formatOrderScmSupplierCode(form)" :disabled="true" placeholder="订单发布回写" :title="formatOrderScmSupplierCode(form)" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="订单时间" prop="orderDate">
                      <el-input :value="parseTime(form.orderDate, '{y}-{m}-{d} {h}:{i}')" :disabled="true" placeholder="订单时间" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="操作人" prop="createBy">
                      <el-input :value="operatorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="联系电话" prop="contactPhone">
                      <el-input v-model="form.contactPhone" :disabled="true" placeholder="联系电话" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="采购员" prop="contactPerson">
                      <el-input :value="purchaserName" :disabled="true" placeholder="采购员" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-third" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">订单明细信息</span>
                  <el-button
                    v-if="form.planId"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="handleViewPlan"
                  >查看采购计划</el-button>
                  <el-button
                    v-if="form.planId"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--secondary"
                    @click="handleShowApplyBillNoList"
                  >查看申购单</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    :data="purchaseOrderEntryList"
                    :row-class-name="rowPurchaseOrderEntryIndex"
                    class="apply-detail-table"
                    show-summary
                    :summary-method="getSummaries"
                    @selection-change="handlePurchaseOrderEntrySelectionChange"
                    ref="purchaseOrderEntry"
                    :height="detailTableHeight"
                    border
                  >
                    <el-table-column label="序号" align="center" type="index" width="50" :index="index => index + 1"/>
                    <el-table-column label="产品编码" align="center" width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.code) || scope.row.materialCode || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="产品名称" align="center" width="140" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortEntryByNested(a,b,'material.name','materialName')">
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="center" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortEntryByNested(a,b,'material.speci','materialSpec')">
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.materialSpec || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="center" width="100" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortEntryByNested(a,b,'material.model','model')">
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.material && scope.row.material.fdUnit ? scope.row.material.fdUnit.unitName : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="库存数量" align="center" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.stockQty != null ? scope.row.stockQty : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="订单数量" align="center" prop="orderQty" width="100" show-overflow-tooltip resizable/>
                    <el-table-column label="单价" align="right" prop="unitPrice" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unitPrice != null ? formatPrice4(scope.row.unitPrice) : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" align="right" prop="totalAmount" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.totalAmount != null ? formatPrice4(scope.row.totalAmount) : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="库房分类" align="center" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="财务分类" align="center" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable/>
                    <el-table-column label="操作" align="center" width="120" fixed="right">
                      <template slot-scope="scope">
                        <el-button v-if="scope.row.planEntryId" type="text" size="small" @click="handleViewApplyDetails(scope.row)">查看申购明细</el-button>
                        <span v-else>--</span>
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
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse.vue'

export default {
  name: 'PurchasePublishEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchaseOrderAudit' && vm.$el && vm.$el.classList && vm.$el.classList.contains('caigou-publish-page'))],
  components: { SelectWarehouse },
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
