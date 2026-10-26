<template>
    <!-- 添加或修改出库对话框 -->
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
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
              <SelectWarehouse v-model="form.warehouseId" :value2="stkIoBillEntryList.length > 0" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
              <SelectDepartment
                ref="formDepartmentSelect"
                v-model="form.departmentId"
                :value2="stkIoBillEntryList.length > 0"
                @change="handleFormDepartmentChange"
              />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="总金额" prop="totalAmount" class="apply-modal-header-amount">
              <el-input :value="formatAmount(form.totalAmount)" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--date">
            <el-form-item label="制单日期">
              <el-input :value="billDateText" disabled placeholder="—" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用单号" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="领用人" prop="recipientName">
              <el-input v-model="form.recipientName" :disabled="true" placeholder="领用人" />
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

        <el-alert
          v-if="form.whWarehouseApplyId"
          type="warning"
          :closable="false"
          show-icon
          class="wh-apply-outbound-hint"
          title="引用库房申请单出库：「可引用」列为申请数扣减明细作废与其它出库单已占用后的参考值；保存与审核不再强制要求出库数量不得超过该参考值。"
        />

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">出库明细信息</span>
            <template v-if="action">
              <el-button
                v-if="form.id"
                type="warning"
                plain
                icon="el-icon-download"
                size="small"
                class="spd-btn"
                @click="handleExportDetailPickList"
                v-hasPermi="['outWarehouse:apply:export']"
              >导出拣货单</el-button>
              <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="nameBtn">添加</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" icon="el-icon-ref" :disabled="stkIoBillEntryList.length > 0" @click="refDeptApply">引用仓库申请单</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" icon="el-icon-ref" :disabled="stkIoBillEntryList.length > 0" @click="refDepPurchaseApply">引用科室申购单</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" icon="el-icon-ref" :disabled="stkIoBillEntryList.length > 0" @click="refRkApply">引用入库单</el-button>
              <el-button type="danger" size="small" icon="el-icon-delete" @click="handleDeleteStkIoBillEntry">删除</el-button>
              <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
              <el-button
                v-if="isZqTenant"
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                :disabled="!form.id || String(form.billStatus) === '2'"
                @click="handleModalAudit"
                v-hasPermi="['outWarehouse:apply:audit']"
              >审核</el-button>
            </template>
            <!-- 审核完成后显示打印（全局；放在审核按钮后） -->
            <el-button
              v-if="form.id && String(form.billStatus) === '2'"
              type="primary"
              size="small"
              class="spd-btn spd-btn--secondary"
              icon="el-icon-printer"
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
                  ref="stkIoBillEntry"
                  border
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
          <el-table-column label="产品编码" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '—' }}</span>
            </template>
          </el-table-column>
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
                :title="(scope.row.material && scope.row.material.model) || '--'"
              >{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="70" min-width="56" show-overflow-tooltip resizable/>
          <el-table-column label="价格" prop="unitPrice" width="100" align="right" header-align="center" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice | formatPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="110" min-width="100" align="center" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-cell-fluid-wrap">
                <el-input
                  clearable
                  v-model="scope.row.qty"
                  placeholder="数量"
                  size="small"
                  class="detail-cell-fluid-input"
                  style="width: 100%"
                  onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                  onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                  @blur="form.result=$event.target.value"
                  @input="qtyChange(scope.row)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="库存数量" prop="stockQty" width="100" min-width="96" align="center" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ formatEntryStockQty(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="110" align="right" header-align="center" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="140" min-width="120" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input detail-col-batch">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-batch-wrap detail-cell-fluid-wrap">
                <el-input
                  v-model="scope.row.batchNumber"
                  :disabled="true"
                  placeholder="批号"
                  size="small"
                  class="detail-cell-fluid-input detail-batch-input"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="150" min-width="140" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input detail-col-begin-date">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-begin-date-wrap detail-cell-fluid-wrap">
                <el-date-picker
                  clearable
                  v-model="scope.row.beginTime"
                  type="date"
                  :disabled="true"
                  value-format="yyyy-MM-dd"
                  placeholder="请选择生产日期"
                  size="small"
                  class="detail-cell-fluid-input detail-date-begin"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="150" min-width="140" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input detail-col-date">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-cell-fluid-wrap">
                <el-date-picker
                  clearable
                  v-model="scope.row.endTime"
                  type="date"
                  :disabled="true"
                  value-format="yyyy-MM-dd"
                  placeholder="请选择有效期"
                  size="small"
                  class="detail-cell-fluid-input detail-date-expiry"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="160" min-width="140" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span class="batch-no-text" :title="scope.row.batchNo || ''">{{ scope.row.batchNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已引用" prop="srcRefedQty" width="72" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="srcRefableQty" width="88" align="center" show-overflow-tooltip resizable>
            <template slot="header">
              <el-tooltip
                content="可引用=申请数−已作废−其它单已出库占用，仅供参考；出库数量可大于该值。"
                placement="top"
              >
                <span class="table-header-with-tip">可引用<i class="el-icon-question" /></span>
              </el-tooltip>
            </template>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="140" min-width="120" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-cell-fluid-wrap">
                <el-input
                  v-model="scope.row.remark"
                  placeholder="备注"
                  size="small"
                  class="detail-cell-fluid-input"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" prop="material.supplier.name" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="140" show-overflow-tooltip resizable/>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
          <el-table-column v-if="action" label="操作" width="188" align="center" fixed="right" resizable>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="copyOutEntryRow(scope.$index)">复制</el-button>
              <el-button type="text" size="small" style="color:#f56c6c" @click="deleteOutEntryRow(scope.$index)">删除</el-button>
              <el-button type="text" size="small" @click="openPickBatchForRow(scope.$index)">选批次</el-button>
            </template>
          </el-table-column>
        </el-table>
        </div>
        </div>
        </el-form>
        <SelectDApply
          :nested="true"
          v-show="DialogDApplyComponentShow"
          :DialogComponentShow="DialogDApplyComponentShow"
          :departmentValue="departmentValue"
          :warehouseValue="warehouseValue"
          modal-title="引用仓库申请单"
          @closeDialog="closeDApplyDialog"
          @selectWhApplyData="selectWhApplyData"
        />
        <SelectDepPurchaseApply
          :nested="true"
          v-show="DialogDepPurchaseApplyComponentShow"
          :DialogComponentShow="DialogDepPurchaseApplyComponentShow"
          :departmentValue="departmentValue"
          :warehouseValue="warehouseValue"
          modal-title="引用科室申购单"
          @closeDialog="closeDepPurchaseApplyDialog"
          @selectDepPurchaseApplyData="selectDepPurchaseApplyData"
        />
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
import SelectUser from '@/components/SelectModel/SelectUser'
import SelectDApply from '@/components/SelectModel/SelectDApply'
import SelectDepPurchaseApply from '@/components/SelectModel/SelectDepPurchaseApply'

export default {
  name: 'OutWarehouseApplyEditDialog',
  dicts: ['way_status'],
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.rkOutDeptDialogVisible !== undefined)],
  components: { SelectWarehouse, SelectDepartment, SelectUser, SelectDApply, SelectDepPurchaseApply },
  inheritAttrs: false
}
</script>
