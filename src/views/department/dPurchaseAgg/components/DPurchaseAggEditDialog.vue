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
                    <el-form-item label="单号" prop="purchaseBillNo" class="form-item-header-billno">
                      <el-input v-model="form.purchaseBillNo" :disabled="true" :title="form.purchaseBillNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="申购状态" prop="purchaseBillStatus">
                      <el-select
                        v-model="form.purchaseBillStatus"
                        placeholder="请选择申购状态"
                        :disabled="true"
                        clearable
                      >
                        <el-option
                          v-for="dict in dict.type.purchase_status"
                          :key="dict.value"
                          :label="dict.value == '1' || dict.value == 1 ? '未审核' : dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
                      <SelectDepartment v-model="form.departmentId" :disabled="!action || isDeptWhLocked" filterable/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="金额" class="apply-modal-header-amount">
                      <el-input :value="headerAmountText" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="userId">
                      <el-input v-model="form.userName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="purchaseBillDate">
                      <el-date-picker
                        clearable
                        v-model="form.purchaseBillDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        :disabled="true"
                        placeholder="请选择制单日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="紧急程度" prop="urgencyLevel" class="form-item-urgency">
                      <el-select
                        v-if="action"
                        v-model="form.urgencyLevel"
                        placeholder="请选择紧急程度"
                        clearable
                      >
                        <el-option
                          v-for="dict in dict.type.urgency_level"
                          :key="dict.value"
                          :label="dict.label"
                          :value="String(dict.value)"
                        />
                      </el-select>
                      <el-input v-else v-model="urgencyLevelText" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="期望到货" prop="expectedDeliveryDate">
                      <el-date-picker
                        clearable
                        v-model="form.expectedDeliveryDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        :disabled="!action"
                        placeholder="请选择期望到货日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人">
                      <el-input :value="auditorDisplayName" disabled placeholder="—" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="审核日期">
                      <el-input :value="auditorDateText" disabled placeholder="—" />
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
                  <span class="apply-modal-detail-title">汇总申购明细信息</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="addMaterialRow" :disabled="!form.departmentId">添加耗材</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteDepPurchaseApplyEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="entryList"
                class="apply-detail-table"
                :row-class-name="applyDetailRowClassName"
                @selection-change="handleDepPurchaseApplyEntrySelectionChange"
                ref="depPurchaseApplyEntry"
                :height="detailTableHeight"
                border
                :summary-method="getPurchaseSummaries"
                show-summary
              >
                <el-table-column type="selection" width="60" align="center" resizable class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
                <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByEntryMaterialCode">
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || scope.row.code || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材" align="center" prop="materialName" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'materialName')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'warehouseName')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.warehouseName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="高值/低值" align="center" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatIsGzLabel(scope.row.isGz) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="拆分科室申购单号" align="center" prop="splitDepPurchaseBillNo" min-width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.splitDepPurchaseBillNo || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="规格" align="center" prop="materialSpec" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'materialSpec')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialSpec || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="型号" align="center" prop="model" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'model')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.model || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'unit')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.unit || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'qty')">
                  <template slot-scope="scope">
                    <el-input
                      v-if="action"
                      v-model="scope.row.qty"
                      placeholder="数量"
                      size="small"
                      onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                      onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                      @input="qtyChange(scope.row)"
                    />
                    <span v-else>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.unitPrice">¥{{ scope.row.unitPrice | formatPrice }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'amt')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.amt">¥{{ scope.row.amt | formatCurrency }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.brand || (scope.row.material && scope.row.material.brand) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="供应商" align="center" prop="supplierName" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.supplierName }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="producer" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.producer || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || (scope.row.material && scope.row.material.factoryName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-if="action" v-model="scope.row.remark" placeholder="备注" size="small" />
                    <span v-else>{{ scope.row.remark || '—' }}</span>
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
            <SelectMaterialForPurchaseAgg
              :nested="true"
              v-show="DialogComponentShow"
              :DialogComponentShow="DialogComponentShow"
              :excludePickKeys="entryPickKeys"
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
import SelectMaterialForPurchaseAgg from '@/components/SelectModel/SelectMaterialForPurchaseAgg'

export default {
  name: 'DPurchaseAggEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DPurchaseAgg')],
  components: { SelectDepartment, SelectMaterialForPurchaseAgg },
  dicts: ['purchase_status', 'urgency_level'],
  inheritAttrs: false
}
</script>
