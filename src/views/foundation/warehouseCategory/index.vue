<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧树形菜单 -->
      <el-col :span="4">
        <el-card class="tree-card">
          <el-tree
            :data="treeData"
            :props="treeProps"
            node-key="warehouseCategoryId"
            highlight-current
            @node-click="handleNodeClick"
            :indent="20"
            :default-expand-all="true"
        >
            <span slot-scope="{ node }" class="custom-tree-node">
              <i class="el-icon-folder-opened" />
              <span>{{ node.label }}</span>
            </span>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧表格区域 -->
      <el-col :span="20">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="10">
              <el-form-item label="分类编码" prop="warehouseCategoryCode">
                <el-input
                  v-model="queryParams.warehouseCategoryCode"
                  placeholder="请输入分类编码"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="分类名称" prop="warehouseCategoryName">
                <el-input
                  v-model="queryParams.warehouseCategoryName"
                  placeholder="请输入分类名称"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="small"
              @click="handleAdd"
              v-hasPermi="['foundation:warehouseCategory:add']"
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
              v-hasPermi="['foundation:warehouseCategory:edit']"
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
              v-hasPermi="['foundation:warehouseCategory:remove']"
            >删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="warning"
              plain
              icon="el-icon-download"
              size="small"
              @click="handleExport"
              v-hasPermi="['foundation:warehouseCategory:export']"
            >导出</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="warehouseCategoryList" :row-class-name="warehouseCategoryIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="分类编码" align="center" prop="warehouseCategoryCode" width="120"/>
          <el-table-column label="分类名称" align="center" prop="warehouseCategoryName" width="180"/>
          <el-table-column label="上级分类" align="center" width="150">
            <template slot-scope="scope">
              <span v-if="scope.row.parentId && scope.row.parentId !== 0">{{ getParentCategoryName(scope.row.parentId) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建日期" align="center" prop="createTime" width="100">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="是否" align="center" width="100">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.delFlag"
                :active-value="0"
                :inactive-value="1"
                @change="handleStatusChange(scope.row)"
              ></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
            <template slot-scope="scope">
              <el-button
                size="small"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
                v-hasPermi="['foundation:warehouseCategory:edit']"
              >修改</el-button>
              <el-button
                size="small"
                type="text"
                icon="el-icon-delete"
                @click="handleDelete(scope.row)"
                v-hasPermi="['foundation:warehouseCategory:remove']"
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

    <!-- 添加或修改仓库分类对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分类编码" prop="warehouseCategoryCode">
                <el-input v-model="form.warehouseCategoryCode" :disabled="isDisabled" placeholder="请输入分类编码" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分类名称" prop="warehouseCategoryName">
                <el-input v-model="form.warehouseCategoryName" placeholder="请输入分类名称" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择上级分类" prop="parentId">
                <el-select v-model="form.parentId" placeholder="请选择上级分类" clearable style="width: 100%">
                  <el-option
                    v-for="item in parentOptions"
                    :key="item.warehouseCategoryId"
                    :label="item.warehouseCategoryName"
                    :value="item.warehouseCategoryId"
                    :disabled="form.warehouseCategoryId && item.warehouseCategoryId === form.warehouseCategoryId"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listWarehouseCategory, getWarehouseCategory, delWarehouseCategory, addWarehouseCategory, updateWarehouseCategory, treeselect } from "@/api/foundation/warehouseCategory";

export default {
  name: "WarehouseCategory",
  data() {
    return {
      // 树形数据
      treeData: [],
      treeProps: {
        label: 'warehouseCategoryName',
        children: 'children'
      },
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
      // 库房分类表格数据
      warehouseCategoryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseCategoryCode: null,
        warehouseCategoryName: null,
      },
      // 表单参数
      form: {},
      // 父级分类选项
      parentOptions: [],
      // 分类映射（用于根据ID快速查找分类名称）
      categoryMap: {},
      // 表单校验
      rules: {
        warehouseCategoryCode: [
          { required: true, message: "库房分类编码不能为空", trigger: "blur" }
        ],
        warehouseCategoryName: [
          { required: true, message: "库房分类名称不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询库房分类列表 */
    getList() {
      this.loading = true;
      // 并行获取列表数据和树形数据
      Promise.all([
        listWarehouseCategory(this.queryParams),
        treeselect()
      ]).then(([listResponse, treeResponse]) => {
        const allData = treeResponse.data || [];
        // 构建分类映射
        this.buildCategoryMap(allData);
        // 设置列表数据
        this.warehouseCategoryList = listResponse.rows;
        this.total = listResponse.total;
        // 构建树形数据
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          warehouseCategoryId: 'root',
          warehouseCategoryName: '全部库房',
          children: tree
        }];
        // 构建父级选项（排除当前编辑的项）
        this.parentOptions = this.buildParentOptions(allData, this.form.warehouseCategoryId);
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    /** 加载树形数据 */
    loadTreeData() {
      treeselect().then(response => {
        const allData = response.data || [];
        // 构建分类映射
        this.buildCategoryMap(allData);
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          warehouseCategoryId: 'root',
          warehouseCategoryName: '全部库房',
          children: tree
        }];
        // 构建父级选项（排除当前编辑的项）
        this.parentOptions = this.buildParentOptions(allData, this.form.warehouseCategoryId);
      });
    },
    /** 构建分类映射 */
    buildCategoryMap(data) {
      this.categoryMap = {};
      data.forEach(item => {
        this.categoryMap[item.warehouseCategoryId] = item.warehouseCategoryName;
      });
    },
    /** 根据父分类ID获取父分类名称 */
    getParentCategoryName(parentId) {
      return this.categoryMap[parentId] || '';
    },
    /** 构建树形结构 */
    buildTree(data, parentId) {
      const tree = [];
      data.forEach(item => {
        if (item.parentId === parentId || (parentId === 0 && (item.parentId === null || item.parentId === 0))) {
          const children = this.buildTree(data, item.warehouseCategoryId);
          if (children.length > 0) {
            item.children = children;
          }
          tree.push(item);
        }
      });
      return tree;
    },
    /** 构建父级选项 */
    buildParentOptions(data, excludeId) {
      const options = [{ warehouseCategoryId: 0, warehouseCategoryName: '顶级分类' }];
      data.forEach(item => {
        if (item.warehouseCategoryId !== excludeId) {
          options.push(item);
        }
      });
      return options;
    },
    /** 树节点点击事件 */
    handleNodeClick(data) {
      if (data.warehouseCategoryId !== 'root') {
        console.log('选中节点:', data);
        // 此处可添加筛选逻辑
      }
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        warehouseCategoryId: null,
        parentId: 0,
        warehouseCategoryCode: null,
        warehouseCategoryName: null,
        delFlag: null,
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
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.warehouseCategoryId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.loadTreeData();
      this.open = true;
      this.title = "添加库房分类";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const warehouseCategoryId = row.warehouseCategoryId || this.ids
      getWarehouseCategory(warehouseCategoryId).then(response => {
        this.form = response.data;
        this.loadTreeData();
        this.open = true;
        this.title = "修改库房分类";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.warehouseCategoryId != null) {
            updateWarehouseCategory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            // 如果没有设置parentId，默认为0（顶级分类）
            if (this.form.parentId === null || this.form.parentId === undefined) {
              this.form.parentId = 0;
            }
            addWarehouseCategory(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const warehouseCategoryIds = row.warehouseCategoryId || this.ids;
      this.$modal.confirm('是否确认删除库房分类编号为"' + warehouseCategoryIds + '"的数据项？').then(() => {
        return delWarehouseCategory(warehouseCategoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    warehouseCategoryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 状态修改 */
    handleStatusChange(row) {
      let text = row.delFlag === 0 ? "启用" : "禁用";
      this.$modal.confirm('确认要"' + text + '""' + row.warehouseCategoryName + '"库房分类吗？').then(() => {
        return updateWarehouseCategory(row);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
        this.getList();
      }).catch(() => {
        row.delFlag = row.delFlag === 0 ? 1 : 0;
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/warehouseCategory/export', {
        ...this.queryParams
      }, `warehouseCategory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.tree-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  overflow-y: auto;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 3px 0;
}
.el-tree {
  background: transparent;
  padding: 10px;
}
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.local-modal-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 6px;
  min-width: 900px;
  width: 900px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.dialog-footer {
  text-align: right;
  margin-top: 16px;
}
</style>
