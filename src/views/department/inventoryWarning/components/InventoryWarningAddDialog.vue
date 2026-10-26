<template>
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>添加耗材</span>
          <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        
        <!-- 查询条件容器 -->
        <div class="dialog-query-container">
          <el-form :model="dialogQueryParams" ref="dialogQueryForm" size="small" :inline="true" label-width="80px">
            <el-row>
              <el-col :span="6">
                <el-form-item label="科室" prop="departmentId">
                  <el-input
                    :value="getSelectedDepartmentName()"
                    disabled
                    style="width: 180px"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="产品名称" prop="materialName">
                  <el-input
                    v-model="dialogQueryParams.materialName"
                    placeholder="产品名称"
                    clearable
                    style="width: 180px"
                    @keyup.enter.native="handleDialogQuery"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="6">
                <el-form-item label="供应商" prop="supplierId">
                  <SelectSupplier v-model="dialogQueryParams.supplierId" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 查询按钮 -->
        <div style="text-align:left;margin:5px 0;">
          <el-button class="spd-btn spd-btn--secondary" size="small" style="margin-right:10px;" @click="cancel">取消</el-button>
          <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" style="margin-right:10px;" @click="submitForm">保存</el-button>
          <el-button type="primary" icon="el-icon-search" size="small" class="spd-btn spd-btn--primary" @click="handleDialogQuery">搜索</el-button>
        </div>

        <!-- 明细表格 -->
        <el-table 
          ref="dialogTable" 
          v-loading="dialogLoading" 
          :data="dialogInventoryList" 
          :row-class-name="dialogInventoryIndex"
          @selection-change="handleDialogSelectionChange"
          height="calc(100vh - 600px)" 
          border>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="90" show-overflow-tooltip />
          <el-table-column label="编码" align="center" width="130" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.code ? scope.row.material.code : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="产品名称" align="center" min-width="220" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" align="center" width="130" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" width="130" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.model ? scope.row.material.model : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="90" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName ? scope.row.material.fdUnit.unitName : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" align="center" width="110" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice ? formatPrice(scope.row.unitPrice) : '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" align="center" prop="qty" width="110" show-overflow-tooltip />
          <el-table-column label="金额" align="center" prop="amt" width="110" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.amt ? formatAmount(scope.row.amt) : '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName ? scope.row.material.fdFactory.factoryName : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" width="150" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name ? scope.row.material.supplier.name : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" width="150" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.registerNo ? scope.row.material.registerNo : '' }}</span>
            </template>
          </el-table-column>
        </el-table>

      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplierDept'

export default {
  name: 'InventoryWarningAddDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InventoryWarning')],
  components: { SelectSupplier },
  inheritAttrs: false
}
</script>
