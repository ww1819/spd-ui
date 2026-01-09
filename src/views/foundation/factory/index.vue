<!--生产厂家信息维护-->
<template>
  <div class="app-container factory-container">
    <el-row :gutter="20">
      <!-- 左侧厂家列表 -->
      <el-col :span="6">
        <el-card class="factory-card">
          <div slot="header" class="factory-header">
            <span>厂家</span>
          </div>
          <div class="factory-list">
            <div
              v-for="factory in allFactoryList"
              :key="factory.factoryId"
              :class="['factory-item', { 'active': selectedFactoryId === factory.factoryId }]"
              @click="handleFactoryClick(factory)">
              {{ factory.factoryName }}
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
            <el-form-item label="厂家编码" prop="factoryCode" label-width="100px">
              <el-input
                v-model="queryParams.factoryCode"
                placeholder="请输入厂家编码"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="厂家名称" prop="factoryName" label-width="100px">
              <el-input
                v-model="queryParams.factoryName"
                placeholder="请输入厂家名称"
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
          v-hasPermi="['foundation:factory:add']"
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
          v-hasPermi="['foundation:factory:edit']"
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
          v-hasPermi="['foundation:factory:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['foundation:factory:export']"
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

    <el-table v-loading="loading" :data="factoryList" :row-class-name="factoryIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip />
      <el-table-column label="厂家编码" align="center" prop="factoryCode" width="150" show-overflow-tooltip />
      <el-table-column label="厂家名称" align="center" prop="factoryName" min-width="250" show-overflow-tooltip />
      <el-table-column label="厂家地址" align="center" prop="factoryAddress" min-width="300" show-overflow-tooltip />
      <el-table-column label="厂家联系方式" align="center" prop="factoryContact" width="150" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="factoryStatus" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_use_status" :value="scope.row.factoryStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="创建日期" align="center" prop="createTime" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:factory:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:factory:remove']"
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

    <!-- 添加或修改厂家维护对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>{{ title }}</span>
          <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="厂家编码" prop="factoryCode">
                <el-input v-model="form.factoryCode" :disabled="isDisabled" placeholder="请输入厂家编码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="厂家名称" prop="factoryName">
                <el-input v-model="form.factoryName" @input="factoryNameChange" placeholder="请输入厂家名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="厂家简码" prop="factoryReferredCode">
                <el-input v-model="form.factoryReferredCode" :disabled="true" placeholder="请输入厂家名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="使用状态" prop="factoryStatus">
                <el-select v-model="form.factoryStatus" placeholder="请选择使用状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.is_use_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="厂家联系方式" prop="factoryContact">
                <el-input v-model="form.factoryContact" placeholder="请输入厂家联系方式" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="厂家地址" prop="factoryAddress">
                <el-input v-model="form.factoryAddress" type="textarea" placeholder="请输入厂家地址" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
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
import { listFactory, getFactory, delFactory, addFactory, updateFactory } from "@/api/foundation/factory";
import {pinyin} from "pinyin-pro";

export default {
  name: "Factory",
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
      // 厂家维护表格数据
      factoryList: [],
      // 所有厂家列表（用于左侧列表）
      allFactoryList: [],
      // 选中的厂家ID
      selectedFactoryId: null,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        factoryCode: null,
        factoryName: null,
        factoryAddress: null,
        factoryContact: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        factoryCode: [
          { required: true, message: "厂家编码不能为空", trigger: "blur" }
        ],
        factoryName: [
          { required: true, message: "厂家名称不能为空", trigger: "blur" }
        ],
        factoryAddress: [
          { required: true, message: "厂家地址不能为空", trigger: "blur" }
        ],
        factoryContact: [
          { required: true, message: "厂家联系方式不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
    this.getAllFactoryList();
  },
  methods: {
    /** 获取所有厂家列表（用于左侧列表） */
    getAllFactoryList() {
      listFactory({ pageNum: 1, pageSize: 10000 }).then(response => {
        this.allFactoryList = response.rows || [];
      });
    },
    /** 查询厂家维护列表 */
    getList() {
      this.loading = true;
      listFactory(this.queryParams).then(response => {
        this.factoryList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 厂家列表项点击 */
    handleFactoryClick(factory) {
      if (this.selectedFactoryId === factory.factoryId) {
        // 如果点击的是已选中的项，则取消选择
        this.selectedFactoryId = null;
        this.queryParams.factoryName = null;
      } else {
        // 选中新的厂家
        this.selectedFactoryId = factory.factoryId;
        this.queryParams.factoryName = factory.factoryName;
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
        factoryId: null,
        factoryCode: null,
        factoryName: null,
        factoryAddress: null,
        factoryContact: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        factoryReferredCode: null,
        factoryStatus: null,
        remark: null,
      };
      this.resetForm("form");
    },
    factoryNameChange(val){
      const pinYinCode = pinyin(val, {
        pattern: 'first',
        toneType: 'none',
        type: 'array',
      }).join('').toUpperCase();

      this.form.factoryReferredCode = pinYinCode;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.selectedFactoryId = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.factoryId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.isDisabled = false;
      this.title = "添加厂家维护";
      this.form.factoryStatus = '2';
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const factoryId = row.factoryId || this.ids
      getFactory(factoryId).then(response => {
        this.form = response.data;
        this.open = true;
        this.isDisabled = true;
        this.title = "修改厂家维护";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.factoryId != null) {
            updateFactory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.getAllFactoryList();
            });
          } else {
            addFactory(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.getAllFactoryList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const factoryIds = row.factoryId || this.ids;
      this.$modal.confirm('是否确认删除厂家维护编号为"' + factoryIds + '"的数据项？').then(function() {
        return delFactory(factoryIds);
      }).then(() => {
        this.getList();
        this.getAllFactoryList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    factoryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/factory/export', {
        ...this.queryParams
      }, `factory_${new Date().getTime()}.xlsx`)
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

/* 厂家卡片样式 */
.factory-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.factory-card ::v-deep .el-card__header {
  padding: 18px 20px;
  border-bottom: 1px solid #EBEEF5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  flex-shrink: 0;
}

.factory-card ::v-deep .el-card__body {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.factory-header {
  font-weight: bold;
  font-size: 14px;
}

.factory-list {
  height: 100%;
  overflow-y: auto;
  padding: 10px 0;
}

.factory-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.factory-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.factory-item.active {
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

/* 确保厂家容器有相对定位，以便弹窗正确定位 */
.factory-container {
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
