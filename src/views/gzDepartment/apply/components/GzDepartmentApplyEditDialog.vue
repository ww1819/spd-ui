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
            <el-form-item label="申领状态" prop="billStatus" label-width="100px">
              <el-select v-model="form.applyBillStatus" placeholder="请选择申领状态"
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
            <el-form-item label="申请日期" prop="applyBillDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.applyBillDate"
                              type="date"
                              style="width: 150px"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              placeholder="请选择申请日期">
              </el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="userId" label-width="100px">
              <SelectDeptApplyOperator v-model="form.userId"/>
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
            <span>高值科室申领明细信息</span>
          </el-col>
          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzDepApplyEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>

        <el-table :data="gzDepApplyEntryList" :row-class-name="rowGzDepApplyEntryIndex"
                  @selection-change="handleGzDepApplyEntrySelectionChange"
                  ref="gzDepApplyEntry" height="calc(42vh)" border>
          <el-table-column type="selection" width="50" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材" prop="materialId" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="true"/>
            </template>
          </el-table-column>

          <el-table-column label="数量" prop="qty" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="数量"
                        onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                        onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="单价" prop="unitPrice" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" type='number' @input="priceChange(scope.row)" placeholder="单价" />
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>

          <el-table-column label="批次号" prop="batchNo" width="450" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" label-width="200px" placeholder="批次号" />
            </template>
          </el-table-column>


          <el-table-column label="批号" prop="batchNumer" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumer" placeholder="批号" />
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="150" show-overflow-tooltip resizable>
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
import SelectDeptApplyOperator from '@/components/SelectModel/SelectDeptApplyOperator'
import SelectMaterial from '@/components/SelectModel/SelectMaterialDept'

export default {
  name: 'GzDepartmentApplyEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'GZDepartmentApply')],
  components: { SelectWarehouse, SelectDeptApplyOperator, SelectMaterial },
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
