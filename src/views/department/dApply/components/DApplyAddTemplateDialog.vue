<template>
    <!-- 新增制单模板弹窗：样式与添加科室申领一致 -->
    <transition name="modal-fade">
      <div v-if="addTemplateDialogVisible" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="addTemplateDialogVisible" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ addTemplateAppendMode ? '往当前模板插入明细' : '新增制单模板' }}</div>
              <el-button size="small" @click="closeAddTemplateDialog" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="addTemplateFormRef" :model="addTemplateForm" :rules="addTemplateRules" label-width="70px" size="small" class="modal-form-compact modal-form-wrapper add-template-form">
              <div class="form-fields-container add-template-search-row">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="供应商名称" prop="supplierId">
                      <SelectSupplier v-model="addTemplateForm.supplierId" :value2="false"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="产品名称" prop="materialKeyword">
                      <el-input v-model="addTemplateForm.materialKeyword" placeholder="请输入产品名称或首字母" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="规格搜索" prop="speciSearch">
                      <el-input v-model="addTemplateForm.speciSearch" placeholder="请输入规格或首字母" clearable />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>模板明细信息</span>
                </el-col>
                <el-col :span="1.5" v-show="false">
                  <el-button type="primary" icon="el-icon-plus" size="medium" @click="nameBtnForTemplate">添加</el-button>
                </el-col>
                <el-col :span="1.5" v-show="false">
                  <el-button type="danger" icon="el-icon-delete" size="medium" @click="handleDeleteAddTemplateEntry">删除</el-button>
                </el-col>
                <el-col :span="1.5" v-show="false">
                  <el-button size="medium" @click="closeAddTemplateDialog">取 消</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button type="primary" icon="el-icon-search" size="medium" @click="handleAddTemplateSearch">搜 索</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button type="primary" size="medium" @click="submitAddTemplate">确 认</el-button>
                </el-col>
              </el-row>
              <div class="table-wrapper">
                <el-table :data="addTemplateDetailPageList" row-key="id" :row-class-name="rowAddTemplateMaterialIndex" @selection-change="handleAddTemplateEntrySelectionChange" ref="addTemplateEntryTable" height="100%" border>
                  <el-table-column type="selection" width="50" align="center" resizable />
                  <el-table-column label="序号" align="center" width="60" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ (addTemplateDetailPageNum - 1) * addTemplateDetailPageSize + scope.$index + 1 }}
                    </template>
                  </el-table-column>
                  <el-table-column label="产品编码" align="center" prop="code" width="120" show-overflow-tooltip resizable/>
                  <el-table-column label="产品名称" align="center" prop="name" width="140" show-overflow-tooltip resizable/>
                  <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable/>
                  <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable/>
                  <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.fdUnit && scope.row.fdUnit.unitName ? scope.row.fdUnit.unitName : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="单价" align="center" width="90" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.price != null ? scope.row.price : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="生产厂家" align="center" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.fdFactory && scope.row.fdFactory.factoryName ? scope.row.fdFactory.factoryName : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="供应商" align="center" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.supplier && scope.row.supplier.name ? scope.row.supplier.name : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="注册证号" align="center" prop="registerNo" width="120" show-overflow-tooltip resizable/>
                  <el-table-column label="注册号有效期" align="center" width="110" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.periodDate ? parseTime(scope.row.periodDate, '{y}-{m}-{d}') : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="库房分类" align="center" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.fdWarehouseCategory && scope.row.fdWarehouseCategory.warehouseCategoryName ? scope.row.fdWarehouseCategory.warehouseCategoryName : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="财务分类" align="center" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.fdFinanceCategory && scope.row.fdFinanceCategory.financeCategoryName ? scope.row.fdFinanceCategory.financeCategoryName : '—' }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="add-template-pagination-wrap">
                <pagination
                  v-show="addTemplateFilteredList.length > 0"
                  :total="addTemplateFilteredList.length"
                  :page.sync="addTemplateDetailPageNum"
                  :limit.sync="addTemplateDetailPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  @pagination="handleAddTemplateDetailPagination"
                />
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplierDept'

export default {
  name: 'DApplyAddTemplateDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApply')],
  components: { SelectSupplier },
  inheritAttrs: false
}
</script>
