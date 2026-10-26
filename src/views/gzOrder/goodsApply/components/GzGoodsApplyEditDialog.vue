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
                    <el-form-item label="退货单号" prop="goodsNo" class="form-item-header-billno">
                      <el-input v-model="form.goodsNo" :disabled="true" :title="form.goodsNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="供应商" prop="supplerId" class="form-item-header-supplier apply-modal-label-required">
                      <el-input
                        v-if="isHeaderSupplierReadonly"
                        :value="supplierHeaderDisplayName"
                        disabled
                        :title="supplierHeaderDisplayName"
                        class="header-field-supplier-readonly"
                      />
                      <SelectSupplier v-else v-model="form.supplerId" :onlyEnabled="true" placeholder="供应商" class="header-field-select-compact"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="!action || warehouseSupplierLocked" includeWarehouseType="高值" placeholder="仓库"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额" class="apply-modal-label-required">
                      <el-input :value="getTotalAmount()" :disabled="true" placeholder="总金额" class="input-total-amount-inline" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="goodsStatus">
                      <el-select v-model="form.goodsStatus" placeholder="单据状态" :disabled="true" clearable>
                        <el-option v-for="dict in dict.type.biz_status" :key="dict.value" :label="dict.label" :value="dict.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单时间" prop="goodsDate" class="apply-modal-label-required form-item-goods-date-no-star">
                      <el-date-picker clearable v-model="form.goodsDate" type="date" :disabled="true" value-format="yyyy-MM-dd" placeholder="制单时间" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input v-model="form.creatorName" :disabled="true" placeholder="制单人" />
                    </el-form-item>
                  </el-col>
                  <el-col v-if="action" class="apply-modal-field apply-modal-field--udi-scan in-hospital-scan-field">
                    <el-form-item label="扫院内码" class="detail-scan-form-item">
                      <el-input
                        v-model="scanCodeInput"
                        placeholder="请先选择仓库与供应商，扫码后回车"
                        clearable
                        size="small"
                        class="scan-barcode-input"
                        :disabled="scanThDisabled"
                        @keyup.enter.native="onScanDepotInHospitalCode"
                      >
                        <template slot="prepend">
                          <i class="el-icon-s-operation"></i>
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" :placeholder="(action && !isAuditedForm) ? '备注' : ''" clearable :disabled="!action || isAuditedForm" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">退货明细信息</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm" @click="checkMaterialBtn">添加</el-button>
                    <el-button size="small" class="spd-btn spd-btn--secondary" :disabled="isAuditedForm" v-hasPermi="['gz:refDoc:query']" @click="openRefAcceptanceTh">引用验收单</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" :disabled="isAuditedForm" @click="handleDeleteGzRefundGoodsEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm" @click="submitForm">保 存</el-button>
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm || hasDialogUnsavedChanges || !form.id" @click="handleDialogAudit">审 核</el-button>
                    <el-button type="primary" icon="el-icon-printer" size="small" class="spd-btn spd-btn--secondary" :disabled="hasDialogUnsavedChanges || !form.id || !isAuditedForm" @click="handleDialogPrint">打 印</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    :data="gzRefundGoodsEntryList"
                    :row-class-name="applyGoodsDetailRowClassName"
                    class="apply-detail-table"
                    @selection-change="handleGzRefundGoodsEntrySelectionChange"
                    ref="gzRefundGoodsEntry"
                    border
                    show-summary
                    :summary-method="getSummariesWithRefresh"
                    :height="detailTableHeight"
                  >
                    <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" resizable />
                    <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
                    <el-table-column label="产品编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="产品名称" align="left" header-align="center" prop="materialName" width="150" min-width="140" :show-overflow-tooltip="false" class-name="detail-col-text-wrap" resizable sortable>
                      <template slot-scope="scope">
                        <span class="detail-text-cell-2line" :title="scope.row.materialName || (scope.row.material && scope.row.material.name) || '--'">
                          {{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="left" header-align="center" prop="speci" width="130" min-width="110" :show-overflow-tooltip="false" class-name="detail-col-text-wrap" resizable sortable>
                      <template slot-scope="scope">
                        <span class="detail-text-cell-2line" :title="scope.row.speci || (scope.row.material && scope.row.material.speci) || '--'">
                          {{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" prop="unit" width="80" min-width="80" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span v-if="scope.row.unit">{{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}</span>
                        <span v-else-if="scope.row.material">{{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || scope.row.unitName || '--' }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.model || (scope.row.material && scope.row.material.model) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="数量" align="center" prop="qty" width="100" min-width="90" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="价格" align="center" prop="price" width="100" min-width="90" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <div style="text-align: center;">
                          <span>{{ scope.row.price != null && scope.row.price !== '' ? formatPrice(scope.row.price) : '--' }}</span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" align="center" prop="amt" width="100" min-width="90" show-overflow-tooltip resizable sortable>
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
                    <el-table-column label="院内码" align="center" prop="inHospitalCode" width="200" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.inHospitalCode || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="UDI码" align="center" prop="udiNo" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.udiNo || (scope.row.material && scope.row.material.udiNo) || scope.row.masterBarcode || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="left" header-align="center" prop="factoryName" width="160" min-width="140" :show-overflow-tooltip="false" class-name="detail-col-text-wrap" resizable>
                      <template slot-scope="scope">
                        <span class="detail-text-cell-2line" :title="scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--'">
                          {{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" align="center" prop="certificateNo" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.fdCertificate && scope.row.material.fdCertificate.certificateNo) || scope.row.certificateNo || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号有效期" align="center" prop="certificateExpiryDate" width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span v-if="scope.row.material && scope.row.material.fdCertificate && scope.row.material.fdCertificate.expiryDate">{{ parseTime(scope.row.material.fdCertificate.expiryDate, '{y}-{m}-{d}') }}</span>
                        <span v-else-if="scope.row.certificateExpiryDate">{{ parseTime(scope.row.certificateExpiryDate, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <el-input v-if="action && !isAuditedForm" v-model="scope.row.remark" placeholder="备注" size="small" class="detail-input-compact" />
                        <span v-else>{{ scope.row.remark || '--' }}</span>
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
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'GzGoodsApplyEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Goods')],
  components: { SelectSupplier, SelectWarehouse },
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
