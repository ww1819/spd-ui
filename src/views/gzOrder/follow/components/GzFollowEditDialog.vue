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
                    <el-form-item label="跟台单号" prop="orderNo" class="form-item-header-billno">
                      <el-input v-model="form.orderNo" :disabled="true" :title="form.orderNo || ''" />
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
                      <SelectSupplier v-else v-model="form.supplerId" :value2="warehouseSupplierLocked" :onlyEnabled="true" placeholder="供应商" class="header-field-select-compact"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="!action || warehouseSupplierLocked" :value2="warehouseSupplierLocked" includeWarehouseType="高值"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额" class="apply-modal-label-required">
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
                    <el-form-item label="制单日期" prop="orderDate" class="apply-modal-label-required form-item-order-date-no-star">
                      <el-date-picker clearable v-model="form.orderDate" type="date" :disabled="true" value-format="yyyy-MM-dd" placeholder="制单日期" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input :value="form.creatorName || '--'" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人" prop="auditBy">
                      <el-input :value="form.auditorName || '--'" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="8" class="apply-modal-form-row apply-modal-row-third" type="flex">
                  <el-col v-if="action" :span="8">
                    <el-form-item label="UDI码" label-width="80px" class="detail-scan-form-item">
                      <el-input
                        v-model="form.ztm"
                        placeholder="请扫描UDI码"
                        clearable
                        size="small"
                        class="scan-barcode-input"
                        @keyup.enter.native="sm"
                      >
                        <template slot="prepend">
                          <i class="el-icon-s-operation"></i>
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col v-if="action" :span="8">
                    <el-form-item label="辅条码" label-width="80px" class="detail-scan-form-item">
                      <el-input
                        v-model="form.ftm"
                        placeholder="请扫描辅条码"
                        clearable
                        size="small"
                        class="scan-barcode-input"
                        @keyup.enter.native="sm2"
                      >
                        <template slot="prepend">
                          <i class="el-icon-s-operation"></i>
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="action ? 5 : 24">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" :placeholder="action ? '备注' : ''" clearable :disabled="!action" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">跟台明细信息</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" :disabled="!form.warehouseId || !form.supplerId" @click="checkMaterialBtn">添加</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzOrderEntry">删除</el-button>
                    <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" icon="el-icon-check" @click="submitForm">确 定</el-button>
                  </template>
                  <el-button size="small" class="spd-btn spd-btn--secondary" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    :data="pagedGzOrderEntryList"
                    :row-class-name="applyFollowDetailRowClassName"
                    class="apply-detail-table"
                    @selection-change="handleGzOrderEntrySelectionChange"
                    ref="gzOrderEntry"
                    border
                    show-summary
                    :summary-method="getSummariesWithRefresh"
                    :height="detailTableHeight"
                  >
                    <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" resizable />
                    <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
                    <el-table-column label="产品编码" align="center" width="120" show-overflow-tooltip resizable sortable>
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
                    <el-table-column label="规格" align="left" header-align="center" width="130" min-width="110" :show-overflow-tooltip="false" class-name="detail-col-text-wrap" resizable>
                      <template slot-scope="scope">
                        <span class="detail-text-cell-2line" :title="scope.row.speci || (scope.row.material && scope.row.material.speci) || '--'">
                          {{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unitName || (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="数量" align="center" prop="qty" width="100" min-width="90" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <el-input v-if="action" clearable v-model="scope.row.qty" placeholder="数量" size="small" class="detail-input-compact"
                                  onkeyup="value=value.replace(/\D/g,'')"
                                  onafterpaste="value=value.replace(/\D/g,'')"
                                  @blur="form.result=$event.target.value"
                                  @input="qtyChange(scope.row)"
                        />
                        <span v-else>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="价格" align="center" prop="price" width="100" min-width="90" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.price != null && scope.row.price !== '' ? formatPrice(scope.row.price) : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" align="center" prop="amt" width="100" min-width="90" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批号" align="center" prop="batchNumber" width="140" min-width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <el-input v-if="action" v-model="scope.row.batchNumber" placeholder="批号" size="small" class="detail-input-compact" />
                        <span v-else>{{ scope.row.batchNumber || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产日期" align="center" prop="beginTime" width="128" min-width="128" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <el-date-picker v-if="action" clearable v-model="scope.row.beginTime" type="date" value-format="yyyy-MM-dd" :picker-options="pickerBeginTimeOptions" placeholder="生产日期" size="small" class="detail-input-compact detail-date-begin" />
                        <span v-else-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="有效期" align="center" prop="endTime" width="128" min-width="128" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <el-date-picker v-if="action" clearable v-model="scope.row.endTime" type="date" value-format="yyyy-MM-dd" :picker-options="pickerEndTimeOptions" placeholder="有效期" size="small" class="detail-input-compact detail-date-expiry" />
                        <span v-else-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="UDI码" align="center" prop="masterBarcode" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.masterBarcode || scope.row.udiNo || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="辅条码" align="center" prop="secondaryBarcode" width="160" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.secondaryBarcode || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批次号" align="center" prop="batchNo" width="180" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.batchNo || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <el-input v-if="action" v-model="scope.row.remark" placeholder="备注" size="small" class="detail-input-compact" />
                        <span v-else>{{ scope.row.remark || '--' }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <pagination
                  class="modal-entry-pagination"
                  :total="gzOrderEntryList.length"
                  :page.sync="entryPageNum"
                  :limit.sync="entryPageSize"
                  :hide-on-single-page="false"
                  @pagination="handleEntryPagination"
                />
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
  name: 'GzFollowEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Follow')],
  components: { SelectSupplier, SelectWarehouse },
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
