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
            <span>{{ fixedNumberType === '1' ? '仓库列表' : fixedNumberType === '2' ? '科室列表' : '仓库列表' }}</span>
          </div>
          <div class="warehouse-panel-content">
            <!-- 仓库列表 -->
            <template v-if="fixedNumberType === '1' || !fixedNumberType">
              <el-table :data="warehouseList" 
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
            <template v-else-if="fixedNumberType === '2'">
              <el-table :data="departmentList" 
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
                  <template slot-scope="scope">
                    <span>{{ scope.row.name }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="departmentList.length === 0" class="warehouse-empty">
                暂无科室数据
              </div>
            </template>
          </div>
        </div>
      </el-col>

      <!-- 右侧：查询条件和表格区域 -->
      <el-col :span="19">
        <!-- 查询条件 -->
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="80px" style="background: #fff; padding: 16px 20px; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05); margin-bottom: 16px;">
          <el-row>
            <el-col :span="24">
              <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectSupplier v-model="queryParams.supplierId"/>
                </div>
              </el-form-item>
              <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectWarehouse v-model="queryParams.warehouseId"/>
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
          <el-row>
            <el-col :span="24">
              <el-form-item class="query-item-inline">
                <el-button
                  type="primary"
                  icon="el-icon-plus"
                  size="small"
                  :disabled="isAddDisabled"
                  @click="handleAdd"
                >新增</el-button>
                <el-button
                  type="success"
                  icon="el-icon-check"
                  size="small"
                  @click="handleSave"
                  style="margin-left: 10px;"
                >保存</el-button>
                <el-button
                  type="primary"
                  icon="el-icon-search"
                  size="small"
                  @click="handleQuery"
                  style="margin-left: 10px;"
                >搜索</el-button>
                <el-button
                  icon="el-icon-refresh"
                  size="small"
                  @click="resetQuery"
                  style="margin-left: 10px;"
                >重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-table v-loading="loading" :data="fixedNumberList"
              :row-class-name="fixedNumberListIndex"
              @selection-change="handleSelectionChange"
              height="58vh" border>
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
            style="color: #F56C6C;"
          >删除</el-button>
        </template>
      </el-table-column>
        </el-table>

        <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
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
    }
  },
  watch: {
    'queryParams.fixedNumberType'(newVal) {
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
  created() {
    this.getList();
    this.getWarehouseList();
    // 从 localStorage 恢复数据
    this.loadFromLocalStorage();
  },
  methods: {
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
                monitoring: item.monitoring || '2'
              };
            });
            this.total = this.fixedNumberList.length;
          }
        } catch (e) {
          console.error('恢复数据失败:', e);
        }
      }
    },
    /** 查询定数监测列表 */
    getList() {
      this.loading = true;
      listFixedNumber(this.queryParams).then(response => {
        // 如果后端返回空数据，尝试从 localStorage 恢复
        if (!response.rows || response.rows.length === 0) {
          this.loadFromLocalStorage();
        } else {
          this.fixedNumberList = response.rows.map((item, index) => {
            return {
              ...item,
              index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1,
              difference: item.actualQuantity !== null && item.stockQuantity !== null 
                ? item.actualQuantity - item.stockQuantity 
                : null
            };
          });
          this.total = response.total;
          // 保存到 localStorage
          this.saveToLocalStorage();
        }
        this.loading = false;
      });
    },
    /** 查询仓库列表 */
    getWarehouseList() {
      listWarehouse({ pageNum: 1, pageSize: 1000 }).then(response => {
        this.warehouseList = response.rows || [];
      });
    },
    /** 查询科室列表 */
    getDepartmentList() {
      let userId = this.$store.state.user.userId;
      listdepartAll(userId).then(response => {
        this.departmentList = response || [];
      });
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
      this.queryParams.warehouseId = row.id;
      this.queryParams.departmentId = null;
      // 清空当前列表
      this.fixedNumberList = [];
      this.total = 0;
      // 从 localStorage 加载新仓库的数据
      this.loadFromLocalStorage();
      // 同时触发查询（如果后端有数据）
      this.handleQuery();
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
      }).catch(() => {
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
.app-container > .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container > .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container > .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.app-container > .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
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
</style>

