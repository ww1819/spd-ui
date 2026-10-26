<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact modal-form-wrapper">
              <div class="form-fields-container">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="申购单号" prop="purchaseBillNo">
                      <el-input v-model="form.purchaseBillNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="申购状态" prop="purchaseBillStatus">
                      <el-select v-model="form.purchaseBillStatus" placeholder="请选择申购状态"
                                 :disabled="true"
                                 clearable>
                        <el-option v-for="dict in dict.type.purchase_status"
                                   :key="dict.value"
                                   :label="dict.label"
                                   :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="科室" prop="departmentId">
                      <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="备注" prop="remark" class="form-item-remark">
                      <el-input v-model="form.remark" placeholder="备注" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'" :span="4">
                    <el-form-item
                      label="驳回原因"
                      prop="rejectReason"
                      class="form-item-reject-reason"
                    >
                      <el-input
                        v-model="form.rejectReason"
                        clearable
                        placeholder="驳回原因（驳回时必填）"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col v-else-if="form.rejectReason" :span="4">
                    <el-form-item label="驳回原因" prop="rejectReason" class="form-item-reject-reason">
                      <el-input v-model="form.rejectReason" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="purchaseBillDate">
                      <el-date-picker clearable
                                      v-model="form.purchaseBillDate"
                                      type="date"
                                      style="width: 100%"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单人" prop="userId">
                      <el-input v-model="form.userName" :disabled="true" placeholder="—" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="紧急程度" prop="urgencyLevel" class="form-item-urgency">
                      <el-input v-model="urgencyLevelText" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="期望到货" prop="expectedDeliveryDate">
                      <el-date-picker clearable
                                      v-model="form.expectedDeliveryDate"
                                      type="date"
                                      style="width: 100%"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      placeholder="请选择期望到货日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <div class="modal-detail-section">
              <el-row :gutter="10" class="detail-toolbar-row">
                <el-col :span="24">
                  <div class="detail-header-row">
                    <span class="detail-header-title">科室申购明细信息</span>
                    <el-button
                      v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'"
                      size="small"
                      class="detail-action-btn"
                      @click="cancel"
                    >取 消</el-button>
                    <el-button
                      v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'"
                      type="danger"
                      size="small"
                      class="detail-action-btn"
                      @click="handleRejectSubmit"
                    >驳 回</el-button>
                    <el-button
                      v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'"
                      type="primary"
                      icon="el-icon-check"
                      size="small"
                      class="detail-action-btn"
                      @click="handleAuditSubmit"
                    >审 核</el-button>
                  </div>
                </el-col>
              </el-row>

              <div class="table-wrapper">
              <el-table :data="depPurchaseApplyEntryList" :row-class-name="rowDepPurchaseApplyEntryIndex" ref="depPurchaseApplyEntry" height="100%" border :summary-method="getPurchaseSummaries" show-summary>
                <el-table-column type="selection" width="55" align="center" fixed="left" resizable />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="申购单号" align="center" prop="purchaseBillNo" width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.purchaseBillNo || (form && form.purchaseBillNo) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || scope.row.code || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材" align="center" prop="materialName" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="规格" align="center" prop="materialSpec" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialSpec || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="型号" align="center" prop="model" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.model || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unit || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.qty || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.unitPrice">¥{{ scope.row.unitPrice | formatPrice }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.amt">¥{{ scope.row.amt | formatCurrency }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.brand || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="供应商" align="center" prop="supplierName" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.supplierName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.producer || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
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
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

export default {
  name: 'DPurchaseAuditEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DPurchaseAudit')],
  components: { SelectWarehouse, SelectDepartment },
  dicts: ['purchase_status'],
  inheritAttrs: false
}
</script>
