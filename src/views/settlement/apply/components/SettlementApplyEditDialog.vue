<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="单据号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="供应商" prop="supplerId">
              <SelectSupplier v-model="form.supplerId" :value2="stkIoBillEntryList.length > 0"/>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :value2="stkIoBillEntryList.length > 0" excludeWarehouseType="高值"/>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" placeholder="发票号" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="8">
            <el-form-item label="日期起止" label-width="80px">
              <el-date-picker
                              v-model="form.beginDate"
                              type="date"
                              value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                style="width: 160px;"
              />
              <span style="margin: 0 8px;">至</span>
              <el-date-picker
                              v-model="form.endDate"
                              type="date"
                              value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                style="width: 160px;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8" style="margin-top: 10px;">
          <el-col :span="8">
            <el-form-item label=" " label-width="80px">
              <el-button type="primary" size="small" @click="handleGenerateSettlement" :disabled="!selectedSupplierId || stkIoBillEntryList.length === 0">生成结算单</el-button>
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearchSettlement" style="margin-left: 8px;">搜索</el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" v-show="false">
          <el-col :span="4">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="form.proPerson"/>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input :value="formatAmount(form.totalAmount)" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="form.delPerson" placeholder="配送员" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="form.telephone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="form.invoiceAmount" placeholder="发票金额" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" v-show="false">
          <el-col :span="4">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-date-picker clearable
                              v-model="form.invoiceTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              style="width: 100%"
                              placeholder="发票时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用采购订单号" />
            </el-form-item>
          </el-col>
        </el-row>

<!-- 左右分栏布局：左边供应商列表，右边结算明细 -->
        <el-row :gutter="10" style="margin-top: 10px;">
          <!-- 左边：供应商列表 -->
          <el-col :span="8" style="border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px;">
            <div style="font-weight: bold; margin-bottom: 10px;">供应商</div>
            <el-table 
              ref="supplierTable"
              :data="supplierList" 
              height="48vh"
              border
              highlight-current-row
              @current-change="handleSupplierChange"
              @selection-change="handleSupplierSelectionChange"
              v-loading="supplierLoading"
            >
              <el-table-column type="selection" width="55" align="center"/>
              <el-table-column label="序号" type="index" width="60" align="center"/>
              <el-table-column label="供应商名称" prop="name" show-overflow-tooltip/>
              <el-table-column label="总金额" width="120" align="right">
                <template slot-scope="scope">
                  <span>{{ (scope.row.totalAmount || getSupplierTotalAmount(scope.row.id)) | formatCurrency }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
          
          <!-- 右边：结算明细信息 -->
          <el-col :span="16" style="border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px;">
            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <span>结算明细信息</span>
              </el-col>

              <div v-show="action">
                <el-col :span="1.5" v-show="false">
                  <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId || !selectedSupplierId">添加</el-button>
                </el-col>
                <el-col :span="1.5">
                </el-col>
                <el-col :span="1.5">
                  <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
                </el-col>
              </div>
            </el-row>
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                   height="48vh"
        >
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" align="left" prop="index" width="50" show-overflow-tooltip resizable/>
          <!-- 耗材列隐藏 -->
          <!--<el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>-->

          <el-table-column label="产品名称" align="left" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="left" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="left" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="left" prop="material.fdUnit.unitName" width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="60" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <!--              <el-input v-model="scope.row.qty" type='number' :min="1"-->
              <!--                        @input="qtyChange(scope.row)"-->
              <!--                        placeholder="数量" />-->
              <el-input
                clearable
                v-model="scope.row.qty"
                placeholder="数量"
                onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                @blur="form.result=$event.target.value"
                @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice | formatPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber"  placeholder="批号" />
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :picker-options="pickerEndTimeOptions"
                              placeholder="请选择日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :picker-options="pickerBeginTimeOptions"
                              placeholder="请选择日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="批次号" />
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="仓库" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.warehouseName) || (form.warehouse && form.warehouse.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="结算类型" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ getSettlementTypeName(scope.row.settlementType) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
        </el-table>
        </div>
          </el-col>
        </el-row>
        </el-form>
        <div v-show="false" class="modal-footer">
          <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
          <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
        </div>
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectUser from '@/components/SelectModel/SelectUser'
import SelectMaterial from '@/components/SelectModel/SelectMaterial'

export default {
  name: 'SettlementApplyEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'SettlementApply')],
  components: { SelectSupplier, SelectWarehouse, SelectUser, SelectMaterial },
  dicts: ['way_status'],
  inheritAttrs: false
}
</script>
