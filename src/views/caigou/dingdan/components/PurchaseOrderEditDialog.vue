<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" class="modal-form-compact">
        <div class="form-fields-container">
        <el-row>
          <el-col :span="4">
            <el-form-item label="订单状态" prop="orderStatus" label-width="100px">
              <el-select v-model="form.orderStatus" placeholder="请选择订单状态"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="form.warehouseId"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="高值/低值" label-width="100px">
              <el-input :value="formatIsGzLabel(form.isGz)" disabled />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="订单日期" prop="orderDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.orderDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择订单日期">
              </el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
             <!-- <SelectUser v-model="form.userId"/> -->
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="联系电话" prop="contactPhone" label-width="100px">
              <el-input v-model="form.contactPhone" placeholder="联系电话" />
            </el-form-item>
          </el-col>

        </el-row>

        <el-row>

          <el-col :span="4">
            <el-form-item label="供应商" prop="supplierId" label-width="100px">
              <SelectSupplier v-model="form.supplierId"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount" label-width="100px">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

<!--        <el-divider content-position="left">订单明细信息</el-divider>-->
        <div class="modal-detail-section">
        <el-row :gutter="10" class="mb8 detail-toolbar-row">
          <el-col :span="1.5">
            <span>订单明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
  <!--            <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddStkIoBillEntry">添加</el-button>-->
              <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeletePurchaseOrderEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>
        <div class="table-wrapper">
        <el-table :data="purchaseOrderEntryList" :row-class-name="rowPurchaseOrderEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handlePurchaseOrderEntrySelectionChange"
                  ref="purchaseOrderEntry"
                  :height="detailTableHeight"
                  border
        >
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="耗材" prop="materialId" width="120">
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="materialSpec" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.materialSpec" :disabled="true" placeholder="无" />
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="materialName" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.materialName" :disabled="true" placeholder="无" />
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="orderQty" width="120">
            <template slot-scope="scope">
              <el-input
                v-model.number="scope.row.orderQty"
                type="number"
                :min="1"
                placeholder="数量"
                @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="unitPrice" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" type='number'
                        :disabled="true"
                        @input="priceChange(scope.row)" placeholder="价格" />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="totalAmount" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.totalAmount" :disabled="true" placeholder="金额" />
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column v-if="!action" label="操作" align="center" width="120" fixed="right">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.planEntryId"
                size="mini"
                type="text"
                icon="el-icon-tickets"
                @click="handleViewApplyDetails(scope.row)"
              >查看申购明细</el-button>
            </template>
          </el-table-column>
        </el-table>
        </div>
        </div>
      </el-form>
            <div v-show="action" class="modal-footer">
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
import SelectMaterial from '@/components/SelectModel/SelectMaterial'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'PurchaseOrderEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchaseOrder')],
  components: { SelectSupplier, SelectMaterial, SelectWarehouse },
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
