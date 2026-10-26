<template>
    <transition name="modal-fade">
      <div v-if="addDialogVisible" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="addDialogVisible" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">新增定数监测</div>
              <el-button size="small" @click="addDialogVisible = false" class="close-btn">关闭</el-button>
            </div>
            <div class="modal-body">
              <!-- 搜索框容器 -->
              <div class="form-fields-container">
                <el-form :model="addQueryParams" ref="addQueryForm" :inline="true" v-show="showSearch" label-width="100px">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item label="供应商" prop="supplierId">
                        <SelectSupplier v-model="addQueryParams.supplierId"/>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="产品名称" prop="materialName">
                        <el-input
                          v-model="addQueryParams.materialName"
                          placeholder="名称/编码/简码"
                          clearable
                          @keyup.enter.native="handleAddSearch"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="规格型号" prop="speci">
                        <el-input
                          v-model="addQueryParams.speci"
                          placeholder="规格型号"
                          clearable
                          @keyup.enter.native="handleAddSearch"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="6">
                      <el-form-item label="是否集采" prop="isProcure">
                        <el-select
                          v-model="addQueryParams.isProcure"
                          clearable
                          placeholder="全部"
                          style="width: 100%"
                        >
                          <el-option label="是" value="1" />
                          <el-option label="否" value="2" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <el-form-item label="是否高值" prop="isGz">
                        <el-select
                          v-model="addQueryParams.isGz"
                          clearable
                          placeholder="全部"
                          style="width: 100%"
                        >
                          <el-option label="高值" value="1" />
                          <el-option label="非高值" value="2" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <el-form-item label="库房分类" prop="storeroomIds">
                        <SelectWarehouseCategory
                          v-model="addQueryParams.storeroomIds"
                          :multiple="true"
                          placeholder="库房分类"
                          style="width: 100%"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
              <!-- 弹窗按钮行：放在搜索容器和表格之间，按钮大小与耗材产品维护一致 -->
              <el-row :gutter="10" class="mb8 button-row-container">
                <el-col :span="1.5">
                  <el-button
                    type="primary"
                    icon="el-icon-search"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="handleAddSearch"
                  >搜索</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button
                    type="success"
                    icon="el-icon-check"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    :loading="addSelectAllLoading"
                    @click="handleAddSelectAll"
                  >全选</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button
                    icon="el-icon-close"
                    size="small"
                    class="spd-btn spd-btn--secondary"
                    :disabled="addCrossPageSelectedCount === 0"
                    @click="handleAddClearSelectAll"
                  >取消全选</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button
                    icon="el-icon-refresh"
                    size="small"
                    class="spd-btn spd-btn--secondary"
                    @click="resetAddQuery"
                  >重置</el-button>
                </el-col>
                <el-col v-if="addCrossPageSelectedCount > 0 || addTotal > 0" :span="8" class="add-selection-hint">
                  <span>已跨页选中 {{ addCrossPageSelectedCount }} 条 / 共 {{ addTotal }} 条</span>
                </el-col>
                <el-col :span="1.5">
                  <el-button
                    size="small"
                    class="spd-btn spd-btn--secondary"
                    @click="addDialogVisible = false"
                  >取 消</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="handleAddConfirm"
                  >确 定</el-button>
                </el-col>
              </el-row>

              <!-- 明细表：高度适当降低，避免遮挡底部翻页 -->
              <el-table
                ref="addMaterialTable"
                v-loading="addTableLoading"
                :data="addMaterialList"
                :row-key="getAddMaterialRowKey"
                @selection-change="handleAddSelectionChange"
                height="calc(40vh)"
                border
              >
                <el-table-column type="selection" width="55" align="center" :reserve-selection="true" />
                <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    {{ (addQueryParams.pageNum - 1) * addQueryParams.pageSize + scope.$index + 1 }}
                  </template>
                </el-table-column>
                <el-table-column label="产品编码" align="center" prop="code" width="120" show-overflow-tooltip resizable />
                <el-table-column label="产品名称" align="center" prop="name" width="200" show-overflow-tooltip resizable />
                <el-table-column label="规格" align="center" prop="speci" width="150" show-overflow-tooltip resizable />
                <el-table-column label="型号" align="center" prop="model" width="150" show-overflow-tooltip resizable />
                <el-table-column label="单位" align="center" prop="fdUnit.unitName" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.fdUnit && scope.row.fdUnit.unitName">{{ scope.row.fdUnit.unitName }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" align="center" prop="price" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.price">{{ scope.row.price }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="库房分类" align="center" prop="fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.fdWarehouseCategory && scope.row.fdWarehouseCategory.warehouseCategoryName">{{ scope.row.fdWarehouseCategory.warehouseCategoryName }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="财务分类" align="center" prop="fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.fdFinanceCategory && scope.row.fdFinanceCategory.financeCategoryName">{{ scope.row.fdFinanceCategory.financeCategoryName }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="计费" align="center" prop="isBilling" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.isBilling === '1' || scope.row.isBilling === 1">是</span>
                    <span v-else-if="scope.row.isBilling === '2' || scope.row.isBilling === 2">否</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="集采" align="center" prop="isProcure" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.isProcure === '1' || scope.row.isProcure === 1">是</span>
                    <span v-else-if="scope.row.isProcure === '2' || scope.row.isProcure === 2">否</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="高值" align="center" prop="isGz" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="isMaterialGz(scope.row)">是</span>
                    <span v-else-if="isMaterialNonGz(scope.row)">否</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="fdFactory.factoryName" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.fdFactory && scope.row.fdFactory.factoryName">{{ scope.row.fdFactory.factoryName }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.supplier && scope.row.supplier.name">{{ scope.row.supplier.name }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
              </el-table>

              <pagination
                v-show="addTotal>0"
                :total="addTotal"
                :page.sync="addQueryParams.pageNum"
                :limit.sync="addQueryParams.pageSize"
                :page-sizes="[10, 20, 30, 50, 100, 500, 1000]"
                @pagination="handleAddQuery"
              />
            </div>
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectWarehouseCategory from '@/components/SelectModel/SelectWarehouseCategory'

export default {
  name: 'FixedNumberAddDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'FixedNumber')],
  components: { SelectSupplier, SelectWarehouseCategory },
  inheritAttrs: false
}
</script>
