<template>
  <div class="app-container department-container">
    <el-row :gutter="20">
      <!-- 左侧科室列表 -->
      <el-col :span="6">
        <el-card class="department-card">
          <div slot="header" class="department-header">
            <span>科室</span>
          </div>
          <div class="department-list">
            <div
              v-for="department in allDepartmentList"
              :key="department.id"
              :class="['department-item', { 'active': selectedDepartmentId === department.id }]"
              @click="handleDepartmentClick(department)">
              {{ department.name }}
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
            <el-form-item label="科室编码" prop="code" label-width="100px">
              <el-input
                v-model="queryParams.code"
                placeholder="请输入科室编码"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="科室名称" prop="name" label-width="100px">
              <el-input
                v-model="queryParams.name"
                placeholder="请输入科室名称"
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
          v-hasPermi="['foundation:depart:add']"
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
          v-hasPermi="['foundation:depart:edit']"
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
          v-hasPermi="['foundation:depart:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-refresh"
          size="small"
          :disabled="multiple"
          @click="handleUpdateReferred"
          v-hasPermi="['foundation:depart:updateReferred']"
        >更新简码</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['foundation:depart:export']"
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

    <el-table v-loading="loading" :data="departList" :row-class-name="departIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip />
      <el-table-column label="科室编码" align="center" prop="code" width="150" show-overflow-tooltip />
      <el-table-column label="科室名称" align="center" prop="name" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:depart:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:depart:remove']"
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

    <!-- 添加或修改科室对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>{{ title }}</span>
          <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="科室编码" prop="code">
                <el-input v-model="form.code" placeholder="请输入科室编码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="科室名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入科室名称" />
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
import { listdepart, getdepart, deldepart, adddepart, updatedepart, updateDepartReferred } from "@/api/foundation/depart";

export default {
  name: "depart",
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
      // 科室表格数据
      departList: [],
      // 所有科室列表（用于左侧列表）
      allDepartmentList: [],
      // 选中的科室ID
      selectedDepartmentId: null,
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
          { required: true, message: "科室编码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "科室名称不能为空", trigger: "blur" }
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
      listdepart({ pageNum: 1, pageSize: 10000 }).then(response => {
        this.allDepartmentList = response.rows || [];
      });
    },
    /** 查询科室列表 */
    getList() {
      this.loading = true;
      listdepart(this.queryParams).then(response => {
        this.departList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 科室列表项点击 */
    handleDepartmentClick(department) {
      if (this.selectedDepartmentId === department.id) {
        // 如果点击的是已选中的项，则取消选择
        this.selectedDepartmentId = null;
        this.queryParams.name = null;
      } else {
        // 选中新的科室
        this.selectedDepartmentId = department.id;
        this.queryParams.name = department.name;
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
        updateTime: null
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
      this.reset();
      this.open = true;
      this.title = "添加科室";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getdepart(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改科室";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updatedepart(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.getAllDepartmentList();
            });
          } else {
            adddepart(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.getAllDepartmentList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除科室编号为"' + ids + '"的数据项？').then(function() {
        return deldepart(ids);
      }).then(() => {
        this.getList();
        this.getAllDepartmentList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    departIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/depart/export', {
        ...this.queryParams
      }, `depart_${new Date().getTime()}.xlsx`)
    },
    /** 更新科室名称简码 */
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的科室");
        return;
      }
      this.$modal.confirm("是否为选中的科室更新名称简码？").then(() => {
        return updateDepartReferred(this.ids);
      }).then(() => {
        this.$modal.msgSuccess("更新简码成功");
        this.getList();
      }).catch(() => {});
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

/* 确保科室容器有相对定位，以便弹窗正确定位 */
.department-container {
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
