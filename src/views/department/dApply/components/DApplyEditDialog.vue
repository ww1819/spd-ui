<template>
    <!-- 添加或修改科室申领对话框（布局对齐到货验收 apply-modal） -->
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
                      <el-select v-model="form.applyBillStatus" placeholder="请选择申领状态" :disabled="true" clearable>
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
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required head-label-nowrap">
                      <SelectDepartment v-model="form.departmentId" :disabled="isDeptLocked"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="金额" class="head-label-nowrap apply-modal-header-amount">
                      <el-input :value="headerAmountText" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" class="head-label-nowrap">
                      <el-input :value="creatorDisplayName" disabled placeholder="—" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="申请日期" prop="applyBillDate" class="head-label-nowrap">
                      <el-date-picker
                        clearable
                        v-model="form.applyBillDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        :disabled="true"
                        placeholder="请选择申请日期"
                      />
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
                <el-row :gutter="8" class="apply-modal-form-row apply-modal-row-third" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">科室申领明细信息</span>
                  <el-button
                    v-if="!action"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="openOutboundRefDialog(null)"
                  >关联出库单一览</el-button>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" :disabled="!form.departmentId" @click="nameBtn">添加</el-button>
                    <el-button type="success" size="small" class="spd-btn spd-btn--secondary" @click="handleRefTemplate">引用模板</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteBasApplyEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="basApplyEntryList"
                class="apply-detail-table"
                :row-class-name="applyDetailRowClassName"
                @selection-change="handleBasApplyEntrySelectionChange"
                ref="basApplyEntry"
                :height="detailTableHeight"
                border
                :summary-method="getSummaries"
                show-summary
              >
                <el-table-column type="selection" width="60" align="center" resizable class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="产品编码" align="center" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.material && scope.row.material.code ? scope.row.material.code : '—' }}</span>
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
                <el-table-column :label="action ? '数量' : '申请数量'" prop="qty" width="96" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input
                      v-if="action"
                      clearable
                      v-model="scope.row.qty"
                      placeholder="数量"
                      onkeyup="value=value.replace(/\D/g,'')"
                      onafterpaste="value=value.replace(/\D/g,'')"
                      @blur="form.result=$event.target.value"
                      @input="qtyChange(scope.row)"
                    />
                    <span v-else>{{ fmtQty(scope.row.qty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="仓库库存" prop="availableStockQty" width="100" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.availableStockQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="最小包装数" align="center" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtMinPackageQty(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="库存仓库" align="center" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.stockWarehouse && scope.row.stockWarehouse.name) ? scope.row.stockWarehouse.name : '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="待出库数量" prop="pendingOutboundQty" width="100" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.pendingOutboundQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="出库待审核数量" prop="ckPendingAuditQty" width="118" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.ckPendingAuditQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="已下推出库合计" prop="linkedCkQty" width="118" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.linkedCkQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="已审核出库数量" prop="ckAuditedQty" width="118" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.ckAuditedQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="已作废数量" prop="whLineVoidQty" width="100" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.whLineVoidQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="关联出库" width="88" align="center">
                  <template slot-scope="scope">
                    <el-button type="text"
              icon="el-icon-view" size="small" @click="openOutboundRefDialog(scope.row.id)">查看</el-button>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable/>
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
                    <el-input v-model="scope.row.remark" placeholder="备注" />
                  </template>
                </el-table-column>
                <el-table-column v-if="action" label="操作" align="center" width="100">
                  <template slot-scope="scope">
                    <el-button
                      size="small"
                      type="text"
                      icon="el-icon-delete"
                      @click="handleDeleteDetailRow(scope.$index)"
                      style="padding: 0 5px; margin: 0;"
                    >删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              </div>
              </div>
            </el-form>
            <SelectDepartmentApplyAvailableStock
              :nested="true"
              v-show="DialogComponentShow && selectTarget === 'apply'"
              :DialogComponentShow="DialogComponentShow && selectTarget === 'apply'"
              :selectedDetails="basApplyEntryList"
              @closeDialog="closeDialog"
              @selectData="selectData"
            />
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
import SelectDepartmentApplyAvailableStock from '@/components/SelectModel/SelectDepartmentApplyAvailableStock'

export default {
  name: 'DApplyEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApply')],
  components: { SelectDepartment, SelectDepartmentApplyAvailableStock },
  dicts: ['biz_status', 'way_status'],
  inheritAttrs: false
}
</script>
