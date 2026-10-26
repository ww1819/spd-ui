<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>

            <el-form ref="form" :model="form" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="单据号" prop="billNo" class="form-item-header-billno">
                      <el-input v-model="form.billNo" :disabled="true" :title="form.billNo || ''" placeholder="保存后生成" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="调价类型" prop="adjustType" class="apply-modal-label-required">
                      <el-select v-model="form.adjustType" placeholder="调价类型" clearable class="header-field-select-compact">
                        <el-option
                          v-for="item in adjustTypeOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="供应商" prop="supplierId" class="form-item-header-supplier apply-modal-label-required">
                      <SelectSupplier v-model="form.supplierId" :onlyEnabled="true" placeholder="供应商" class="header-field-select-compact" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="billDate">
                      <el-date-picker
                        v-model="form.billDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="制单日期"
                        style="width: 100%"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人">
                      <el-input v-model="form.createByName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="联系人" prop="contactName">
                      <el-input v-model="form.contactName" placeholder="联系人" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="联系方式" prop="contactPhone">
                      <el-input v-model="form.contactPhone" placeholder="联系方式" clearable />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人">
                      <el-input v-model="form.auditByName" :disabled="true" placeholder="审核后生成" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="审核日期" prop="auditDate">
                      <el-date-picker
                        v-model="form.auditDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="审核后生成"
                        style="width: 100%"
                        disabled
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--remark">
                    <el-form-item label="调价原因" prop="adjustReason">
                      <el-input v-model="form.adjustReason" placeholder="调价原因" clearable :disabled="formReadonly" maxlength="500" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--remark">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="formReadonly" maxlength="500" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">调价明细信息</span>
                  <el-button
                    v-if="!formReadonly"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    icon="el-icon-plus"
                    @click="handleAddDetail"
                  >添加</el-button>
                  <el-button
                    v-if="!formReadonly"
                    type="danger"
                    size="small"
                    icon="el-icon-delete"
                    @click="handleDeleteDetail"
                  >删除</el-button>
                  <el-button
                    v-if="!formReadonly"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    icon="el-icon-check"
                    :loading="saving"
                    @click="submitForm"
                  >保 存</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    :data="detailList"
                    class="apply-detail-table"
                    border
                    show-summary
                    :summary-method="getSummaries"
                    :height="detailTableHeight"
                    @selection-change="handleDetailSelectionChange"
                  >
                    <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
                    <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable />
                    <el-table-column label="产品编码" align="center" prop="materialCode" min-width="120" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialCode || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column
                      label="产品名称"
                      align="left"
                      header-align="center"
                      prop="materialName"
                      min-width="160"
                      :show-overflow-tooltip="false"
                      class-name="detail-col-text-wrap"
                      resizable
                      sortable
                    >
                      <template slot-scope="scope">
                        <span class="detail-text-cell-2line" :title="scope.row.materialName || '--'">{{ scope.row.materialName || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="center" prop="speci" min-width="110" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.speci || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="center" prop="model" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.model || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" prop="unit" width="70" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unit || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="原价" align="center" prop="oldPrice" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span class="price-cell-red">{{ scope.row.oldPrice != null && scope.row.oldPrice !== '' ? scope.row.oldPrice : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="现价" align="center" prop="newPrice" min-width="110" resizable>
                      <template slot-scope="scope">
                        <el-input
                          v-model="scope.row.newPrice"
                          size="small"
                          class="detail-input-compact price-input-red"
                          placeholder="现价"
                          clearable
                          @input="onNewPriceInput(scope.row)"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column label="财务分类" align="center" prop="financeClass" min-width="110" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.financeClass || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" prop="manufacturer" min-width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.manufacturer || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" align="center" prop="regNo" min-width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.regNo || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证有效期" align="center" prop="regValidDate" min-width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.regValidDate || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="包装规格" align="center" prop="packSpeci" min-width="110" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.packSpeci || '--' }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-form>
            <SelectMaterialFilter
              :nested="true"
              v-show="dialogMaterialShow"
              :DialogComponentShow="dialogMaterialShow"
              :supplierValue="form.supplierId"
              :excludeMaterialIds="excludeMaterialIds"
              :hideStockDetailColumns="true"
              column-preset="priceAdjust"
              modal-title="TJ-添加明细"
              @closeDialog="closeMaterialDialog"
              @selectData="selectMaterialData"
            />
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'

export default {
  name: 'PriceAdjustEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PriceAdjust')],
  components: { SelectMaterialFilter, SelectSupplier },
  inheritAttrs: false
}
</script>
