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
                    <el-form-item label="验收单号" prop="orderNo" class="form-item-header-billno">
                      <el-input v-model="form.orderNo" :disabled="true" :title="form.orderNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse ref="formWarehouseSelect" v-model="form.warehouseId" :value2="gzOrderEntryList.length > 0" :disabled="warehouseAutoFilled || isAudited" includeWarehouseType="高值" blockDisabledForInbound disabledWarehouseMessage="该仓库已经停用，不能进行备货入库"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="供应商" prop="supplerId" class="apply-modal-label-required">
                      <SelectSupplier v-model="form.supplerId" :value2="gzOrderEntryList.length > 0" :disabled="isAudited"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input v-model="form.creatorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="orderDate" class="apply-modal-label-required">
                      <el-date-picker
                        clearable
                        v-model="form.orderDate"
                        type="date"
                        :disabled="true"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择制单日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人" prop="auditBy">
                      <el-input v-model="form.auditorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second apply-modal-row-third" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--udi-scan udi-scan-field">
                    <el-form-item label="UDI码" prop="ztm" class="detail-scan-form-item">
                      <div class="udi-scan-inline">
                        <el-input
                          v-model="form.ztm"
                          class="udi-scan-inline-input"
                          :placeholder="form.warehouseId ? '请扫描UDI码' : '请先选择仓库'"
                          clearable
                          :disabled="!form.warehouseId || isAudited"
                          @input="onZtmInput"
                          @paste.native="onZtmPaste"
                          @keyup.enter.native="openUdiScanDialog"
                        />
                        <el-button
                          type="primary"
                          icon="el-icon-full-screen"
                          size="small"
                          :disabled="!form.warehouseId || isAudited"
                          @click="openUdiScanDialog"
                        >扫描</el-button>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="辅条码" prop="ftm">
                      <el-input
                        v-model="form.ftm"
                        placeholder="请扫描辅条码"
                        clearable
                        :disabled="isAudited"
                        @keydown.enter.native.prevent="sm2"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input :value="getTotalAmount()" :disabled="true" class="input-total-amount-inline" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="审核日期" prop="auditDate">
                      <el-date-picker
                        clearable
                        v-model="form.auditDate"
                        type="datetime"
                        :disabled="true"
                        value-format="yyyy-MM-dd HH:mm:ss"
                        placeholder="请选择审核日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="isAudited" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">高值备货明细</span>
                    <template v-if="action">
                      <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId || !form.supplerId || isAudited">添加</el-button>
                      <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzOrderEntry" :disabled="isAudited">删除</el-button>
                      <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm" :disabled="isAudited">保 存</el-button>
                      <el-button type="primary" size="small" @click="handleAuditOnly" :disabled="isAudited">审 核</el-button>
                      <el-button type="primary" icon="el-icon-printer" size="small" @click="handlePrintOnly">打 印</el-button>
                      <el-button size="small" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                      <el-button size="small" @click="cancel" :disabled="isAudited">取 消</el-button>
                    </template>
                    <el-button
                      v-if="!action"
                      type="primary"
                      icon="el-icon-printer"
                      size="small"
                      class="detail-print-barcode-btn"
                      @click="handlePrintBarcodeFromDetail"
                    >打印条码</el-button>
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
                  <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                  <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="耗材名称" align="center" prop="materialName" width="150" resizable sortable :sort-method="sortByDetailMaterialName">
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="(scope.row.materialName || '') || '—'">
                        <span class="gz-detail-line-clip">{{ scope.row.materialName }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="规格" align="center" prop="speci" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByDetailSpeci">
                    <template slot-scope="scope">
                      {{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.model || (scope.row.material && scope.row.material.model) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.unit">
                        {{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}
                      </span>
                      <span v-else-if="scope.row.material">
                        {{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || (scope.row.material.unit && (typeof scope.row.material.unit === 'string' ? scope.row.material.unit : scope.row.material.unit.name)) || '--' }}
                      </span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="数量" align="center" prop="qty" width="80" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.qty != null ? scope.row.qty : '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.qty"
                            class="gz-qty-cell-input"
                            :disabled="isAudited"
                            placeholder=""
                            @input="onQtyCellInput(scope.row, $event)"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="价格" align="center" prop="price" width="100" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByDetailNumber(a,b,'price')">
                    <template slot-scope="scope">
                      {{ scope.row.price ? formatPrice(scope.row.price) : '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByDetailNumber(a,b,'amt')">
                    <template slot-scope="scope">
                      {{ scope.row.amt || '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByDetailTotalAmount">
                    <template slot-scope="scope">
                      {{ getTotalAmount() }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批号" align="center" prop="batchNumber" width="220" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.batchNumber || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.batchNumber"
                            :disabled="isAudited"
                            placeholder="批号"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" align="center" prop="beginTime" width="140" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.beginTime || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-date-picker clearable
                                          v-model="scope.row.beginTime"
                                          class="gz-detail-cell-date"
                                          :disabled="isAudited"
                                          type="date"
                                          value-format="yyyy-MM-dd"
                                          :picker-options="pickerBeginTimeOptions"
                                          placeholder="请选择生产日期"
                                          size="small">
                          </el-date-picker>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="有效期" align="center" prop="endTime" width="140" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.endTime || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-date-picker clearable
                                          v-model="scope.row.endTime"
                                          class="gz-detail-cell-date"
                                          :disabled="isAudited"
                                          type="date"
                                          value-format="yyyy-MM-dd"
                                          :picker-options="pickerEndTimeOptions"
                                          placeholder="请选择有效期"
                                          size="small">
                          </el-date-picker>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="主条码" align="center" prop="masterBarcode" width="240" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.masterBarcode || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.masterBarcode"
                            :disabled="isAudited"
                            placeholder="主条码"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="辅条码" align="center" prop="secondaryBarcode" width="220" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.secondaryBarcode || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.secondaryBarcode"
                            :disabled="isAudited"
                            placeholder="辅条码"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="序列号" align="center" prop="serialNo" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.serialNo || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批次号" align="center" prop="batchNo" width="260" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.batchNo || scope.row.batchNumber || '') || '—'">
                        <span class="gz-detail-line-clip">{{ scope.row.batchNo || scope.row.batchNumber || '--' }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产厂家" align="center" prop="factoryName" width="150" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="注册证号" align="center" prop="certificateNo" width="150" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.certificateNo || (scope.row.material && scope.row.material.certificateNo) || (scope.row.material && scope.row.material.fdCertificate && scope.row.material.fdCertificate.certificateNo) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="库房分类" align="center" prop="warehouseCategoryName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.warehouseCategoryName || (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="财务分类" align="center" prop="financeCategoryName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.financeCategoryName || (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" align="center" prop="remark" width="150" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.remark || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.remark"
                            class="gz-detail-cell-input"
                            :disabled="isAudited"
                            placeholder="备注"
                          />
                        </span>
                      </el-tooltip>
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
import SelectSupplier from '@/components/SelectModel/SelectSupplier'

export default {
  name: 'GzOrderApplyEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.gzOrderEntryList !== undefined)],
  components: { SelectWarehouse, SelectSupplier },
  inheritAttrs: false
}
</script>
