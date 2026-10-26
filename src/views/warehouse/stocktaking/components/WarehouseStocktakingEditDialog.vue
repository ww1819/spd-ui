<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">

        <el-row>
          <el-col :span="4">
            <el-form-item label="单据状态" prop="billStatus" label-width="100px">
              <el-select v-model="form.billStatus" placeholder="请选择单据状态"
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
<!--          <el-col :span="4">-->
<!--            <el-form-item label="盘点类型" prop="billType" label-width="100px">-->
<!--              <el-select v-model="form.billType" placeholder="请选择盘点类型"-->
<!--                         :disabled="true"-->
<!--                         clearable style="width: 150px">-->
<!--                <el-option v-for="dict in dict.type.bill_type"-->
<!--                           :key="dict.value"-->
<!--                           :label="dict.label"-->
<!--                           :value="dict.value"-->
<!--                />-->
<!--              </el-select>-->
<!--            </el-form-item>-->
<!--          </el-col>-->
          <el-col :span="4">
            <el-form-item label="盘点日期" prop="billDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.billDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择盘点日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="80px">
              <SelectWarehouse v-model="form.warehouseId"/>
            </el-form-item>

          </el-col>
<!--          <el-col :span="4">-->
<!--            <el-form-item label="科室" prop="departmentId" label-width="100px">-->
<!--              <SelectDepartment v-model="form.departmentId"/>-->
<!--            </el-form-item>-->

<!--          </el-col>-->
          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
<!--              <SelectUser v-model="form.userId"/>-->
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>盘点明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
  <!--            <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddStkIoBillEntry">添加</el-button>-->
              <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry" height="calc(42vh)" border
        >
          <el-table-column type="selection" width="50" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
<!--              <SelectMaterial v-model="scope.row.materialId" :disabled="isShow" />-->
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow" />
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
<!--              <el-input v-model="scope.row.unitPrice" placeholder="单价" />-->
              <span>{{ scope.row.unitPrice | formatPrice }}</span>
            </template>
          </el-table-column>

          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.qty" type='number' @input="qtyChange(scope.row)" placeholder="数量" />
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="批次号" />
            </template>
          </el-table-column>

          <el-table-column label="批号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" label-width="200px" placeholder="批号" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择盘点日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择盘点日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="400" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
        </el-table>
            </el-form>
            <div class="modal-footer" v-show="action">
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
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectMaterial from '@/components/SelectModel/SelectMaterial'

export default {
  name: 'WarehouseStocktakingEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Warehouse' && vm.$el && vm.$el.classList && vm.$el.classList.contains('stocktaking-page'))],
  components: { SelectWarehouse, SelectMaterial },
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
