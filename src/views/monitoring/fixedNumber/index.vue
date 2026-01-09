<template>
  <div class="app-container" style="position: relative;">
    <el-row :gutter="20">
      <!-- 左侧：仓库列表面板 -->
      <el-col :span="5">
        <!-- 定数类型下拉框 -->
        <div style="background: #fff; padding: 16px 20px; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05); margin-bottom: 16px;">
          <el-form :model="queryParams" size="small" label-width="80px">
            <el-form-item label="定数类型" style="margin-bottom: 0;">
              <el-select v-model="queryParams.fixedNumberType" placeholder="请选择定数类型" clearable style="width: 100%;">
                <el-option label="仓库定数监测" value="1"></el-option>
                <el-option label="科室定数监测" value="2"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <div class="warehouse-panel">
          <div class="warehouse-panel-header">
            <span>{{ queryParams.fixedNumberType === '1' ? '仓库列表' : queryParams.fixedNumberType === '2' ? '科室列表' : '仓库列表' }}</span>
          </div>
          <div class="warehouse-panel-content">
            <!-- 仓库列表 -->
            <template v-if="queryParams.fixedNumberType === '1' || !queryParams.fixedNumberType">
              <el-table :data="warehouseList" :key="'warehouse-' + queryParams.fixedNumberType" 
                        :highlight-current-row="true"
                        @row-click="handleWarehouseRowClick"
                        :row-class-name="getWarehouseRowClassName"
                        style="width: 100%;"
                        :show-header="true"
                        height="calc(100vh - 280px)"
                        border>
                <el-table-column label="序号" align="center" width="60" type="index" :index="getWarehouseIndex" />
                <el-table-column label="编码" align="center" prop="code" width="80" show-overflow-tooltip>
                  <template slot-scope="scope">
                    <span v-if="scope.row.code">{{ scope.row.code }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="仓库" align="center" prop="name" show-overflow-tooltip>
                  <template slot="header">
                    <span @click.stop="handleWarehouseHeaderClick" style="cursor: pointer;">仓库</span>
                  </template>
                  <template slot-scope="scope">
                    <span>{{ scope.row.name }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="warehouseList.length === 0" class="warehouse-empty">
                暂无仓库数据
              </div>
            </template>
            <!-- 科室列表 -->
            <template v-if="queryParams.fixedNumberType === '2'">
              <el-table ref="departmentTable" :data="departmentList" :key="'department-table-' + queryParams.fixedNumberType + '-' + departmentList.length" 
                        :highlight-current-row="true"
                        @row-click="handleDepartmentRowClick"
                        :row-class-name="getDepartmentRowClassName"
                        style="width: 100%;"
                        :show-header="true"
                        height="calc(100vh - 280px)"
                        border>
                <el-table-column label="序号" align="center" width="60" type="index" :index="getDepartmentIndex" />
                <el-table-column label="编码" align="center" prop="code" width="80" show-overflow-tooltip>
                  <template slot-scope="scope">
                    <span v-if="scope.row.code">{{ scope.row.code }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="科室" align="center" prop="name" show-overflow-tooltip>
                  <template slot="header">
                    <span @click.stop="handleDepartmentHeaderClick" style="cursor: pointer;">科室</span>
                  </template>
                  <template slot-scope="scope">
                    <span>{{ scope.row.name }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="false" class="warehouse-empty">
                暂无科室数据
              </div>
            </template>
          </div>
        </div>
      </el-col>

      <!-- 右侧：查询条件和表格区域 -->
      <el-col :span="19">
        <!-- 查询条件容器 -->
        <div class="query-container">
          <div class="form-fields-container">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="80px">
              <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectSupplier v-model="queryParams.supplierId"/>
                </div>
              </el-form-item>
              <el-form-item label="耗材名称" prop="materialName" class="query-item-inline">
                <el-input v-model="queryParams.materialName"
                          placeholder="请输入耗材名称"
                          clearable
                          style="width: 180px"
                          @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="实际数量" prop="actualQuantity" class="query-item-inline" v-show="false">
                <el-input v-model="queryParams.actualQuantity"
                          placeholder="请输入实际数量"
                          clearable
                          style="width: 180px"
                          @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
          </el-row>
              <el-row class="query-row-left">
            <el-col :span="24">
                  <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
                    <div class="query-select-wrapper">
                      <SelectWarehouse v-model="queryParams.warehouseId"/>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>

        <!-- 按钮行 -->
        <el-row :gutter="10" class="mb8 button-row-container">
          <el-col :span="1.5">
                <el-button
                  type="primary"
                  icon="el-icon-plus"
              size="medium"
                  :disabled="isAddDisabled"
                  @click="handleAdd"
                >新增</el-button>
          </el-col>
          <el-col :span="1.5">
                <el-button
                  type="success"
                  icon="el-icon-check"
              size="medium"
                  @click="handleSave"
                >保存</el-button>
          </el-col>
          <el-col :span="1.5">
                <el-button
                  type="primary"
                  icon="el-icon-search"
              size="medium"
                  @click="handleQuery"
                >搜索</el-button>
          </el-col>
          <el-col :span="1.5">
                <el-button
                  icon="el-icon-refresh"
              size="medium"
                  @click="resetQuery"
                >重置</el-button>
            </el-col>
          </el-row>

        <!-- 明细表 -->
        <div class="detail-table-container">
        <el-table v-loading="loading" :data="fixedNumberList"
              :row-class-name="fixedNumberListIndex"
              @selection-change="handleSelectionChange"
                ref="fixedNumberTable"
                :height="tableHeight"
                border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="编码" align="center" prop="code" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.code">{{ scope.row.code }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="名称" align="center" prop="name" width="200" show-overflow-tooltip resizable />
      <el-table-column label="规格" align="center" prop="specification" width="150" show-overflow-tooltip resizable />
      <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.model">{{ scope.row.model }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单位" align="center" prop="unitName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitName">{{ scope.row.unitName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" prop="price" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price">{{ scope.row.price }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="上限" align="center" prop="upperLimit" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-input-number
            v-model="scope.row.upperLimit"
            :min="0"
            :precision="0"
            size="small"
            style="width: 100%;"
            @change="handleFieldChange(scope.row)"
          ></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="下限" align="center" prop="lowerLimit" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-input-number
            v-model="scope.row.lowerLimit"
            :min="0"
            :precision="0"
            size="small"
            style="width: 100%;"
            @change="handleFieldChange(scope.row)"
          ></el-input-number>
        </template>
      </el-table-column>
      <el-table-column label="有效期提醒" align="center" prop="expiryReminder" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.expiryReminder">{{ scope.row.expiryReminder }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="监测" align="center" prop="monitoring" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.monitoring"
            :active-value="'1'"
            :inactive-value="'2'"
            @change="handleFieldChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="货位" align="center" prop="location" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.location">{{ scope.row.location }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column :label="queryParams.fixedNumberType === '2' ? '科室' : '仓库'" align="center" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="queryParams.fixedNumberType === '2'">
            {{ scope.row.departmentName || scope.row.warehouseName || '--' }}
          </span>
          <span v-else>
            {{ scope.row.warehouseName || '--' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplierName" width="180" show-overflow-tooltip resizable />
      <el-table-column label="生产厂家" align="center" prop="factoryName" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.factoryName">{{ scope.row.factoryName }}</span>
          <span v-else-if="scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName">{{ scope.row.material.fdFactory.factoryName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="registerNo" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.registerNo">{{ scope.row.registerNo }}</span>
          <span v-else-if="scope.row.material && scope.row.material.registerNo">{{ scope.row.material.registerNo }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="库房分类" align="center" prop="warehouseCategoryName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.warehouseCategoryName">{{ scope.row.warehouseCategoryName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            :disabled="scope.row.hasInventoryRecord"
            :style="scope.row.hasInventoryRecord ? 'color: #C0C4CC; cursor: not-allowed;' : 'color: #F56C6C;'"
          >删除</el-button>
        </template>
      </el-table-column>
        </el-table>
        </div>

        <!-- 明细框容器（翻页） -->
        <div class="table-container" ref="tableContainer">
          <div class="pagination-container fixed-number-pagination">
        <pagination
              v-show="true"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 新增弹窗 -->
    <transition name="modal-fade">
      <div v-if="addDialogVisible" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="addDialogVisible" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">新增定数监测</div>
              <el-button icon="el-icon-close" size="small" circle @click="addDialogVisible = false" class="close-btn"></el-button>
            </div>
            <div class="modal-body">
              <!-- 搜索框 -->
              <el-form :model="addQueryParams" ref="addQueryForm" :inline="true" v-show="showSearch" label-width="100px">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="供应商" prop="supplierId">
                      <SelectSupplier v-model="addQueryParams.supplierId"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="耗材名称" prop="materialName">
                      <el-input
                        v-model="addQueryParams.materialName"
                        placeholder="请输入耗材名称"
                        clearable
                        @keyup.enter.native="handleAddQuery"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="规格型号" prop="speci">
                      <el-input
                        v-model="addQueryParams.speci"
                        placeholder="请输入规格型号"
                        clearable
                        @keyup.enter.native="handleAddQuery"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item>
                      <el-button type="primary" icon="el-icon-search" size="small" @click="handleAddQuery">搜索</el-button>
                      <el-button icon="el-icon-refresh" size="small" @click="resetAddQuery">重置</el-button>
                      <el-button size="small" @click="addDialogVisible = false">取 消</el-button>
                      <el-button type="primary" size="small" @click="handleAddConfirm">确 定</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>

              <!-- 明细表 -->
              <el-table
                v-loading="addTableLoading"
                :data="addMaterialList"
                @selection-change="handleAddSelectionChange"
                height="calc(50vh)"
                border
              >
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    {{ (addQueryParams.pageNum - 1) * addQueryParams.pageSize + scope.$index + 1 }}
                  </template>
                </el-table-column>
                <el-table-column label="编码" align="center" prop="code" width="120" show-overflow-tooltip resizable />
                <el-table-column label="名称" align="center" prop="name" width="200" show-overflow-tooltip resizable />
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
                @pagination="handleAddQuery"
              />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { listFixedNumber, addFixedNumber } from "@/api/monitoring/fixedNumber";
import { listWarehouse } from "@/api/foundation/warehouse";
import { listdepartAll } from "@/api/foundation/depart";
import { listMaterial } from "@/api/foundation/material";
import { listInventory } from "@/api/warehouse/inventory";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';

export default {
  name: "FixedNumber",
  dicts: [],
  components: {
    SelectSupplier,
    SelectWarehouse
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 定数监测表格数据
      fixedNumberList: [],
      // 仓库列表数据
      warehouseList: [],
      // 科室列表数据
      departmentList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 新增弹窗显示
      addDialogVisible: false,
      // 新增弹窗表格加载
      addTableLoading: false,
      // 新增弹窗耗材列表
      addMaterialList: [],
      // 新增弹窗总数
      addTotal: 0,
      // 新增弹窗选中数据
      addSelectedMaterials: [],
      // 新增弹窗查询参数
      addQueryParams: {
        pageNum: 1,
        pageSize: 10,
        supplierId: null,
        materialName: null,
        speci: null
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialName: null,
        actualQuantity: null,
        supplierId: null,
        warehouseId: null,
        departmentId: null,
        fixedNumberType: '1' // 默认为仓库定数监测
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {}
    };
  },
  computed: {
    fixedNumberType() {
      return this.queryParams.fixedNumberType;
    },
    // 新增按钮是否禁用
    isAddDisabled() {
      if (!this.queryParams.fixedNumberType) {
        return true;
      }
      // 仓库定数监测：需要选择仓库
      if (this.queryParams.fixedNumberType === '1') {
        return !this.queryParams.warehouseId;
      }
      // 科室定数监测：需要选择科室
      if (this.queryParams.fixedNumberType === '2') {
        return !this.queryParams.departmentId;
      }
      return true;
    },
    // 表格高度计算（容器高度减去分页高度）
    tableHeight() {
      // 明细表容器高度是 calc(100vh - 420px)，容器没有padding了，只需要减去表头高度（约48px）
      // 表格实际可用高度 = 容器高度 - 表头高度
      return 'calc(100vh - 468px)';
    }
  },
  watch: {
    'queryParams.fixedNumberType'(newVal, oldVal) {
      // 当定数类型改变时，清空选择并重新加载列表
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      if (newVal === '1' || !newVal) {
        // 仓库定数监测，加载仓库列表
        this.getWarehouseList();
      } else if (newVal === '2') {
        // 科室定数监测，加载科室列表
        this.getDepartmentList();
      }
      // 切换类型时，清空当前列表并尝试加载新类型的数据
      this.fixedNumberList = [];
      this.total = 0;
      this.loadFromLocalStorage();
    },
    'queryParams.warehouseId'(newVal) {
      // 仓库改变时，重新加载数据
      if (this.queryParams.fixedNumberType === '1') {
        this.loadFromLocalStorage();
      }
    },
    'queryParams.departmentId'(newVal) {
      // 科室改变时，重新加载数据
      if (this.queryParams.fixedNumberType === '2') {
        this.loadFromLocalStorage();
      }
    }
  },
  watch: {
    // 监听数据变化，重新设置表格高度
    fixedNumberList: {
      handler() {
        this.$nextTick(() => {
          setTimeout(() => {
            this.setTableHeight();
          }, 300);
        });
      },
      deep: true
    },
    // 监听loading变化
    loading(newVal) {
      if (!newVal) {
        // 数据加载完成后设置表格高度
        this.$nextTick(() => {
          setTimeout(() => {
            this.setTableHeight();
          }, 300);
        });
      }
    }
  },
  created() {
    // 默认显示所有定数监测信息
    this.queryParams.warehouseId = null;
    this.queryParams.departmentId = null;
    // 根据定数类型加载对应的列表
    if (this.queryParams.fixedNumberType === '1' || !this.queryParams.fixedNumberType) {
    this.getWarehouseList();
    } else if (this.queryParams.fixedNumberType === '2') {
      // 确保科室列表被加载
      this.getDepartmentList();
    }
    this.getList();
    // 从 localStorage 恢复数据
    this.loadFromLocalStorage();
  },
  mounted() {
    // 延迟执行，确保DOM完全渲染
    setTimeout(() => {
      this.setTableHeight();
      // 监听窗口大小变化
      window.addEventListener('resize', this.setTableHeight);
      
      // 确保在 mounted 时也检查并加载科室列表（参考仓库列表的逻辑）
      if (this.queryParams.fixedNumberType === '2' && this.departmentList.length === 0) {
        this.getDepartmentList();
      }
    }, 200);
  },
  beforeDestroy() {
    // 移除窗口大小变化监听
    window.removeEventListener('resize', this.setTableHeight);
  },
  methods: {
    /** 设置表格高度 */
    setTableHeight() {
      setTimeout(() => {
        const container = this.$refs.tableContainer;
        if (!container) {
          console.warn('表格容器未找到');
          return;
        }
        
        // 获取容器高度
        const containerHeight = container.offsetHeight;
        // 翻页容器高度是180px，加上margin和padding约32px，总共约172px（减少翻页占用空间）
        const paginationHeight = 172;
        // 表格应该占据的高度 = 容器高度 - 翻页高度
        const tableMaxHeight = containerHeight - paginationHeight;
        
        // 方法1: 通过ref获取
        const tableEl = this.$refs.fixedNumberTable;
        let tableElement = null;
        
        if (tableEl && tableEl.$el) {
          tableElement = tableEl.$el;
        } else {
          // 方法2: 通过DOM查询获取
          tableElement = container.querySelector('.el-table');
        }
        
        if (tableElement) {
          // 设置表格最大高度，确保不覆盖翻页
          tableElement.style.setProperty('max-height', `${tableMaxHeight}px`, 'important');
          tableElement.style.setProperty('height', 'auto', 'important');
          
          // 设置body-wrapper最大高度
          const bodyWrapper = tableElement.querySelector('.el-table__body-wrapper');
          if (bodyWrapper) {
            // body-wrapper高度 = 表格高度 - 表头高度（约48px）
            const bodyMaxHeight = tableMaxHeight - 48;
            bodyWrapper.style.setProperty('max-height', `${bodyMaxHeight}px`, 'important');
            bodyWrapper.style.setProperty('height', 'auto', 'important');
          }
          
          // 强制触发表格重新计算布局
          if (tableEl && tableEl.doLayout) {
            tableEl.doLayout();
          }
        } else {
          console.warn('表格元素未找到，无法设置高度');
        }
      }, 300);
    },
    /** 获取 localStorage 的 key */
    getStorageKey() {
      const type = this.queryParams.fixedNumberType || '1';
      const id = type === '1' ? this.queryParams.warehouseId : this.queryParams.departmentId;
      return `fixedNumber_${type}_${id || 'default'}`;
    },
    /** 保存到 localStorage */
    saveToLocalStorage() {
      const key = this.getStorageKey();
      if (this.fixedNumberList && this.fixedNumberList.length > 0) {
        localStorage.setItem(key, JSON.stringify(this.fixedNumberList));
      } else {
        localStorage.removeItem(key);
      }
    },
    /** 从 localStorage 恢复数据 */
    loadFromLocalStorage() {
      const key = this.getStorageKey();
      const savedData = localStorage.getItem(key);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // 只有当当前查询条件匹配时才恢复数据
          if (parsedData && parsedData.length > 0) {
            this.fixedNumberList = parsedData.map((item, index) => {
              return {
                ...item,
                index: index + 1,
                // 确保 monitoring 有默认值
                monitoring: item.monitoring || '2',
                // 初始化入库记录标记
                hasInventoryRecord: item.hasInventoryRecord || false
              };
            });
            this.total = this.fixedNumberList.length;
            // 不在loadFromLocalStorage中检查入库记录，避免在没有选择仓库时调用API
            // 检查入库记录会在getList或其他合适的地方进行
          }
        } catch (e) {
          console.error('恢复数据失败:', e);
        }
      }
    },
    /** 检查所有产品的入库记录 */
    checkInventoryRecords() {
      try {
        if (!this.fixedNumberList || this.fixedNumberList.length === 0) {
          return;
        }
        
        // 只检查仓库定数监测的入库记录
        if (this.queryParams.fixedNumberType !== '1') {
          return;
        }
        
        const warehouseId = this.queryParams.warehouseId;
        if (!warehouseId) {
          return;
        }
        
        // 批量检查所有产品的入库记录
        const checkPromises = this.fixedNumberList.map(item => {
          const materialId = item.material ? item.material.id : (item.materialId || null);
          if (!materialId) {
            return Promise.resolve({
              item: item,
              hasRecord: false
            });
          }
          
          return listInventory({
            materialId: materialId,
            warehouseId: warehouseId,
            pageNum: 1,
            pageSize: 1
          }).then(response => {
            return {
              item: item,
              hasRecord: response && response.rows && response.rows.length > 0
            };
          }).catch(error => {
            // 静默处理错误，不抛出异常
            console.warn('检查入库记录失败:', error);
            return {
              item: item,
              hasRecord: false
            };
          });
        });
        
        Promise.all(checkPromises).then(results => {
          if (!results || results.length === 0) {
            return;
          }
          
          results.forEach(result => {
            if (result && result.item) {
              result.item.hasInventoryRecord = result.hasRecord || false;
            }
          });
          // 更新localStorage
          this.saveToLocalStorage();
        }).catch(error => {
          // 静默处理错误，不抛出异常
          console.warn('批量检查入库记录失败:', error);
        });
      } catch (error) {
        // 捕获所有可能的异常，避免影响页面正常使用
        console.warn('checkInventoryRecords 执行异常:', error);
      }
    },
    /** 查询定数监测列表 */
    getList() {
      try {
        this.loading = true;
        // 优先从 localStorage 加载数据
        this.loadFromLocalStorage();
        
        // 同时查询后端数据，用于合并和更新
        listFixedNumber(this.queryParams).then(response => {
          try {
            if (response && response.rows && response.rows.length > 0) {
              // 后端有数据，合并到现有列表中
              const backendData = response.rows.map((item, index) => {
                return {
                  ...item,
                  index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1,
                  difference: item.actualQuantity !== null && item.stockQuantity !== null 
                    ? item.actualQuantity - item.stockQuantity 
                    : null
                };
              });
              
              // 合并逻辑：以后端数据为主，但保留localStorage中新增但未保存的数据
              const localStorageData = this.fixedNumberList || [];
              const mergedList = [];
              const backendCodes = new Set(backendData.map(item => item.code || item.materialCode));
              
              // 先添加后端数据
              mergedList.push(...backendData);
              
              // 再添加localStorage中但后端没有的数据（新增但未保存的）
              localStorageData.forEach(item => {
                const code = item.code || item.materialCode;
                if (code && !backendCodes.has(code)) {
                  mergedList.push(item);
                }
              });
              
              this.fixedNumberList = mergedList;
              this.total = mergedList.length;
              // 保存合并后的数据到 localStorage
              this.saveToLocalStorage();
            } else {
              // 后端没有数据，保持localStorage的数据
              if (!this.fixedNumberList || this.fixedNumberList.length === 0) {
                this.loadFromLocalStorage();
              }
            }
            this.loading = false;
            // 数据加载完成后设置表格高度
            setTimeout(() => {
              this.setTableHeight();
            }, 200);
            // 暂时禁用自动检查入库记录，避免频繁调用导致异常
            // 入库记录检查将在删除时进行
          } catch (error) {
            console.error('处理查询结果时出错:', error);
            this.loading = false;
            // 如果处理出错，至少保持localStorage的数据
            if (!this.fixedNumberList || this.fixedNumberList.length === 0) {
              this.loadFromLocalStorage();
            }
          }
        }).catch(error => {
          // 如果后端查询失败，保持localStorage的数据
          console.warn('查询定数监测列表失败:', error);
          if (!this.fixedNumberList || this.fixedNumberList.length === 0) {
            this.loadFromLocalStorage();
          }
          this.loading = false;
        });
      } catch (error) {
        console.error('getList 执行异常:', error);
        this.loading = false;
        // 如果出错，至少保持localStorage的数据
        if (!this.fixedNumberList || this.fixedNumberList.length === 0) {
          this.loadFromLocalStorage();
        }
      }
    },
    /** 查询仓库列表 */
    getWarehouseList() {
      listWarehouse({ pageNum: 1, pageSize: 1000 }).then(response => {
        // 过滤掉仓库类型为设备的仓库
        this.warehouseList = (response.rows || []).filter(warehouse => {
          // 仓库类型字段为 warehouseType，值为 '设备' 的过滤掉
          return warehouse.warehouseType !== '设备';
        });
      });
    },
    /** 查询科室列表 */
    getDepartmentList() {
      let userId = this.$store.state.user.userId;
      if (!userId) {
        this.departmentList = [];
        return;
      }
      
      // 参考 getWarehouseList 的实现方式，直接调用 API
      listdepartAll(userId).then(response => {
        // 参考 SelectDepartment 组件的处理方式：直接使用 response || []
        // 根据 request.js 的响应拦截器，如果 code === 200，返回 res.data
        // 如果后端直接返回 List，那么 response 就是数组
        this.departmentList = response || [];
      }).catch(error => {
        this.departmentList = [];
      });
    },
    /** 点击仓库列头，显示所有仓库定数监测信息 */
    handleWarehouseHeaderClick() {
      // 清空仓库选择
      this.queryParams.warehouseId = null;
      // 重新加载所有定数监测信息
      this.getList();
    },
    /** 点击科室列头，显示所有科室定数监测信息 */
    handleDepartmentHeaderClick() {
      // 清空科室选择
      this.queryParams.departmentId = null;
      // 重新加载所有定数监测信息
      this.getList();
    },
    /** 点击仓库项 */
    handleWarehouseClick(warehouseId) {
      this.queryParams.warehouseId = warehouseId;
      this.queryParams.departmentId = null;
      // 清空当前列表
      this.fixedNumberList = [];
      this.total = 0;
      // 从 localStorage 加载新仓库的数据
      this.loadFromLocalStorage();
      // 同时触发查询（如果后端有数据）
      this.handleQuery();
    },
    /** 点击仓库行 */
    handleWarehouseRowClick(row) {
      try {
        this.queryParams.warehouseId = row.id;
        this.queryParams.departmentId = null;
        // 清空当前列表
        this.fixedNumberList = [];
        this.total = 0;
        // 从 localStorage 加载新仓库的数据
        this.loadFromLocalStorage();
        // 同时触发查询（如果后端有数据）
        this.handleQuery();
        // 暂时禁用自动检查入库记录，避免频繁调用导致异常
        // 入库记录检查将在删除时进行
      } catch (error) {
        console.error('handleWarehouseRowClick 执行异常:', error);
      }
    },
    /** 点击科室项 */
    handleDepartmentClick(departmentId) {
      this.queryParams.departmentId = departmentId;
      this.queryParams.warehouseId = null;
      // 清空当前列表
      this.fixedNumberList = [];
      this.total = 0;
      // 从 localStorage 加载新科室的数据
      this.loadFromLocalStorage();
      // 同时触发查询（如果后端有数据）
      this.handleQuery();
    },
    /** 点击科室行 */
    handleDepartmentRowClick(row) {
      this.queryParams.departmentId = row.id;
      this.queryParams.warehouseId = null;
      // 清空当前列表
      this.fixedNumberList = [];
      this.total = 0;
      // 从 localStorage 加载新科室的数据
      this.loadFromLocalStorage();
      // 同时触发查询（如果后端有数据）
      this.handleQuery();
      // 科室定数监测不需要检查入库记录（入库记录是针对仓库的）
    },
    /** 获取仓库行样式类名 */
    getWarehouseRowClassName({ row, rowIndex }) {
      if (this.queryParams.warehouseId === row.id) {
        return 'warehouse-row-active';
      }
      return '';
    },
    /** 获取科室行样式类名 */
    getDepartmentRowClassName({ row, rowIndex }) {
      if (this.queryParams.departmentId === row.id) {
        return 'warehouse-row-active';
      }
      return '';
    },
    /** 获取仓库序号 */
    getWarehouseIndex(index) {
      return index + 1;
    },
    /** 获取科室序号 */
    getDepartmentIndex(index) {
      return index + 1;
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        name: null,
        specification: null,
        supplierId: null,
        warehouseId: null,
        stockQuantity: null,
        actualQuantity: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 保存按钮操作 */
    handleSave() {
      if (this.fixedNumberList.length === 0) {
        this.$modal.msgWarning("请先添加明细数据");
        return;
      }
      
      // 检查必填项
      if (!this.queryParams.fixedNumberType) {
        this.$modal.msgWarning("请先选择定数类型");
        return;
      }
      
      if (this.queryParams.fixedNumberType === '1' && !this.queryParams.warehouseId) {
        this.$modal.msgWarning("请先选择仓库");
        return;
      }
      
      if (this.queryParams.fixedNumberType === '2' && !this.queryParams.departmentId) {
        this.$modal.msgWarning("请先选择科室");
        return;
      }
      
      // 构建保存数据
      const saveData = {
        fixedNumberType: this.queryParams.fixedNumberType,
        warehouseId: this.queryParams.warehouseId,
        departmentId: this.queryParams.departmentId,
        detailList: this.fixedNumberList.map(item => {
          return {
            materialId: item.material ? item.material.id : null,
            materialCode: item.code,
            materialName: item.name,
            specification: item.specification,
            model: item.model,
            supplierId: item.material && item.material.supplier ? item.material.supplier.id : null,
            unitId: item.material && item.material.fdUnit ? item.material.fdUnit.unitId : null,
            price: item.price,
            factoryId: item.material && item.material.fdFactory ? item.material.fdFactory.factoryId : null,
            warehouseCategoryId: item.material && item.material.fdWarehouseCategory ? item.material.fdWarehouseCategory.warehouseCategoryId : null,
            financeCategoryId: item.material && item.material.fdFinanceCategory ? item.material.fdFinanceCategory.financeCategoryId : null,
            isBilling: item.material ? item.material.isBilling : null
          };
        })
      };
      
      // 调用保存API
      addFixedNumber(saveData).then(response => {
        this.$modal.msgSuccess("保存成功");
        // 保存成功后，保存到 localStorage
        this.saveToLocalStorage();
        // 保持列表显示，不清空
        // 暂时禁用自动检查入库记录，避免频繁调用导致异常
        // 入库记录检查将在删除时进行
      }).catch(error => {
        console.error('保存定数监测失败:', error);
        this.$modal.msgError("保存失败");
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.addDialogVisible = true;
      this.resetAddQuery();
      this.handleAddQuery();
    },
    /** 新增弹窗搜索 */
    handleAddQuery() {
      this.addTableLoading = true;
      listMaterial(this.addQueryParams).then(response => {
        const allMaterials = response.rows || [];
        // 获取已添加到明细列表的产品编码
        const addedCodes = this.fixedNumberList.map(item => item.code).filter(code => code);
        // 过滤掉已经添加的产品
        this.addMaterialList = allMaterials.filter(material => {
          return !addedCodes.includes(material.code);
        });
        // 更新总数（过滤后的数量）
        this.addTotal = this.addMaterialList.length;
        this.addTableLoading = false;
      }).catch(() => {
        this.addTableLoading = false;
      });
    },
    /** 重置新增弹窗查询 */
    resetAddQuery() {
      this.addQueryParams = {
        pageNum: 1,
        pageSize: 10,
        supplierId: null,
        materialName: null,
        speci: null
      };
      this.addMaterialList = [];
      this.addSelectedMaterials = [];
    },
    /** 新增弹窗选择变化 */
    handleAddSelectionChange(selection) {
      this.addSelectedMaterials = selection;
    },
    /** 新增弹窗确定 */
    handleAddConfirm() {
      if (this.addSelectedMaterials.length === 0) {
        this.$modal.msgWarning("请至少选择一条数据");
        return;
      }
      
      // 将选中的耗材添加到明细表中
      this.addSelectedMaterials.forEach(material => {
        // 检查是否已存在（根据编码判断）
        const exists = this.fixedNumberList.some(item => item.code === material.code);
        if (!exists) {
          // 转换为明细表数据格式
          const newItem = {
            id: null, // 新增数据，ID为空
            code: material.code,
            name: material.name,
            specification: material.speci || '--',
            model: material.model || '--', // 型号
            supplierName: (material.supplier && material.supplier.name) || '--',
            warehouseName: this.queryParams.fixedNumberType === '1' && this.queryParams.warehouseId ? this.getWarehouseNameById(this.queryParams.warehouseId) : null, // 仓库名称
            departmentName: this.queryParams.fixedNumberType === '2' && this.queryParams.departmentId ? this.getDepartmentNameById(this.queryParams.departmentId) : null, // 科室名称
            unitName: (material.fdUnit && material.fdUnit.unitName) || '--', // 单位
            price: material.price || '--', // 单价
            upperLimit: null, // 上限
            lowerLimit: null, // 下限
            expiryReminder: null, // 有效期提醒
            monitoring: '2', // 监测，默认为未监控（'2'）
            location: null, // 货位
            factoryName: (material.fdFactory && material.fdFactory.factoryName) || null, // 生产厂家
            registerNo: material.registerNo || null, // 注册证号
            warehouseCategoryName: (material.fdWarehouseCategory && material.fdWarehouseCategory.warehouseCategoryName) || '--', // 库房分类
            index: this.fixedNumberList.length + 1, // 序号
            material: material // 保存完整的耗材对象，以便后续使用
          };
          this.fixedNumberList.push(newItem);
        }
      });
      
      // 更新序号
      this.fixedNumberList.forEach((item, index) => {
        item.index = index + 1;
      });
      
      // 更新总数
      this.total = this.fixedNumberList.length;
      
      // 保存到 localStorage
      this.saveToLocalStorage();
      
      this.$modal.msgSuccess("新增成功");
      this.addDialogVisible = false;
      // 清空弹窗选择
      this.addSelectedMaterials = [];
    },
    /** 根据仓库ID获取仓库名称 */
    getWarehouseNameById(warehouseId) {
      const warehouse = this.warehouseList.find(w => w.id === warehouseId);
      return warehouse ? warehouse.name : '--';
    },
    /** 根据科室ID获取科室名称 */
    getDepartmentNameById(departmentId) {
      const department = this.departmentList.find(d => d.id === departmentId);
      return department ? department.name : '--';
    },
    /** 字段变化处理 */
    handleFieldChange(row) {
      // 字段变化时，自动保存到 localStorage
      this.saveToLocalStorage();
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      // 检查是否有入库记录
      if (row.hasInventoryRecord) {
        this.$modal.msgWarning("该产品已有入库记录，不能删除");
        return;
      }
      
      // 如果有materialId和warehouseId，再次检查入库记录
      const materialId = row.material ? row.material.id : (row.materialId || null);
      const warehouseId = this.queryParams.fixedNumberType === '1' ? this.queryParams.warehouseId : null;
      
      if (materialId && warehouseId) {
        // 检查是否有入库记录
        listInventory({
          materialId: materialId,
          warehouseId: warehouseId,
          pageNum: 1,
          pageSize: 1
        }).then(response => {
          if (response.rows && response.rows.length > 0) {
            // 有入库记录，标记并提示
            row.hasInventoryRecord = true;
            this.$modal.msgWarning("该产品已有入库记录，不能删除");
            return;
          }
          // 没有入库记录，执行删除
          this.doDelete(row);
        }).catch(() => {
          // 查询失败，仍然执行删除（避免因为网络问题导致无法删除）
          this.doDelete(row);
        });
      } else {
        // 没有materialId或warehouseId，直接删除
        this.doDelete(row);
      }
    },
    /** 执行删除操作 */
    doDelete(row) {
      const index = this.fixedNumberList.findIndex(item => item === row);
      if (index > -1) {
        this.fixedNumberList.splice(index, 1);
        // 更新序号
        this.fixedNumberList.forEach((item, idx) => {
          item.index = idx + 1;
        });
        // 更新总数
        this.total = this.fixedNumberList.length;
        // 更新 localStorage
        this.saveToLocalStorage();
        this.$modal.msgSuccess("删除成功");
      }
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    fixedNumberListIndex({ row, rowIndex }) {
      return 'fixed-number-row-' + rowIndex;
    }
  }
};
</script>

<style scoped>
/* 搜索区域样式 */
.app-container > .el-form {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  margin-bottom: 16px;
}

.app-container > .el-form .el-row {
  margin-bottom: 8px;
}

.app-container > .el-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container > .el-form .el-form-item {
  margin-bottom: 0;
}

/* 第一行查询条件左对齐紧凑布局 */
/* 查询容器样式 */
.query-container {
  margin-top: -5px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
}

/* 查询条件样式 */
.query-row-left {
  margin-bottom: 10px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

/* 隐藏按钮行容器，但保留按钮可见 */
.button-row-container.mb8,
.el-row.button-row-container {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 16px !important;
}

/* 确保按钮正常显示 */
.button-row-container .el-button {
  display: inline-block !important;
  visibility: visible !important;
}

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: 500;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

/* 仓库列表面板样式 */
.warehouse-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  overflow: hidden;
}

.warehouse-panel-header {
  padding: 16px 20px;
  background-color: #F5F7FA;
  border-bottom: 1px solid #EBEEF5;
  font-weight: 500;
  font-size: 14px;
  color: #606266;
}

.warehouse-panel-content {
  padding: 0;
  overflow: hidden;
}

.warehouse-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
  color: #606266;
}

.warehouse-item:hover {
  background-color: #F5F7FA;
}

.warehouse-item-active {
  background-color: #ECF5FF;
  color: #409EFF;
  font-weight: 500;
}

.warehouse-empty {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 仓库列表表格样式 */
::v-deep .warehouse-panel .el-table {
  font-size: 12px;
}

::v-deep .warehouse-panel .el-table th {
  padding: 8px 0;
  background-color: #F5F7FA;
  font-weight: 500;
}

::v-deep .warehouse-panel .el-table td {
  padding: 8px 0;
}

::v-deep .warehouse-panel .el-table tbody tr {
  cursor: pointer;
}

::v-deep .warehouse-panel .el-table tbody tr:hover > td {
  background-color: #F5F7FA !important;
}

::v-deep .warehouse-panel .el-table .warehouse-row-active {
  background-color: #ECF5FF !important;
}

::v-deep .warehouse-panel .el-table .warehouse-row-active td {
  background-color: #ECF5FF !important;
  color: #409EFF;
}

::v-deep .warehouse-panel .el-table tbody tr.warehouse-row-active:hover > td {
  background-color: #ECF5FF !important;
}

/* 新增弹窗样式 - 参考到货验收 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #fff;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.close-btn {
  border: none;
  background: transparent;
  color: #909399;
}

.close-btn:hover {
  color: #409EFF;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.modal-body .el-form {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.modal-body .el-table {
  flex: 1;
  overflow: hidden;
}

.modal-body .el-pagination {
  margin-top: 16px;
  flex-shrink: 0;
}

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s ease;
}

.modal-zoom-enter, .modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 明细表容器 */
.detail-table-container {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  border: none !important;
  margin-bottom: 16px;
  height: calc(100vh - 420px) !important;
  min-height: calc(100vh - 420px) !important;
  max-height: calc(100vh - 420px) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.detail-table-container .el-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100% !important;
}

/* 确保表头完全显示 */
.detail-table-container .el-table__header-wrapper {
  flex-shrink: 0;
  height: auto !important;
  overflow: visible !important;
  position: relative;
  z-index: 1;
}

.detail-table-container .el-table__header {
  display: table-header-group;
  width: 100%;
}

.detail-table-container .el-table th {
  padding: 12px 0 !important;
  height: auto !important;
  line-height: 1.5 !important;
}

/* 确保滚动条在底部显示 */
.detail-table-container .el-table__body-wrapper {
  flex: 1;
  overflow-y: auto !important;
  overflow-x: auto !important;
  position: relative;
  min-height: 0;
  display: block !important;
}

.detail-table-container .el-table__body {
  display: table;
  width: 100%;
  table-layout: auto;
}

/* 确保滚动条在底部可见 */
.detail-table-container .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
  position: absolute !important;
  bottom: 0 !important;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 6px;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* 明细框容器（翻页） */
.table-container {
  background: #fff;
  padding: 4px 16px 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  height: 60px !important;
  min-height: 60px !important;
  max-height: 60px !important;
  position: relative;
  box-sizing: border-box;
}

.table-container .el-table {
  margin-bottom: 0;
  overflow: hidden;
  flex: 0 0 auto;
  min-height: calc(100% - 172px) !important;
  max-height: calc(100% - 172px) !important;
  height: calc(100% - 172px) !important;
  /* 确保表格高度固定 */
  box-sizing: border-box;
}

/* 更具体的选择器，确保覆盖Element UI的默认样式 */
.table-container > .el-table.el-table--fit.el-table--border {
  height: calc(100% - 172px) !important;
  max-height: calc(100% - 172px) !important;
  min-height: calc(100% - 172px) !important;
}

/* 使用::v-deep强制覆盖Element UI动态设置的高度 */
::v-deep .table-container .el-table {
  height: calc(100% - 172px) !important;
  max-height: calc(100% - 172px) !important;
  min-height: calc(100% - 172px) !important;
  flex: 0 0 auto !important;
}

::v-deep .table-container .el-table__body-wrapper {
  max-height: none !important;
  min-height: 0 !important;
  height: auto !important;
  flex: 1 1 auto !important;
}

.table-container .el-table__body-wrapper {
  overflow-y: auto !important;
  overflow-x: auto !important;
  position: relative;
  display: block;
  box-sizing: border-box;
  height: calc(100% - 48px) !important;
  max-height: calc(100% - 48px) !important;
  min-height: calc(100% - 48px) !important;
  flex: 1 1 auto !important;
}

/* 更具体的选择器 */
.table-container .el-table .el-table__body-wrapper {
  height: calc(100% - 48px) !important;
  max-height: calc(100% - 48px) !important;
  min-height: calc(100% - 48px) !important;
}

/* 确保水平滚动条在底部显示 */
.table-container .el-table__body {
  display: table;
  width: 100%;
  table-layout: auto;
}

/* 确保滚动条容器正确显示 */
.table-container .el-table__body-wrapper.is-scrolling-left,
.table-container .el-table__body-wrapper.is-scrolling-right {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* 覆盖全局分页容器样式 */
.table-container .pagination-container.fixed-number-pagination,
.table-container .fixed-number-pagination {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding: 0 !important;
  flex: 0 0 auto !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  position: relative !important;
  z-index: 10 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  box-sizing: border-box;
  overflow: visible;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100%;
}

/* 覆盖全局分页组件样式 */
.table-container .pagination-container .el-pagination {
  width: auto !important;
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  height: auto !important;
}

/* 使用深度选择器确保样式生效 */
::v-deep .table-container .pagination-container.fixed-number-pagination,
::v-deep .table-container .fixed-number-pagination {
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  width: 100%;
}

::v-deep .table-container .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}
</style>

<!-- 非 scoped 样式，用于覆盖全局样式 -->
<style>
/* 强制覆盖全局分页容器样式 */
.table-container .pagination-container.fixed-number-pagination,
.table-container .fixed-number-pagination {
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
  padding: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  flex: 0 0 auto !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  visibility: visible !important;
  opacity: 1 !important;
  z-index: 10 !important;
  width: 100%;
}

.table-container .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  visibility: visible !important;
  opacity: 1 !important;
  display: flex !important;
}
</style>

<style>
/* 强制覆盖Element UI表格高度 - 非scoped样式 */
.table-container .el-table {
  height: calc(100% - 172px) !important;
  max-height: calc(100% - 172px) !important;
  min-height: calc(100% - 172px) !important;
  overflow: hidden !important;
  flex: 0 0 auto !important;
}

/* 更具体的选择器，覆盖Element UI的默认样式 */
.table-container .el-table.el-table--fit.el-table--border.el-table--scrollable-x {
  height: calc(100% - 172px) !important;
  max-height: calc(100% - 172px) !important;
  min-height: calc(100% - 172px) !important;
  flex: 0 0 auto !important;
}

.table-container .el-table__body-wrapper {
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
  flex: 1 1 auto !important;
}

.table-container .el-table .el-table__body-wrapper {
  height: calc(100% - 48px) !important;
  max-height: calc(100% - 48px) !important;
  min-height: calc(100% - 48px) !important;
  flex: 1 1 auto !important;
}

/* 确保表格头部和body正确显示 */
.table-container .el-table__header-wrapper {
  flex-shrink: 0;
}

/* 隐藏按钮行容器，但保留按钮可见 - 非scoped样式 */
.button-row-container.mb8,
.el-row.button-row-container {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 16px !important;
}

.button-row-container .el-button {
  display: inline-block !important;
  visibility: visible !important;
}

/* 隐藏明细表容器背景，只显示表格 - 非scoped样式 */
.detail-table-container {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  border: none !important;
}

.detail-table-container .el-table {
  background: #fff !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05) !important;
  border: 1px solid #EBEEF5 !important;
}

/* 确保滚动条在底部显示 - 非scoped样式 */
.detail-table-container .el-table {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  height: 100% !important;
}

.detail-table-container .el-table__body-wrapper {
  flex: 1 !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
  display: block !important;
  position: relative !important;
  min-height: 0 !important;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
  position: absolute !important;
  bottom: 0 !important;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 6px !important;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c0c4cc !important;
  border-radius: 6px !important;
}

.detail-table-container .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
}
</style>

