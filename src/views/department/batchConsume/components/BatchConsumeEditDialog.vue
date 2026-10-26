<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div
            v-if="open"
            class="local-modal-content apply-modal-root-content"
          >
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>

              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="单号" prop="consumeBillNo" class="form-item-header-billno">
                      <el-input v-model="form.consumeBillNo" :disabled="true" :title="form.consumeBillNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="消耗状态" prop="consumeBillStatus">
                      <el-select v-model="form.consumeBillStatus" placeholder="请选择消耗状态" :disabled="true" clearable>
                        <el-option
                          v-for="dict in dict.type.biz_status"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
                      <SelectDepartment v-model="form.departmentId" :disabled="departmentLocked"/>
                    </el-form-item>
                  </el-col>
                  <el-col v-if="showInspectTeamSelector" class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="检验小组" prop="inspectTeamDeptId" label-width="80px">
                      <el-select
                        v-model="form.inspectTeamDeptId"
                        placeholder="可不选"
                        clearable
                        filterable
                        :disabled="!action"
                      >
                        <el-option
                          v-for="item in inspectTeamOptions"
                          :key="item.id"
                          :label="item.name"
                          :value="item.id"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="消耗日期" prop="consumeBillDate">
                      <el-date-picker
                        clearable
                        v-model="form.consumeBillDate"
                        type="date"
                        style="width: 100%"
                        value-format="yyyy-MM-dd"
                        :disabled="true"
                        placeholder="请选择消耗日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="操作人" prop="userId">
                      <SelectUser v-model="form.userId"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--grow" style="flex: 1 1 auto; min-width: 200px;">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" style="width: 100%; max-width: none;" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">科室批量消耗明细信息</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" :disabled="!form.departmentId" @click="nameBtn">添加</el-button>
                    <el-button type="danger" size="small" icon="el-icon-delete" @click="handleDeleteConsumeEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="deptBatchConsumeEntryList"
                :row-class-name="rowDeptBatchConsumeEntryIndex"
                class="apply-detail-table"
                show-summary
                :summary-method="getSummaries"
                @selection-change="handleConsumeEntrySelectionChange"
                ref="deptBatchConsumeEntry"
                border
                :height="detailTableHeight"
              >
                <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="仓库" align="center" width="120" min-width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.stockWarehouse && scope.row.stockWarehouse.name) || (scope.row.warehouse && scope.row.warehouse.name) || '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="产品名称"
                  align="left"
                  header-align="center"
                  prop="material.name"
                  width="180"
                  min-width="140"
                  :show-overflow-tooltip="false"
                  class-name="detail-col-text-wrap"
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNested(a,b,'material.name')"
                >
                  <template slot-scope="scope">
                    <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.name) || '--'">{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="规格"
                  align="left"
                  header-align="center"
                  prop="material.speci"
                  width="130"
                  min-width="110"
                  :show-overflow-tooltip="false"
                  class-name="detail-col-text-wrap"
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNested(a,b,'material.speci')"
                >
                  <template slot-scope="scope">
                    <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.speci) || '--'">{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="型号"
                  align="left"
                  header-align="center"
                  prop="material.model"
                  width="130"
                  min-width="110"
                  :show-overflow-tooltip="false"
                  class-name="detail-col-text-wrap"
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNested(a,b,'material.model')"
                >
                  <template slot-scope="scope">
                    <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.model) || '--'">{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="单位"
                  align="center"
                  prop="material.fdUnit.unitName"
                  width="70"
                  min-width="56"
                  show-overflow-tooltip
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')"
                >
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="单价"
                  prop="unitPrice"
                  width="100"
                  align="right"
                  header-align="center"
                  show-overflow-tooltip
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')"
                >
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice != null && scope.row.unitPrice !== '' ? formatPrice(scope.row.unitPrice) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="数量"
                  prop="qty"
                  width="100"
                  show-overflow-tooltip
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNestedNumber(a,b,'qty')"
                >
                  <template slot-scope="scope">
                    <el-input
                      v-if="action"
                      clearable
                      v-model="scope.row.qty"
                      placeholder="数量"
                      size="small"
                      class="detail-input-compact"
                      onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                      onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                      @input="qtyChange(scope.row)"
                    />
                    <span v-else>{{ scope.row.qty || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="批号" align="center" prop="batchNumer" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.batchNumer || scope.row.batchNo || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产日期" align="center" prop="beginTime" width="110" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatBatchEntryDate(scope.row.beginTime) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="有效期" align="center" prop="endTime" width="110" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatBatchEntryDate(scope.row.endTime) }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="金额"
                  prop="amt"
                  width="120"
                  align="right"
                  header-align="center"
                  show-overflow-tooltip
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNestedNumber(a,b,'amt')"
                >
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <dict-tag v-if="scope.row.material" :options="dict.type.way_status" :value="scope.row.material.isWay"/>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-if="action" v-model="scope.row.remark" placeholder="备注" size="small" class="detail-input-compact" />
                    <span v-else>{{ scope.row.remark || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="action" label="操作" align="center" width="100" class-name="apply-action-col">
                  <template slot-scope="scope">
                    <el-button
                      size="small"
                      type="text"
                      icon="el-icon-delete"
                      @click="handleDeleteDetailRow(scope.$index)"
                      style="padding: 0 5px; margin: 0;"
                    >删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              </div>
              </div>
            </el-form>
            <!-- 嵌套在父弹窗内，避免全屏层被列表页 .local-modal-mask 绝对定位/max-width 挤偏 -->
            <SelectDepInventory
              v-if="DialogComponentShow"
              :nested="true"
              modal-title="XH-科室库存明细"
              :DialogComponentShow="DialogComponentShow"
              :departmentValue="departmentValue"
              :selectedDetails="deptBatchConsumeEntryList"
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
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
import SelectUser from '@/components/SelectModel/SelectUser'
import SelectDepInventory from '@/components/SelectModel/SelectDepInventory'

export default {
  name: 'BatchConsumeEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'BatchConsume')],
  components: { SelectDepartment, SelectUser, SelectDepInventory },
  dicts: ['biz_status','way_status'],
  inheritAttrs: false
}
</script>
