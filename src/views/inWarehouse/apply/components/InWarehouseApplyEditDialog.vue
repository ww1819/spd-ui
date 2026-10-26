<template>
    <!-- 添加或修改入库对话框 -->
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
              <SelectWarehouse ref="formWarehouseSelect" v-model="form.warehouseId" :value2="stkIoBillEntryList.length > 0" :excludeWarehouseType="['高值', '设备']" blockDisabledForInbound placeholder="仓库"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="总金额" prop="totalAmount" class="apply-modal-label-required">
              <el-input :value="formatAmount(form.totalAmount)" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col v-if="action" class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="科室" prop="departmentId" class="inbound-dept-form-item">
              <SelectDepartment v-model="form.departmentId" field-placeholder="科室" clearable />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" placeholder="发票号" />
            </el-form-item>
          </el-col>
          <el-col v-if="!action" class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="制单人">
              <el-input
                :value="(form.creater && (form.creater.nickName || form.creater.userName)) || form.createrName || '--'"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-input v-model="form.invoiceTime" clearable placeholder="发票时间" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="form.proPerson"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="form.delPerson" placeholder="配送员" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="form.telephone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="form.invoiceAmount" placeholder="发票金额" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用采购订单号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" class="apply-modal-form-row apply-modal-row-third" type="flex">
          <el-col v-if="action" :span="7">
            <el-form-item label="引用配送单" label-width="92px" class="delivery-ref-form-item" :title="deliveryRefBlockTitle">
              <el-input
                v-model="deliveryRefKeyword"
                placeholder="配送单号/配送单输入码"
                clearable
                :disabled="deliveryRefBlocked"
                @keyup.enter.native="handleRefDeliverySubmit"
              >
                <el-button slot="append" icon="el-icon-search" :disabled="deliveryRefBlocked" @click="handleRefDeliverySubmit">引用</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col v-if="action" :span="8">
            <el-form-item label="扫描条码" label-width="80px" class="detail-scan-form-item">
              <el-input
                ref="scanBarcodeInputRef"
                v-model="scanBarcodeInput"
                placeholder="扫码或输入条码后回车"
                title="请用扫码枪扫描或键盘输入条码后回车，自动解析主/辅条码并匹配产品档案"
                clearable
                size="small"
                class="scan-barcode-input"
                @keyup.enter.native="onScanBarcodeSubmit"
              >
                <template slot="prepend">
                  <i class="el-icon-s-operation"></i>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col v-if="action" :span="5">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
            </el-form-item>
          </el-col>
          <el-col v-else :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">入库明细信息</span>
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
                size="small"
                class="spd-btn spd-btn--secondary"
                icon="el-icon-ref"
                @click="refDingdan"
              >引用采购订单</el-button>
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
              <el-button
                v-if="isZqTenant"
                type="primary"
                size="small"
                :disabled="!form.id || String(form.billStatus) === '2'"
                @click="handleModalAudit"
                v-hasPermi="['inWarehouse:apply:audit']"
              >审核</el-button>
            </template>
            <!-- 枣强：审核完成后可打印（审核后 action=false，故放在 action 模板外） -->
            <el-button
              v-if="isZqTenant"
              type="primary"
              size="small"
              class="spd-btn spd-btn--secondary"
              icon="el-icon-printer"
              :disabled="!form.id || String(form.billStatus) !== '2'"
              @click="handleModalPrint"
            >打印</el-button>
          </div>
        </el-row>

        <div class="modal-detail-section apply-modal-table-panel">
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="applyDetailRowClassName"
                  class="apply-detail-table"
                  show-summary :summary-method="getSummariesWithRefresh"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  @row-dblclick="handleDetailRowDblclick"
                  ref="stkIoBillEntry"
                  border
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
          <!-- 主条码、辅条码列隐藏（数据仍可通过顶部扫描条码写入，如需恢复可取消注释） -->
          <!--
          <el-table-column label="主条码" align="center" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.mainBarcode" placeholder="主条码(udi)"
                        size="small" clearable
                        @blur="onMainBarcodeBlur(scope.row)">
              </el-input>
            </template>
          </el-table-column>
          <el-table-column label="辅条码" align="center" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.subBarcode" placeholder="辅条码" size="small" clearable />
            </template>
          </el-table-column>
          -->
          <el-table-column label="产品编码" align="center" width="120" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
          </el-table-column>
          <!-- 耗材列隐藏 -->
          <!--<el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>-->

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
          <el-table-column label="单位" align="center" width="80" min-width="80" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" align="center" prop="qty" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <div
                class="detail-cell-focus-wrap"
                :class="{ 'detail-cell-locked': !action }"
                :data-detail-row="scope.$index"
                data-detail-col="qty"
                v-detail-cell-nav
              >
                <el-input
                  :clearable="!!action"
                  :readonly="!action"
                  v-model="scope.row.qty"
                  placeholder="数量"
                  onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                  onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                  @blur="form.result=$event.target.value"
                  @input="qtyChange(scope.row)"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="价格" align="center" prop="unitPrice" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <div style="text-align: center;">
                <span>{{ scope.row.unitPrice | formatPrice }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="金额" align="center" prop="amt" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <div style="text-align: center;">
                <span>{{ scope.row.amt | formatAmount }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="批号"
            align="center"
            prop="batchNumber"
            width="140"
            min-width="120"
            :show-overflow-tooltip="false"
            class-name="detail-col-batch"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <div
                class="detail-cell-edit-wrap detail-batch-wrap detail-cell-focus-wrap"
                :class="{ 'detail-cell-locked': !action }"
                :data-detail-row="scope.$index"
                data-detail-col="batchNumber"
                v-detail-cell-nav
              >
                <el-input
                  v-model="scope.row.batchNumber"
                  :placeholder="scope.row.batchNumber ? '' : '批号'"
                  :readonly="!action"
                  :clearable="!!action"
                  size="small"
                  class="detail-batch-input"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="beginTime" width="128" min-width="128" :show-overflow-tooltip="false" resizable sortable class-name="detail-col-begin-date">
            <template slot-scope="scope">
              <div
                class="detail-cell-edit-wrap detail-begin-date-wrap detail-cell-focus-wrap"
                :class="{ 'detail-cell-locked': !action }"
                :data-detail-row="scope.$index"
                data-detail-col="beginTime"
                v-detail-cell-nav
              >
                <el-date-picker
                  :clearable="!!action"
                  :readonly="!action"
                  :editable="!!action"
                  v-model="scope.row.beginTime"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerBeginTimeOptions"
                  :placeholder="detailDatePlaceholder(scope.row.beginTime, '生产日期')"
                  size="small"
                  :class="['detail-date-begin', { 'detail-date-has-value': hasDetailDateValue(scope.row.beginTime) }]"
                  @blur="onDetailDateBlur(scope.row, 'beginTime', $event)"
                  @change="onDetailBeginTimeChange(scope.row, $event)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="有效期"
            align="center"
            prop="endTime"
            width="190"
            min-width="170"
            :show-overflow-tooltip="false"
            class-name="detail-col-date"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-expiry-wrap" :class="{ 'detail-cell-locked': !action }">
                <div class="detail-cell-focus-wrap detail-expiry-date-wrap" :data-detail-row="scope.$index" data-detail-col="endTime" v-detail-cell-nav>
                  <el-date-picker
                    :clearable="!!action"
                    :readonly="!action"
                    :editable="!!action"
                    v-model="scope.row.endTime"
                    type="date"
                    value-format="yyyy-MM-dd"
                    :picker-options="pickerEndTimeOptions"
                    :placeholder="detailDatePlaceholder(scope.row.endTime, '有效期')"
                    size="small"
                    :disabled="!!scope.row._longTerm"
                    :class="['detail-date-expiry', { 'detail-date-has-value': hasDetailDateValue(scope.row.endTime) }]"
                    style="width: 100%"
                    @blur="onDetailDateBlur(scope.row, 'endTime', $event)"
                    @change="onDetailEndTimeChange(scope.row, $event)"
                  />
                </div>
                <el-checkbox
                  v-model="scope.row._longTerm"
                  class="detail-long-term-check"
                  @change="onLongTermChange(scope.row)"
                >长期</el-checkbox>
              </div>
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
          <el-table-column label="包装规格" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
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
              <span
                class="detail-batch-no-cell"
                :title="scope.row.batchNo || ''"
              >{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
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
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="140" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <div class="detail-cell-focus-wrap" :data-detail-row="scope.$index" data-detail-col="remark" v-detail-cell-nav>
                <el-input
                  v-model="scope.row.remark"
                  placeholder="备注"
                  size="small"
                  class="detail-input-compact"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>
        </div>
        </div>
        </el-form>
        <SelectMaterialFilter
          :nested="true"
          v-show="DialogComponentShow"
          :DialogComponentShow="DialogComponentShow"
          :supplierValue="supplierValue"
          :warehouseValue="form.warehouseId"
          :useStkInventory="true"
          :useFixedNumberMaterialArchive="true"
          :hideStockDetailColumns="true"
          modal-title="RK-添加明细"
          @closeDialog="closeDialog"
          @selectData="selectData"
        />
        <SelectDingdan
          :nested="true"
          v-show="DialogDingdanComponentShow"
          :DialogComponentShow="DialogDingdanComponentShow"
          :warehouseValue="warehouseValue"
          :departmentValue="departmentValue"
          :supplierValue="supplierValue"
          :materialValue="materialValue"
          modal-title="引用采购订单"
          @closeDialog="closeDingdanDialog"
          @selectData="selectDingdanData"
        />
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectMaterial from '@/components/SelectModel/SelectMaterial'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
import SelectUser from '@/components/SelectModel/SelectUser'
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter'
import SelectDingdan from '@/components/SelectModel/SelectDingdan'

export default {
  name: 'InWarehouseApplyEditDialog',
  dicts: ['way_status'],
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.deliveryMatchDialog !== undefined)],
  components: { SelectSupplier, SelectMaterial, SelectWarehouse, SelectDepartment, SelectUser, SelectMaterialFilter, SelectDingdan },
  directives: {
    detailCellNav: {
      bind(el, binding, vnode) {
        const handler = (event) => {
          const rowAttr = el.getAttribute('data-detail-row');
          const colKey = el.getAttribute('data-detail-col');
          if (rowAttr == null || !colKey) return;
          const vm = vnode.context;
          if (vm && typeof vm.onDetailCellKeydown === 'function') {
            vm.onDetailCellKeydown(event, Number(rowAttr), colKey);
          }
        };
        el.addEventListener('keydown', handler, true);
        el._detailCellNavHandler = handler;
      },
      unbind(el) {
        if (el._detailCellNavHandler) {
          el.removeEventListener('keydown', el._detailCellNavHandler, true);
          delete el._detailCellNavHandler;
        }
      }
    }
  },
  inheritAttrs: false
}
</script>
