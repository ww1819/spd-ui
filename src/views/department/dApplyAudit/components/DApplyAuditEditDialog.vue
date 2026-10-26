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
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="单号" prop="applyBillNo" class="form-item-header-billno head-label-nowrap">
                      <el-input v-model="form.applyBillNo" :disabled="true" :title="form.applyBillNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="申领状态" prop="billStatus" class="head-label-nowrap">
                      <el-select :value="detailApplyStatusSelectValue" placeholder="请选择申领状态" :disabled="true">
                        <el-option label="未审核" value="1" />
                        <el-option label="已审核" value="2" />
                        <el-option label="已驳回" value="3" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="head-label-nowrap apply-modal-header-dept">
                      <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="金额" class="head-label-nowrap apply-modal-header-amount">
                      <el-input :value="headerAmountText" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="applyBillDate" class="head-label-nowrap">
                      <el-date-picker
                        clearable
                        v-model="form.applyBillDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        :disabled="true"
                        placeholder="—"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" class="head-label-nowrap">
                      <el-input :value="creatorDisplayName" disabled placeholder="—" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人" class="head-label-nowrap">
                      <el-input :value="auditorDisplayName" disabled placeholder="—" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="审核日期" class="head-label-nowrap">
                      <el-input :value="auditorDateText" disabled placeholder="—" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row v-if="isDetailRejected" :gutter="8" class="apply-modal-form-row apply-modal-row-third apply-modal-row-reject" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="驳回原因" prop="rejectReason" class="form-item-reject-reason">
                      <el-input
                        v-model="form.rejectReason"
                        type="textarea"
                        :rows="2"
                        :disabled="true"
                        placeholder="—"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">科室申领明细信息</span>
                  <el-button
                    v-if="isDetailUnAuditAndNotRejected"
                    type="primary"
                    icon="el-icon-check"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="handleAuditSubmit"
                  >审 核</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="basApplyEntryList"
                class="apply-detail-table"
                :row-class-name="applyDetailRowClassName"
                ref="basApplyEntry"
                :height="detailTableHeight"
                border
                :summary-method="getSummaries"
                show-summary
                @selection-change="handleBasApplyEntrySelectionChange"
              >
                <el-table-column type="selection" width="60" align="center" resizable class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="仓库" align="center" width="120" min-width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.stockWarehouse && scope.row.stockWarehouse.name) || '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="产品名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')" />
                <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')" />
                <el-table-column label="型号" align="center" prop="material.model" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')" />
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice != null && scope.row.unitPrice !== '' ? formatPrice(scope.row.unitPrice) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.qty || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="剩余可用库存" prop="availableStockQty" width="118" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.availableStockQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.remark || '--' }}</span>
                  </template>
                </el-table-column>
              </el-table>
              </div>
              </div>
              <!-- 审核操作按钮（底部仅在审核模式下显示取消、驳回；审核按钮已移动到“科室申领明细信息”标题后面） -->
              <div class="modal-footer apply-modal-audit-footer" v-if="dialogMode === 'audit' && isDetailUnAuditAndNotRejected">
                <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
                <el-button type="danger" class="spd-btn spd-btn--danger" @click="handleRejectSubmit">驳 回</el-button>
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
  name: 'DApplyAuditEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApplyAudit')],
  components: { SelectDepartment },
  dicts: ['way_status'],
  inheritAttrs: false
}
</script>
