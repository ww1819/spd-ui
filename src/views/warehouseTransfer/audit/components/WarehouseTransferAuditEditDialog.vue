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
                    <el-form-item label="调拨单号" prop="billNo" class="form-item-header-billno">
                      <el-input v-model="form.billNo" :disabled="true" :title="form.billNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="billDate">
                      <el-date-picker clearable
                                      v-model="form.billDate"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createrName">
                      <el-input :value="createrDisplayName" :disabled="true" placeholder="制单人" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="调出仓库" prop="warehouseId">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="true" :excludeWarehouseType="['高值', '设备']"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="调入仓库" prop="departmentId">
                      <SelectWarehouse v-model="form.departmentId" :disabled="true" :excludeWarehouseType="['高值', '设备']"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="状态" prop="billStatus">
                      <el-input :value="form.billStatus == 2 || form.billStatus == '2' ? '已审核' : '未审核'" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" :disabled="true" placeholder="备注" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">调拨申请明细信息</span>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    class="apply-detail-table"
                    :data="stkIoBillEntryList"
                    :row-class-name="applyDetailRowClassName"
                    show-summary
                    :summary-method="getSummaries"
                    ref="stkIoBillEntry"
                    border
                    :height="detailTableHeight"
                  >
                    <el-table-column label="序号" align="center" header-align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                    <el-table-column label="产品编码" align="center" header-align="center" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="产品名称" align="left" header-align="center" prop="material.name" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="left" header-align="center" prop="material.speci" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="left" header-align="center" prop="material.model" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="调拨数量" align="center" header-align="center" prop="qty" width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.qty || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" header-align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
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
                    <el-table-column label="生产日期" align="center" header-align="center" prop="beginTime" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="有效期至" align="center" header-align="center" prop="endTime" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批次号" align="center" header-align="center" prop="batchNo" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.batchNo || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" align="center" header-align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" header-align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="供应商" align="center" header-align="center" prop="material.supplier.name" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="备注" align="center" header-align="center" prop="remark" width="120" show-overflow-tooltip resizable>
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

export default {
  name: 'WarehouseTransferAuditEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'WarehouseTransferAudit')],
  components: { SelectWarehouse },
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
