<template>
    <!-- 添加或修改退货对话框 -->
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
            <el-form-item label="单据号" prop="billNo" class="form-item-header-billno">
              <el-input v-model="form.billNo" :disabled="true" :title="form.billNo || ''" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="供应商" prop="supplerId" class="form-item-header-supplier apply-modal-label-required">
              <el-input
                :value="supplierHeaderDisplayName"
                disabled
                :title="supplierHeaderDisplayName"
                class="header-field-supplier-readonly"
              />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
              <SelectWarehouse v-model="form.warehouseId" :value2="true" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="总金额" prop="totalAmount" class="apply-modal-label-required">
              <el-input :value="formatAmount(form.totalAmount)" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" :disabled="true" placeholder="发票号" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="制单人">
              <el-input
                :value="(form.creater && (form.creater.nickName || form.creater.userName)) || form.createrName || '--'"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-input v-model="form.invoiceTime" clearable disabled placeholder="发票时间" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="form.proPerson" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="form.delPerson" :disabled="true" placeholder="配送员" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="form.telephone" :disabled="true" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="form.invoiceAmount" :disabled="true" placeholder="发票金额" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用单号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" class="apply-modal-form-row apply-modal-row-third" type="flex">
          <el-col :span="7">
            <el-form-item label="退货原因" prop="returnReason" label-width="92px" class="return-reason-form-item">
              <el-input v-model="form.returnReason" placeholder="退货原因" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="17">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable disabled />
            </el-form-item>
            </el-col>
        </el-row>
          </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">退货明细信息</span>
            <template v-if="action">
              <el-button
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                icon="el-icon-plus"
                @click="checkMaterialBtn"
                :disabled="!form.warehouseId"
              >添加</el-button>
              <el-button
                type="danger"
                size="small"
                icon="el-icon-delete"
                @click="handleDeleteStkIoBillEntry"
              >删除</el-button>
              <el-button
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                icon="el-icon-check"
                @click="submitForm"
              >保 存</el-button>
            </template>
          </div>
        </el-row>

        <div class="modal-detail-section apply-modal-table-panel">
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="applyDetailRowClassName"
                  class="apply-detail-table"
                  show-summary :summary-method="getSummariesWithRefresh"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
          <el-table-column
            label="产品名称"
            align="left"
            header-align="center"
            width="180"
            min-width="140"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.name) || '--'"
              >{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="规格"
            align="left"
            header-align="center"
            width="130"
            min-width="110"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.speci) || '--'"
              >{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="型号"
            align="left"
            header-align="center"
            width="120"
            min-width="100"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.model) || '--'"
              >{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" min-width="80" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" align="center" prop="unitPrice" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice | formatPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" align="center" prop="qty" width="100" min-width="90" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-input
                clearable
                v-model="scope.row.qty"
                placeholder="数量"
                size="small"
                class="detail-cell-fluid-input"
                onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="金额" align="center" prop="amt" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" prop="batchNumber" width="140" min-width="120" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" :disabled="true" placeholder="批号" size="small" class="detail-cell-fluid-input" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="beginTime" width="128" min-width="128" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              size="small"
                              class="detail-cell-fluid-input"
                              placeholder="生产日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" align="center" prop="endTime" width="128" min-width="128" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              size="small"
                              class="detail-cell-fluid-input"
                              placeholder="有效期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column
            label="批次号"
            align="center"
            prop="batchNo"
            width="200"
            min-width="160"
            :show-overflow-tooltip="false"
            class-name="detail-col-batch-no"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span class="detail-batch-no-cell" :title="scope.row.batchNo || ''">{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已引用" align="center" prop="srcRefedQty" width="72" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="可引用" align="center" prop="srcRefableQty" width="72" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="140" min-width="120" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" :disabled="true" placeholder="备注" size="small" class="detail-cell-fluid-input" />
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="生产厂家"
            align="left"
            header-align="center"
            width="180"
            min-width="150"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--'"
              >{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material && scope.row.material.isWay"/>
            </template>
          </el-table-column>
        </el-table>
        </div>
        </div>
        </el-form>
        <SelectInventory
          :nested="true"
          v-show="DialogComponentShow"
          :DialogComponentShow="DialogComponentShow"
          :warehouseValue="warehouseValue"
          :supplierValue="supplierValue"
          :hide-supplier-query="true"
          modal-title="TH-添加明细"
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
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectUser from '@/components/SelectModel/SelectUser'
import SelectInventory from '@/components/SelectModel/SelectInventory'

export default {
  name: 'RefundGoodsAuditEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'RefundGoodsAudit')],
  components: { SelectWarehouse, SelectUser, SelectInventory },
  dicts: ['way_status'],
  inheritAttrs: false
}
</script>
