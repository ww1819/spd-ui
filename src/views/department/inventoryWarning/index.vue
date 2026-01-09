<template>
  <div class="app-container inventory-warning-container">
    <el-row :gutter="20">
      <!-- 左侧科室列表 -->
      <el-col :span="5">
        <el-card class="department-card">
          <div slot="header" class="department-header">
            <span>科室</span>
          </div>
          <div class="department-list">
            <div
              v-for="(department, index) in allDepartmentList"
              :key="department.id"
              :class="['department-item', { 'active': selectedDepartmentId === department.id }]"
              @click="handleDepartmentClick(department)">
              <span class="department-index">{{ index + 1 }}</span>
              <span class="department-code">{{ department.code || '' }}</span>
              <span class="department-name">{{ department.name }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧表格区域 -->
      <el-col :span="19">
        <!-- 查询条件容器 -->
        <div class="query-container" v-show="showSearch">
          <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="80px">
            <el-row class="query-row-left">
              <el-col :span="24">
                <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
                  <div class="query-select-wrapper">
                    <SelectSupplier v-model="queryParams.supplierId" />
                  </div>
                </el-form-item>
                <el-form-item label="科室" prop="departmentId" class="query-item-inline">
                  <div class="query-select-wrapper">
                    <SelectDepartment v-model="queryParams.departmentId" />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row class="query-row-second">
              <el-col :span="24">
                <el-form-item label="产品名称" prop="materialName" class="query-item-inline">
                  <el-input
                    v-model="queryParams.materialName"
                    placeholder="请输入产品名称"
                    clearable
                    style="width: 180px"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <el-row :gutter="10" class="mb8" style="margin-top: -8px;">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="medium"
              :disabled="!selectedDepartmentId"
              @click="handleAdd"
              v-hasPermi="['department:inventoryWarning:add']"
            >新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="primary"
              icon="el-icon-search"
              size="medium"
              @click="handleQuery"
            >搜索</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <!-- 明细表格 -->
        <div class="table-container">
          <el-table v-loading="loading" :data="warningList" :row-class-name="warningIndex" height="calc(100vh - 400px)" border>
            <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip />
            <el-table-column label="编码" align="center" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span style="cursor: pointer;" @dblclick="handleEditWarning(scope.row)">{{ scope.row.material && scope.row.material.code ? scope.row.material.code : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="名称" align="center" min-width="200" show-overflow-tooltip>
              <template slot-scope="scope">
                <span style="cursor: pointer;" @dblclick="handleEditWarning(scope.row)">{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="规格" align="center" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="型号" align="center" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.material && scope.row.material.model ? scope.row.material.model : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单位" align="center" width="80" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.material && scope.row.material.unit && scope.row.material.unit.name ? scope.row.material.unit.name : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" align="center" width="100" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.material && scope.row.material.unitPrice ? parseFloat(scope.row.material.unitPrice).toFixed(2) : '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="少于数量预警" align="center" prop="minQtyWarning" width="130" show-overflow-tooltip />
            <el-table-column label="多余数量预警" align="center" prop="maxQtyWarning" width="130" show-overflow-tooltip />
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
            <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.material && scope.row.material.warehouseCategory && scope.row.material.warehouseCategory.name ? scope.row.material.warehouseCategory.name : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.material && scope.row.material.financeCategory && scope.row.material.financeCategory.name ? scope.row.material.financeCategory.name : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right">
              <template slot-scope="scope">
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdate(scope.row)"
                  v-hasPermi="['department:inventoryWarning:edit']"
                >修改</el-button>
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['department:inventoryWarning:remove']"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <pagination
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </el-col>
    </el-row>

    <!-- 添加耗材对话框 -->
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
                    placeholder="请输入产品名称"
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
          <el-button @click="cancel" size="medium" style="margin-right:10px;">取消</el-button>
          <el-button type="primary" icon="el-icon-check" size="medium" @click="submitForm" style="margin-right:10px;">保存</el-button>
          <el-button type="primary" icon="el-icon-search" size="medium" @click="handleDialogQuery">搜索</el-button>
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
          <el-table-column label="名称" align="center" min-width="220" show-overflow-tooltip>
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
              <span>{{ scope.row.unitPrice ? parseFloat(scope.row.unitPrice).toFixed(2) : '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" align="center" prop="qty" width="110" show-overflow-tooltip />
          <el-table-column label="金额" align="center" prop="amt" width="110" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.amt ? parseFloat(scope.row.amt).toFixed(2) : '0.00' }}</span>
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

    <!-- 预警设置对话框 -->
    <el-dialog title="预警设置" :visible.sync="warningDialogVisible" width="500px" :close-on-click-modal="false">
      <el-form :model="warningForm" :rules="warningRules" ref="warningForm" label-width="120px">
        <el-form-item label="产品编码">
          <el-input v-model="warningForm.materialCode" disabled />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="warningForm.materialName" disabled />
        </el-form-item>
        <el-form-item label="数量少于预警" prop="minQtyWarning">
          <el-input-number v-model="warningForm.minQtyWarning" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="数量多余预警" prop="maxQtyWarning">
          <el-input-number v-model="warningForm.maxQtyWarning" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="warningDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitWarningForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listInventoryWarning, getInventoryWarning, delInventoryWarning, addInventoryWarning, updateInventoryWarning } from "@/api/department/inventoryWarning";
import { listInventory } from "@/api/department/depInventory";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import { listdepartAll } from "@/api/foundation/depart";

export default {
  name: "InventoryWarning",
  components: {
    SelectSupplier,
    SelectDepartment,
    SelectMaterial
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
      // 预警设置表格数据
      warningList: [],
      // 所有科室列表（用于左侧列表）
      allDepartmentList: [],
      // 选中的科室ID
      selectedDepartmentId: null,
      // 选中的科室对象
      selectedDepartment: null,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        supplierId: null,
        departmentId: null,
        materialName: null,
      },
      // 表单参数
      form: {},
      // 对话框查询参数
      dialogQueryParams: {
        departmentId: null,
        supplierId: null,
        materialName: null,
        pageNum: 1,
        pageSize: 1000,
      },
      // 对话框库存列表
      dialogInventoryList: [],
      // 对话框加载状态
      dialogLoading: false,
      // 对话框选中的行
      dialogSelectedRows: [],
      // 预警设置对话框
      warningDialogVisible: false,
      warningForm: {
        id: null,
        materialCode: '',
        materialName: '',
        minQtyWarning: 0,
        maxQtyWarning: 0
      },
      warningRules: {
        minQtyWarning: [
          { required: true, message: "数量少于预警不能为空", trigger: "blur" }
        ],
        maxQtyWarning: [
          { required: true, message: "数量多余预警不能为空", trigger: "blur" }
        ]
      },
      // 表单校验
      rules: {
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
    this.getAllDepartmentList();
  },
  methods: {
    /** 获取所有科室列表（用于左侧列表） */
    getAllDepartmentList() {
      const userId = this.$store.state.user.userId;
      listdepartAll(userId).then(response => {
        this.allDepartmentList = response || [];
      });
    },
    /** 查询预警设置列表 */
    getList() {
      this.loading = true;
      listInventoryWarning(this.queryParams).then(response => {
        this.warningList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      });
    },
    /** 科室列表项点击 */
    handleDepartmentClick(department) {
      if (this.selectedDepartmentId === department.id) {
        // 如果点击的是已选中的项，则取消选择
        this.selectedDepartmentId = null;
        this.selectedDepartment = null;
        this.queryParams.departmentId = null;
      } else {
        // 选中新的科室
        this.selectedDepartmentId = department.id;
        this.selectedDepartment = department;
        this.queryParams.departmentId = department.id;
      }
      this.handleQuery();
    },
    /** 获取选中科室名称 */
    getSelectedDepartmentName() {
      if (this.selectedDepartment && this.selectedDepartment.name) {
        return this.selectedDepartment.name;
      }
      // 如果selectedDepartment为空，从allDepartmentList中查找
      if (this.selectedDepartmentId && this.allDepartmentList.length > 0) {
        const dept = this.allDepartmentList.find(d => d.id === this.selectedDepartmentId);
        return dept ? dept.name : '';
      }
      return '';
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
        departmentId: null,
        minQtyWarning: 0,
        maxQtyWarning: 0,
      };
      this.dialogQueryParams = {
        departmentId: null,
        supplierId: null,
        materialName: null,
        pageNum: 1,
        pageSize: 1000,
      };
      this.dialogInventoryList = [];
      this.dialogSelectedRows = [];
      this.resetForm("form");
      this.resetForm("dialogQueryForm");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.selectedDepartmentId = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      // 检查是否选中了科室
      if (!this.selectedDepartmentId) {
        this.$modal.msgWarning("请先选择科室");
        return;
      }
      this.reset();
      this.open = true;
      this.title = "添加耗材";
      // 如果左侧选中了科室，自动填充到对话框
      if (this.selectedDepartmentId) {
        this.dialogQueryParams.departmentId = this.selectedDepartmentId;
        this.form.departmentId = this.selectedDepartmentId;
      }
      // 加载当前科室的库存
      this.getDialogInventoryList();
    },
    /** 对话框查询库存列表 */
    getDialogInventoryList() {
      if (!this.dialogQueryParams.departmentId) {
        this.dialogInventoryList = [];
        return;
      }
      this.dialogLoading = true;
      listInventory(this.dialogQueryParams).then(response => {
        this.dialogInventoryList = response.rows || [];
        this.dialogLoading = false;
      }).catch(() => {
        this.dialogLoading = false;
      });
    },
    /** 对话框搜索按钮 */
    handleDialogQuery() {
      this.dialogQueryParams.pageNum = 1;
      this.getDialogInventoryList();
    },
    /** 对话框重置按钮 */
    handleDialogReset() {
      this.dialogQueryParams.supplierId = null;
      this.dialogQueryParams.materialName = null;
      this.handleDialogQuery();
    },
    /** 对话框表格选择变化 */
    handleDialogSelectionChange(selection) {
      this.dialogSelectedRows = selection;
    },
    /** 对话框明细表格序号 */
    dialogInventoryIndex({ row, rowIndex }) {
      row.index = (this.dialogQueryParams.pageNum - 1) * this.dialogQueryParams.pageSize + rowIndex + 1;
    },
    /** 双击编辑预警设置 */
    handleEditWarning(row) {
      this.warningForm = {
        id: row.id,
        materialCode: row.material && row.material.code ? row.material.code : '',
        materialName: row.material && row.material.name ? row.material.name : '',
        minQtyWarning: row.minQtyWarning || 0,
        maxQtyWarning: row.maxQtyWarning || 0
      };
      this.warningDialogVisible = true;
    },
    /** 提交预警设置 */
    submitWarningForm() {
      this.$refs["warningForm"].validate(valid => {
        if (valid) {
          const data = {
            id: this.warningForm.id,
            minQtyWarning: this.warningForm.minQtyWarning,
            maxQtyWarning: this.warningForm.maxQtyWarning
          };
          updateInventoryWarning(data).then(response => {
            this.$modal.msgSuccess("修改成功");
            this.warningDialogVisible = false;
            this.getList();
          });
        }
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getInventoryWarning(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改预警设置";
      });
    },
    /** 提交按钮 */
    submitForm() {
      if (!this.form.departmentId) {
        this.$modal.msgError("请选择科室");
        return;
      }
      if (this.dialogSelectedRows.length === 0) {
        this.$modal.msgError("请选择至少一个耗材");
        return;
      }
      
      // 批量保存选中的耗材预警设置
      const promises = [];
      for (let row of this.dialogSelectedRows) {
        const warningData = {
          departmentId: this.form.departmentId,
          materialId: row.materialId,
          minQtyWarning: this.form.minQtyWarning || 0,
          maxQtyWarning: this.form.maxQtyWarning || 0,
        };
        promises.push(addInventoryWarning(warningData));
      }
      
      Promise.all(promises).then(() => {
        this.$modal.msgSuccess("新增成功");
        this.open = false;
        this.getList();
      }).catch(() => {
        this.$modal.msgError("部分保存失败");
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除预警设置编号为"' + ids + '"的数据项？').then(function() {
        return delInventoryWarning(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    warningIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.local-modal-content {
  background: #fff;
  border-radius: 6px;
  width: 100% !important;
  max-width: 1900px !important;
  min-width: 1700px !important;
  max-height: 92%;
  min-height: 870px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
}

/* 科室卡片样式 */
.department-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.department-card ::v-deep .el-card__header {
  padding: 18px 20px;
  border-bottom: 1px solid #EBEEF5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  flex-shrink: 0;
}

.department-card ::v-deep .el-card__body {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.department-header {
  font-weight: bold;
  font-size: 14px;
}

.department-list {
  height: 100%;
  overflow-y: auto;
  padding: 10px 0;
}

.department-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
}

.department-code {
  min-width: 80px;
  color: #909399;
  font-size: 13px;
  margin-right: 8px;
}

.department-name {
  flex: 1;
}

.department-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.department-item.active {
  background-color: #ecf5ff;
  color: #409EFF;
  border-left-color: #409EFF;
  font-weight: 500;
}

.department-index {
  min-width: 40px;
  color: #909399;
  font-size: 13px;
  margin-right: 8px;
  text-align: center;
}

.department-code {
  min-width: 80px;
  color: #909399;
  font-size: 13px;
  margin-right: 8px;
}

.department-name {
  flex: 1;
}

/* 查询条件容器 */
.query-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  width: calc(100% + 20px);
  margin-left: -15px;
  margin-right: -10px;
}

/* 对话框查询条件容器 */
.dialog-query-container {
  background: #fff;
  padding: 15px 20px;
  border-radius: 6px;
  margin-bottom: 15px;
  border: 1px solid #EBEEF5;
}

.query-row-left {
  margin-bottom: 10px;
}

.query-row-second {
  margin-bottom: 0;
}

.query-item-inline {
  margin-right: 20px;
  margin-bottom: 10px;
}

.query-select-wrapper {
  width: 180px;
}

/* 表格容器 */
.table-container {
  width: calc(100% + 20px);
  margin-left: -15px;
  margin-right: -10px;
}

/* 表格列不换行 */
.el-table {
  white-space: nowrap;
}

.el-table td,
.el-table th {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 12px 8px !important;
}

/* 对话框表格列间距优化 */
.local-modal-content .el-table td,
.local-modal-content .el-table th {
  padding: 12px 10px !important;
}

/* 表格横向滚动 */
.el-table__body-wrapper {
  overflow-x: auto;
}

/* 表格底部滚动条增粗 */
.el-table__body-wrapper::-webkit-scrollbar {
  height: 14px;
}

.el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 对话框表格滚动条也增粗 */
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  height: 14px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 确保容器有相对定位，以便弹窗正确定位 */
.inventory-warning-container {
  position: relative;
  min-height: calc(100vh - 84px);
  width: 100%;
  overflow: visible;
}

/* 固定底部按钮样式 */
.modal-footer-fixed {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px 24px;
  text-align: center;
  border-top: 1px solid #EBEEF5;
  margin-top: 20px;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.modal-footer-fixed .el-button {
  margin: 0 8px;
}
</style>

