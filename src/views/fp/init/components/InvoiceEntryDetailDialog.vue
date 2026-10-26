<template>
      <transition name="modal-fade">
        <div v-if="detailDialogVisible" class="local-modal-mask">
          <transition name="modal-zoom">
            <div v-if="detailDialogVisible" class="local-modal-content">
              <div class="modal-header">
                <div class="modal-title">查看发票详情</div>
                <el-button size="small" @click="closeDetailView" class="close-btn">关闭</el-button>
              </div>
              <div class="modal-body">
                <el-form ref="detailForm" :model="detailForm" label-width="120px" size="small">
                  <div class="form-fields-container">
                    <el-row :gutter="8">
                      <el-col :span="4">
                        <el-form-item label="单号">
                          <el-input v-model="detailForm.billNo" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="供应商">
                          <el-input v-model="detailForm.supplierName" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="仓库">
                          <el-input v-model="detailForm.warehouseName" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="制单人">
                          <el-input v-model="detailForm.createrName" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="制单日期">
                          <el-input v-model="detailForm.billDate" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="总金额">
                          <el-input v-model="detailForm.totalAmount" :disabled="true" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="8">
                      <el-col :span="4">
                        <el-form-item label="发票号">
                          <el-input v-model="detailForm.invoiceNumber" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="发票金额">
                          <el-input v-model="detailForm.invoiceAmount" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="发票日期">
                          <el-input v-model="detailForm.invoiceTime" :disabled="true" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </div>
                </el-form>
                <div class="detail-table-container">
                  <el-table 
                    :data="detailForm.stkIoBillEntryList" 
                    border 
                    height="calc(100vh - 550px)"
                    style="width: 100%"
                  >
                    <el-table-column type="index" label="序号" align="center" width="80" show-overflow-tooltip></el-table-column>
                    <el-table-column label="产品编码" align="center" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="产品名称" align="center" width="180" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="center" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialSpeci || (scope.row.material && scope.row.material.speci) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="center" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialModel || (scope.row.material && scope.row.material.model) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" width="80" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unitName || (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="数量" align="center" prop="qty" width="100" show-overflow-tooltip></el-table-column>
                    <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批号" align="center" prop="batchNumber" width="150" show-overflow-tooltip></el-table-column>
                    <el-table-column label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产日期" align="center" prop="beginTime" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" width="180" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="供应商" align="center" width="200" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.supplierName || (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" align="center" width="150" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.registerNo || (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="库房分类" align="center" width="150" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.warehouseCategoryName || (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'InvoiceEntryDetailDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InvoiceEntry')],
  inheritAttrs: false
}
</script>
