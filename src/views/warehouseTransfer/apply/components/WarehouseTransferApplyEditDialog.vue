<template>
    <!-- 添加或修改调拨申请对话框（布局对齐到货验收） -->
    <transition name="modal-fade">
      <div v-if="dialogVisible" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="dialogVisible" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ dialogType === 'add' ? '新增调拨申请' : dialogType === 'edit' ? '修改调拨申请' : '调拨申请详情' }}</div>
              <el-button size="small" @click="closeDialog" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="transferForm" :model="transferForm" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="调拨单号" prop="transferOrderCode" class="form-item-header-billno">
                      <el-input v-model="transferForm.transferOrderCode" :disabled="true" :title="transferForm.transferOrderCode || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="transferDate" class="apply-modal-label-required">
                      <el-date-picker clearable
                                      v-model="transferForm.transferDate"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :disabled="dialogType === 'view'"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额">
                      <el-input :value="formTotalAmount" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人">
                      <el-input :value="createrDisplayName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="调出仓库" prop="fromWarehouseId" class="apply-modal-label-required">
                      <SelectWarehouse v-model="transferForm.fromWarehouseId" placeholder="请选择调出仓库" :excludeWarehouseType="['设备', '高值']" :disabled="dialogType === 'view'" @change="onWarehouseChange('from', $event)"></SelectWarehouse>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="调入仓库" prop="toWarehouseId" class="apply-modal-label-required">
                      <SelectWarehouse v-model="transferForm.toWarehouseId" placeholder="请选择调入仓库" :excludeWarehouseType="['设备', '高值']" :disabled="dialogType === 'view'" @change="onWarehouseChange('to', $event)"></SelectWarehouse>
                    </el-form-item>
                  </el-col>
                  <el-col v-if="dialogType !== 'add'" class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="状态" prop="status">
                      <el-input :value="transferForm.status == 2 || transferForm.status == '2' ? '已审核' : '未审核'" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="transferForm.remark" placeholder="备注" clearable :disabled="dialogType === 'view'" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">调拨申请明细信息</span>
                  <template v-if="dialogType !== 'view'">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="addDetail" :disabled="!transferForm.fromWarehouseId">添加</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" class="spd-btn" @click="handleDeleteTransferDetail">删除</el-button>
                    <el-button size="small" class="spd-btn spd-btn--secondary" @click="closeDialog">取 消</el-button>
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" icon="el-icon-check" @click="submitTransfer" :loading="submitLoading">保 存</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    class="apply-detail-table"
                    :data="transferDetails"
                    :row-class-name="applyDetailRowClassName"
                    @selection-change="handleTransferDetailSelectionChange"
                    ref="transferDetail"
                    :height="detailTableHeight"
                    border
                    :summary-method="getSummaries"
                    show-summary
                  >
                    <el-table-column v-if="dialogType !== 'view'" type="selection" width="60" align="center" header-align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" resizable />
                    <el-table-column label="序号" align="center" header-align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                    <el-table-column label="产品编码" align="center" header-align="center" prop="materialCode" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="产品名称" align="left" header-align="center" prop="materialName" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialName || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="left" header-align="center" prop="specification" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.specification || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="left" header-align="center" prop="model" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.model || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="调拨数量" align="center" header-align="center" prop="transferQuantity" width="96" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <el-input
                          v-if="dialogType !== 'view'"
                          clearable
                          v-model="scope.row.transferQuantity"
                          placeholder="数量"
                          size="small"
                          class="detail-input-compact"
                          onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                          onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                          @input="qtyChange(scope.row)"
                        />
                        <span v-else>{{ scope.row.transferQuantity || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" header-align="center" prop="unit" width="80" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unit || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单价" align="right" header-align="center" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unitPrice != null && scope.row.unitPrice !== '' ? formatPrice(scope.row.unitPrice) : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" align="right" header-align="center" prop="amt" width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批号" align="center" header-align="center" prop="batchNumber" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.batchNumber || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产日期" align="center" header-align="center" prop="productionDate" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.productionDate || (scope.row.material && scope.row.material.productionDate) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="有效期至" align="center" header-align="center" prop="expireDate" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.expireDate || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批次号" align="center" header-align="center" prop="batchNo" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.batchNo || (scope.row.material && scope.row.material.batchNo) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" align="center" header-align="center" prop="registerNo" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.registerNo || (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" header-align="center" prop="manufacturer" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.manufacturer || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="供应商" align="center" header-align="center" prop="supplier" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.supplier || (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="备注" align="center" header-align="center" prop="remark" width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.remark || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column v-if="dialogType !== 'view'" label="操作" align="center" header-align="center" class-name="small-padding fixed-width" width="72" fixed="right">
                      <template slot-scope="scope">
                        <el-button
                          size="small"
                          type="text"
                          icon="el-icon-delete"
                          @click="deleteDetail(scope.$index)"
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
  name: 'WarehouseTransferApplyEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'WarehouseTransferApply')],
  components: { SelectWarehouse },
  inheritAttrs: false
}
</script>
