<template>
    <!-- 添加或修改高值入库对话框 -->
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
                    <el-form-item :label="isOutbound ? '出库单号' : '入库单号'" prop="orderNo" class="form-item-header-billno">
                      <el-input v-model="form.orderNo" :disabled="true" :title="form.orderNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="headerWhDeptLocked" includeWarehouseType="高值"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
                      <SelectDepartment v-model="form.departmentId" :disabled="headerWhDeptLocked"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额">
                      <el-input :value="getTotalAmount()" :disabled="true" placeholder="总金额" class="input-total-amount-inline" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="orderStatus">
                      <el-select v-model="form.orderStatus" placeholder="单据状态" :disabled="true" clearable>
                        <el-option v-for="dict in dict.type.biz_status" :key="dict.value" :label="dict.label" :value="dict.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单时间" prop="orderDate" class="apply-modal-label-required">
                      <el-date-picker clearable v-model="form.orderDate" type="date" :disabled="true" value-format="yyyy-MM-dd" placeholder="制单时间" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input v-model="form.creatorName" :disabled="true" placeholder="制单人" />
                    </el-form-item>
                  </el-col>
                  <el-col v-if="isOutbound && action" class="apply-modal-field apply-modal-field--udi-scan in-hospital-scan-field">
                    <el-form-item label="院内码" prop="scanInHospitalCode" class="detail-scan-form-item">
                      <el-input
                        v-model="form.scanInHospitalCode"
                        :placeholder="scanInHospitalPlaceholder"
                        clearable
                        size="small"
                        class="scan-barcode-input"
                        :disabled="scanInputDisabled"
                        @keyup.enter.native="handleScanInHospitalCode"
                      >
                        <template slot="prepend">
                          <i class="el-icon-s-operation"></i>
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action || isAuditedForm" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">{{ isOutbound ? '备货出库明细信息' : '高值备货入库明细信息' }}</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm || !canScanOrAdd" @click="checkMaterialBtn">添加</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" :disabled="isAuditedForm" @click="handleDeleteGzOrderEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm" @click="submitForm">保 存</el-button>
                    <el-button
                      v-if="isOutbound"
                      type="primary"
                      size="small"
                      class="spd-btn spd-btn--secondary"
                      :disabled="!canOpenRefAcceptance"
                      v-hasPermi="['gz:refDoc:query']"
                      @click="openRefAcceptance"
                    >引用验收单</el-button>
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm || hasDialogUnsavedChanges || !form.id" @click="handleDialogAudit">审 核</el-button>
                    <el-button type="primary" icon="el-icon-printer" size="small" class="spd-btn spd-btn--secondary" :disabled="hasDialogUnsavedChanges || !form.id || !isAuditedForm" @click="handleDialogPrint">打 印</el-button>
                    <el-button size="small" class="spd-btn spd-btn--secondary" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                  </template>
                  <el-button v-if="!action" size="small" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                <el-table :data="gzOrderEntryList" :row-class-name="applyGzOrderDetailRowClassName"
                  class="apply-detail-table"
                  @selection-change="handleGzOrderEntrySelectionChange"
                  ref="gzOrderEntry"
                  border
                  show-summary
                  :summary-method="getSummariesWithRefresh"
                  :height="detailTableHeight">
                  <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" resizable />
                  <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
                  <el-table-column label="产品编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable sortable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="产品名称"
                    align="left"
                    header-align="center"
                    prop="materialName"
                    width="150"
                    min-width="140"
                    :show-overflow-tooltip="false"
                    class-name="detail-col-text-wrap"
                    resizable
                    sortable
                    :sort-method="sortByDetailMaterialName"
                  >
                    <template slot-scope="scope">
                      <span
                        class="detail-text-cell-2line"
                        :title="scope.row.materialName || (scope.row.material && scope.row.material.name) || '--'"
                      >{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="规格"
                    align="left"
                    header-align="center"
                    prop="speci"
                    width="130"
                    min-width="110"
                    :show-overflow-tooltip="false"
                    class-name="detail-col-text-wrap"
                    resizable
                    sortable
                    :sort-method="sortByDetailSpeci"
                  >
                    <template slot-scope="scope">
                      <span
                        class="detail-text-cell-2line"
                        :title="(scope.row.material && scope.row.material.speci) || scope.row.speci || '--'"
                      >{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="单位" align="center" prop="unit" width="80" min-width="80" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.unit">{{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}</span>
                      <span v-else-if="scope.row.material">{{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="数量" align="center" prop="qty" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByDetailNumber(a,b,'qty')">
                    <template slot-scope="scope">
                      <div class="detail-cell-focus-wrap" :data-detail-row="scope.$index" data-detail-col="qty">
                        <el-input
                          v-if="!isAuditedForm && action && !refMode"
                          clearable
                          v-model="scope.row.qty"
                          placeholder="数量"
                          size="small"
                          class="detail-input-compact"
                          onkeyup="value=value.replace(/\D/g,'')"
                          onafterpaste="value=value.replace(/\D/g,'')"
                          @input="qtyChange(scope.row)"
                        />
                        <span v-else>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '--' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="价格" align="center" prop="price" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByDetailNumber(a,b,'price')">
                    <template slot-scope="scope">
                      <div style="text-align: center;">
                        <span>{{ scope.row.price != null && scope.row.price !== '' ? formatPrice(scope.row.price) : '--' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" align="center" prop="amt" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByDetailNumber(a,b,'amt')">
                    <template slot-scope="scope">
                      <div style="text-align: center;">
                        <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="批次号" align="center" prop="batchNo" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.batchNo || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="批号" align="center" prop="batchNumber" width="140" min-width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.batchNumber || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" align="center" prop="beginTime" width="128" min-width="128" show-overflow-tooltip resizable sortable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="有效期" align="center" prop="endTime" width="128" min-width="128" show-overflow-tooltip resizable sortable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="生产厂家"
                    align="left"
                    header-align="center"
                    prop="factoryName"
                    width="160"
                    min-width="140"
                    :show-overflow-tooltip="false"
                    class-name="detail-col-text-wrap"
                    resizable
                  >
                    <template slot-scope="scope">
                      <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--'">
                        {{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="院内码" align="center" prop="inHospitalCode" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.inHospitalCode || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="UDI码" align="center" prop="udiNo" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.udiNo || scope.row.masterBarcode || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="辅条码" align="center" prop="secondaryBarcode" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.secondaryBarcode || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" :disabled="isAuditedForm" placeholder="备注" size="small" class="detail-input-compact" />
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
  name: 'GzOrderAuditEditDialog',
  dicts: ['biz_status'],
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'OrderAudit')],
  components: { SelectWarehouse, SelectDepartment },
  inheritAttrs: false
}
</script>
