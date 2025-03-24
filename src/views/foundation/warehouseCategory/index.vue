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
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="库房分类编码" prop="warehouseCategoryCode" label-width="100px">
                <el-input
                  v-model="queryParams.warehouseCategoryCode"
                  placeholder="请输入库房分类编码"
                  clearable
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="库房分类名称" prop="warehouseCategoryName" label-width="100px">
                <el-input
                  v-model="queryParams.warehouseCategoryName"
                  placeholder="请输入库房分类名称"
                  clearable
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
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
              size="mini"
              @click="handleAdd"
              v-hasPermi="['foundation:warehouseCategory:add']"
            >新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="warning"
              plain
              icon="el-icon-download"
              size="mini"
              @click="handleExport"
              v-hasPermi="['foundation:warehouseCategory:export']"
            >导出</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="warehouseCategoryList" @selection-change="handleSelectionChange">
          <el-table-column label="库房分类编码" align="center" prop="warehouseCategoryCode" />
          <el-table-column label="库房分类名称" align="center" prop="warehouseCategoryName" />
          <el-table-column label="库房分类地址" align="center" prop="warehouseCategoryAddress" />
          <el-table-column label="库房分类联系方式" align="center" prop="warehouseCategoryContact" />
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
                v-hasPermi="['foundation:warehouseCategory:edit']"
              >修改</el-button>
              <el-button
                size="mini"
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

    <!-- 添加或修改库房分类对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="库房分类编码" prop="warehouseCategoryCode" >
          <el-input v-model="form.warehouseCategoryCode" placeholder="请输入库房分类编码" />
        </el-form-item>
        <el-form-item label="库房分类名称" prop="warehouseCategoryName" >
          <el-input v-model="form.warehouseCategoryName" placeholder="请输入库房分类名称" />
        </el-form-item>
        <el-form-item label="库房分类联系方式" prop="warehouseCategoryContact" >
          <el-input v-model="form.warehouseCategoryContact" placeholder="请输入库房分类联系方式" />
        </el-form-item>
        <el-form-item label="库房分类地址" prop="warehouseCategoryAddress" >
          <el-input v-model="form.warehouseCategoryAddress" type="textarea" placeholder="请输入库房分类地址" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listWarehouseCategory, getWarehouseCategory, delWarehouseCategory, addWarehouseCategory, updateWarehouseCategory } from "@/api/foundation/warehouseCategory";

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
      listWarehouseCategory(this.queryParams).then(response => {
        this.warehouseCategoryList = response.rows;
        this.treeData = [{
          warehouseCategoryId: 'root',
          warehouseCategoryName: '全部库房',
          children: this.warehouseCategoryList
        }];
        this.total = response.total;
        this.loading = false;
      });
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
        warehouseCategoryCode: null,
        warehouseCategoryName: null,
        warehouseCategoryAddress: null,
        warehouseCategoryContact: null,
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
      this.open = true;
      this.title = "添加库房分类";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const warehouseCategoryId = row.warehouseCategoryId || this.ids
      getWarehouseCategory(warehouseCategoryId).then(response => {
        this.form = response.data;
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
</style>
