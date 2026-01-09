<template>
  <div class="app-container warehouse-container">
    <el-row :gutter="20">
      <!-- 左侧仓库列表 -->
      <el-col :span="6">
        <el-card class="warehouse-card">
          <div slot="header" class="warehouse-header">
            <span>仓库</span>
          </div>
          <div class="warehouse-list">
            <div
              v-for="warehouse in allWarehouseList"
              :key="warehouse.id"
              :class="['warehouse-item', { 'active': selectedWarehouseId === warehouse.id }]"
              @click="handleWarehouseClick(warehouse)">
              {{ warehouse.name }}
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧表格区域 -->
      <el-col :span="18">
    <!-- 查询条件容器 -->
    <div class="query-container" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="68px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="仓库编码" prop="code" label-width="100px">
              <el-input
                v-model="queryParams.code"
                placeholder="请输入仓库编码"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="仓库名称" prop="name" label-width="100px">
              <el-input
                v-model="queryParams.name"
                placeholder="请输入仓库名称"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['foundation:warehouse:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="small"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['foundation:warehouse:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="small"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['foundation:warehouse:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['foundation:warehouse:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList" :row-class-name="warehouseIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip />
      <el-table-column label="仓库编码" align="center" prop="code" width="120" show-overflow-tooltip />
      <el-table-column label="仓库名称" align="center" prop="name" min-width="180" show-overflow-tooltip />
      <el-table-column label="负责人" align="center" prop="warehousePerson" width="100" show-overflow-tooltip />
      <el-table-column label="电话" align="center" prop="warehousePhone" width="120" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="warehouseStatus" width="80" show-overflow-tooltip>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_use_status" :value="scope.row.warehouseStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="仓库类型" align="center" prop="warehouseType" width="100" show-overflow-tooltip />
      <el-table-column label="创建日期" align="center" prop="createTime" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:warehouse:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:warehouse:remove']"
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

    <!-- 添加或修改仓库对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>{{ title }}</span>
          <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="仓库编码" prop="code">
                <el-input v-model="form.code" :disabled="isDisabled" placeholder="请输入仓库编码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="仓库名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入仓库名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="负责人" prop="warehousePerson">
                <el-input v-model="form.warehousePerson" placeholder="请输入负责人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="电话" prop="warehousePhone">
                <el-input v-model="form.warehousePhone" placeholder="请输入电话" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="状态" prop="warehouseStatus">
                <el-select v-model="form.warehouseStatus" placeholder="请选择状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.is_use_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="仓库类型" prop="warehouseType">
                <el-select v-model="form.warehouseType" placeholder="请选择仓库类型" style="width: 100%">
                  <el-option label="高值" value="高值"></el-option>
                  <el-option label="低值" value="低值"></el-option>
                  <el-option label="试剂" value="试剂"></el-option>
                  <el-option label="设备" value="设备"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结算类型" prop="settlementType">
                <el-select v-model="form.settlementType" placeholder="请选择结算类型" style="width: 100%">
                  <el-option label="入库结算" value="1"></el-option>
                  <el-option label="出库结算" value="2"></el-option>
                  <el-option label="消耗结算" value="3"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="form.remark" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="modal-footer-fixed">
          <el-button type="primary" @click="submitForm">保 存</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listWarehouse, getWarehouse, delWarehouse, addWarehouse, updateWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "Warehouse",
  dicts: ['is_use_status'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      isDisabled: false,
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 仓库表格数据
      warehouseList: [],
      // 所有仓库列表（用于左侧列表）
      allWarehouseList: [],
      // 选中的仓库ID
      selectedWarehouseId: null,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        code: [
          { required: true, message: "仓库编码不能为空", trigger: "blur" },
          { validator: (rule, value, callback) => {
            if (!value) {
              callback();
              return;
            }
            
            // 检查编码是否已存在（排除当前编辑的记录）
            listWarehouse({ code: value, pageNum: 1, pageSize: 1 }).then(response => {
              if (response.rows && response.rows.length > 0) {
                const existingWarehouse = response.rows[0];
                // 如果是新增模式，或者存在其他记录的编码，则报错
                if (!this.form.id || existingWarehouse.id !== this.form.id) {
                  callback(new Error('该仓库编码已存在，请使用其他编码'));
                } else {
                  callback();
                }
              } else {
                callback();
              }
            }).catch(() => {
              callback();
            });
          }, trigger: "blur" }
        ],
        name: [
          { required: true, message: "仓库名称不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
    this.getAllWarehouseList();
  },
  methods: {
    /** 获取所有仓库列表（用于左侧列表） */
    getAllWarehouseList() {
      listWarehouse({ pageNum: 1, pageSize: 10000 }).then(response => {
        this.allWarehouseList = response.rows || [];
      });
    },
    /** 查询仓库列表 */
    getList() {
      this.loading = true;
      listWarehouse(this.queryParams).then(response => {
        this.warehouseList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 仓库列表项点击 */
    handleWarehouseClick(warehouse) {
      if (this.selectedWarehouseId === warehouse.id) {
        // 如果点击的是已选中的项，则取消选择
        this.selectedWarehouseId = null;
        this.queryParams.name = null;
      } else {
        // 选中新的仓库
        this.selectedWarehouseId = warehouse.id;
        this.queryParams.name = warehouse.name;
      }
      this.handleQuery();
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
        code: null,
        name: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        warehousePerson: null,
        warehousePhone: null,
        warehouseStatus: null,
        warehouseType: '低值',
        settlementType: null,
        remark: null,
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
      this.selectedWarehouseId = null;
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
      this.reset();
      this.open = true;
      this.isDisabled = false;
      this.form.warehouseStatus = '2';
      this.form.warehouseType = '低值';
      this.title = "添加仓库";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getWarehouse(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.isDisabled = true;
        this.title = "修改仓库";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.getAllWarehouseList();
            });
          } else {
            addWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.getAllWarehouseList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除仓库编号为"' + ids + '"的数据项？').then(function() {
        return delWarehouse(ids);
      }).then(() => {
        this.getList();
        this.getAllWarehouseList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    warehouseIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/warehouse/export', {
        ...this.queryParams
      }, `warehouse_${new Date().getTime()}.xlsx`)
    }
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

/* 仓库卡片样式 */
.warehouse-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.warehouse-card ::v-deep .el-card__header {
  padding: 18px 20px;
  border-bottom: 1px solid #EBEEF5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  flex-shrink: 0;
}

.warehouse-card ::v-deep .el-card__body {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.warehouse-header {
  font-weight: bold;
  font-size: 14px;
}

.warehouse-list {
  height: 100%;
  overflow-y: auto;
  padding: 10px 0;
}

.warehouse-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.warehouse-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.warehouse-item.active {
  background-color: #ecf5ff;
  color: #409EFF;
  border-left-color: #409EFF;
  font-weight: 500;
}

/* 查询条件容器 */
.query-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  width: 100%;
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
}

/* 表格横向滚动 */
.el-table__body-wrapper {
  overflow-x: auto;
}

/* 确保仓库容器有相对定位，以便弹窗正确定位 */
.warehouse-container {
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
