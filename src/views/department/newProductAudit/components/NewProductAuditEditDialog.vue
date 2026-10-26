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
                      <SelectDepartment v-model="form.departmentId" :disabled="true" :finance-pick-mode="true" />
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
                      <el-input v-model="form.reasonAndBenefit" :disabled="true" placeholder="申请理由及效益分析" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col :span="4">
                    <el-form-item label="分析评估" prop="remark" label-width="100px">
                      <el-input v-model="form.remark" :disabled="true" placeholder="分析评估" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="医保" prop="medicalInsurance" label-width="100px">
                      <el-select v-model="form.medicalInsurance" placeholder="请选择" clearable :disabled="true" style="width: 150px">
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="集采" prop="centralizedProcurement" label-width="100px">
                      <el-select v-model="form.centralizedProcurement" placeholder="请选择" clearable :disabled="true" style="width: 150px">
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="采购形式" prop="procurementForm" label-width="100px">
                      <el-select v-model="form.procurementForm" placeholder="请选择" clearable :disabled="true" style="width: 150px">
                        <el-option label="长期" value="长期" />
                        <el-option label="临采" value="临采" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="平台价格" prop="platformPrice" label-width="100px">
                      <el-input v-model.number="form.platformPrice" type="number" placeholder="平台价格" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>新品申购明细信息</span>
                </el-col>
              </el-row>
        <div class="table-wrapper">
        <el-table :data="applyEntryList" :row-class-name="rowApplyEntryIndex"
                  ref="applyEntry"
                  border
                  :height="tableHeight">
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" prop="materialName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="speci" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.speci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="model" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unitName" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price ? formatPrice(scope.row.price) : '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="品牌要求" prop="brandRequirement" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.brandRequirement || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" prop="factoryName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.factoryName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="特殊说明" prop="specialNote" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.specialNote || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="病案费用类别" prop="caseFeeCategory" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.caseFeeCategory || '--' }}</span>
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
                      <span>{{ scope.row.similarProduct || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="规格" prop="speci" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.speci || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" prop="model" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.model || '--' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 审批操作按钮 -->
              <div v-if="form.applyStatus == 0" style="margin-top: 20px; text-align: right; padding: 16px 24px; border-top: 1px solid #EBEEF5;">
                <el-button type="primary" class="spd-btn spd-btn--primary" @click="handleAuditConfirm" v-hasPermi="['department:newProductAudit:audit']">审核通过</el-button>
                <el-button type="danger" class="spd-btn spd-btn--danger" @click="handleReject" v-hasPermi="['department:newProductAudit:reject']">驳回</el-button>
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
  name: 'NewProductAuditEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'NewProductAudit')],
  components: { SelectDepartment },
  dicts: ['biz_status'],
  inheritAttrs: false
}
</script>
