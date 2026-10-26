<template>
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
              <div class="form-fields-container">
                <el-row>
                  <el-col :span="4">
                    <el-form-item :label="currentBillType === '3' ? '转科状态' : '申领状态'" prop="billStatus" label-width="100px">
                      <el-select v-model="form.applyBillStatus" :placeholder="currentBillType === '3' ? '请选择转科状态' : '请选择申领状态'"
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

                  <el-col :span="4" v-if="currentBillType !== '3'">
                    <el-form-item label="科室" prop="departmentId" label-width="100px">
                      <SelectDepartment v-model="form.departmentId"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" v-if="currentBillType === '3'">
                    <el-form-item label="调出科室" prop="warehouseId" label-width="100px">
                      <SelectDepartment v-model="form.warehouseId"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" v-if="currentBillType === '3'">
                    <el-form-item label="调入科室" prop="departmentId" label-width="100px">
                      <SelectDepartment v-model="form.departmentId"/>
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
                      <SelectUser v-model="form.userId"/>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="4" v-if="currentBillType !== '3'">
                    <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                      <SelectWarehouse v-model="form.warehouseId"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>


<!--        <el-divider content-position="center">科室申领明细信息</el-divider>-->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>{{ currentBillType === '3' ? '转科申请明细信息' : '科室申领明细信息' }}</span>
          </el-col>

          <div v-show="action">
            <el-col v-if="canEditCurrent()" :span="1.5">
<!--              <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddBasApplyEntry">添加</el-button>-->
              <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col v-if="canEditCurrent()" :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteBasApplyEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5" v-show="action">
              <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
            </el-col>
            <el-col v-if="canEditCurrent()" :span="1.5" v-show="action">
              <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
            </el-col>
          </div>

        </el-row>
        <el-table :data="basApplyEntryList" :row-class-name="rowBasApplyEntryIndex" @selection-change="handleBasApplyEntrySelectionChange" ref="basApplyEntry" height="calc(32vh)" border :summary-method="getSummaries" show-summary>
          <el-table-column v-if="canEditCurrent()" type="selection" width="60" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
          <el-table-column label="产品名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.materialSpec || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || scope.row.unit || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="数量"
                        onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                        onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.amt && parseFloat(scope.row.amt) > 0">¥{{ scope.row.amt | formatCurrency }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="储存方式" align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay"/>
              <span v-else>--</span>
            </template>
          </el-table-column>


          <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column v-if="canEditCurrent()" label="操作" align="center" width="100" fixed="right">
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
            </el-form>
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

export default {
  name: 'DAuditEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'dAudit')],
  components: { SelectWarehouse, SelectDepartment, SelectUser },
  dicts: ['biz_status','way_status'],
  inheritAttrs: false
}
</script>
