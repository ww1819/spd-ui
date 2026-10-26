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
                    <el-form-item label="科室" prop="departmentId" label-width="100px">
                      <SelectDepartment v-model="form.departmentId" :disabled="!action" :finance-pick-mode="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="单据状态" prop="applyStatus" label-width="100px">
                      <el-select v-model="form.applyStatus" placeholder="请选择单据状态"
                                 :disabled="true"
                                 clearable style="width: 150px">
                        <el-option v-for="dict in filteredBizStatus"
                                   :key="dict.value"
                                   :label="dict.label"
                                   :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="applyDate" label-width="100px">
                      <el-date-picker clearable
                                      v-model="form.applyDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 150px"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="申请人" prop="createBy" label-width="100px">
                      <el-input v-model="form.createBy" :disabled="true" placeholder="申请人" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="申请理由及效益分析" prop="reasonAndBenefit" label-width="100px">
                      <el-input v-model="form.reasonAndBenefit" placeholder="申请理由及效益分析" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col :span="4">
                    <el-form-item label="分析评估" prop="remark" label-width="100px">
                      <el-input v-model="form.remark" placeholder="分析评估" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="医保" prop="medicalInsurance" label-width="100px">
                      <el-select v-model="form.medicalInsurance" placeholder="请选择" clearable :disabled="!action" style="width: 150px">
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="集采" prop="centralizedProcurement" label-width="100px">
                      <el-select v-model="form.centralizedProcurement" placeholder="请选择" clearable :disabled="!action" style="width: 150px">
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="采购形式" prop="procurementForm" label-width="100px">
                      <el-select v-model="form.procurementForm" placeholder="请选择" clearable :disabled="!action" style="width: 150px">
                        <el-option label="长期" value="长期" />
                        <el-option label="临采" value="临采" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="平台价格" prop="platformPrice" label-width="100px">
                      <el-input v-model.number="form.platformPrice" type="number" placeholder="平台价格" :disabled="!action" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>新品申购明细信息</span>
                </el-col>
                <div v-show="action">
                  <el-col :span="1.5">
                    <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">保存</el-button>
                  </el-col>
                </div>
              </el-row>
        <div class="table-wrapper">
        <el-table :data="applyEntryList" :row-class-name="rowApplyEntryIndex"
                  ref="applyEntry"
                  border
                  :height="tableHeight">
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" prop="materialName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.materialName" placeholder="耗材名称" />
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="speci" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.speci" placeholder="规格" />
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="model" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.model" placeholder="型号" />
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unitName" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.unitName" placeholder="单位" />
            </template>
          </el-table-column>
          <el-table-column label="单价" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.price" placeholder="单价"
                        @input="priceChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="品牌要求" prop="brandRequirement" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.brandRequirement" placeholder="品牌要求" />
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" prop="factoryName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.factoryName" placeholder="生产厂家" />
            </template>
          </el-table-column>
          <el-table-column label="特殊说明" prop="specialNote" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.specialNote" placeholder="特殊说明" />
            </template>
          </el-table-column>
          <el-table-column label="病案费用类别" prop="caseFeeCategory" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-select v-model="scope.row.caseFeeCategory" placeholder="请选择病案费用类别" clearable style="width: 100%">
                <el-option label="检查用一次性医用材料" value="检查用一次性医用材料" />
                <el-option label="治疗用一次性医用材料" value="治疗用一次性医用材料" />
                <el-option label="手术用一次性医用材料" value="手术用一次性医用材料" />
              </el-select>
            </template>
          </el-table-column>
              </el-table>
              </div>

              <!-- 第二个明细框 -->
              <el-row :gutter="10" class="mb8" style="margin-top: 20px;">
                <el-col :span="1.5">
                  <span>院内同类产品信息</span>
                </el-col>
              </el-row>
              <div class="table-wrapper-second">
                <el-table :data="applyDetailList" :row-class-name="rowApplyDetailIndex"
                          ref="applyDetail"
                          border
                          :height="detailTableHeight">
                  <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable/>
                  <el-table-column label="我院同类产品" prop="similarProduct" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input clearable v-model="scope.row.similarProduct" placeholder="我院同类产品" />
                    </template>
                  </el-table-column>
                  <el-table-column label="规格" prop="speci" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input clearable v-model="scope.row.speci" placeholder="规格" />
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" prop="model" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input clearable v-model="scope.row.model" placeholder="型号" />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

export default {
  name: 'NewProductApplyEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'NewProductApply')],
  components: { SelectDepartment },
  inheritAttrs: false
}
</script>
