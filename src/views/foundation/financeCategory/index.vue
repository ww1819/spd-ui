<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧固定高度树形结构 -->
      <el-col :span="4">
        <el-card class="tree-card">
          <el-tree
            :data="treeData"
            :props="treeProps"
            node-key="financeCategoryId"
            highlight-current
            style="height: calc(100vh - 150px); overflow-y: auto"
          >
            <span slot-scope="{ node }" class="custom-tree-node">
              <i class="el-icon-folder-opened" />
              <span>{{ node.label }}</span>
            </span>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧内容区域 -->
      <el-col :span="20">
        <!-- 搜索表单 -->
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="财务分类编码" prop="financeCategoryCode" label-width="100px">
                <el-input
                  v-model="queryParams.financeCategoryCode"
                  placeholder="请输入财务分类编码"
                  clearable
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="财务分类名称" prop="financeCategoryName" label-width="100px">
                <el-input
                  v-model="queryParams.financeCategoryName"
                  placeholder="请输入财务分类名称"
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

        <!-- 操作按钮 -->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="mini"
              @click="handleAdd"
              v-hasPermi="['foundation:financeCategory:add']"
            >新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="success"
              plain
              icon="el-icon-edit"
              size="mini"
              :disabled="single"
              @click="handleUpdate"
              v-hasPermi="['foundation:financeCategory:edit']"
            >修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="danger"
              plain
              icon="el-icon-delete"
              size="mini"
              :disabled="single"
              @click="handleDelete"
              v-hasPermi="['foundation:financeCategory:remove']"
            >删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="warning"
              plain
              icon="el-icon-download"
              size="mini"
              @click="handleExport"
              v-hasPermi="['foundation:financeCategory:export']"
            >导出</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <!-- 数据表格 -->
        <el-table v-loading="loading" :data="financeCategoryList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="财务分类编码" align="center" prop="financeCategoryCode" />
          <el-table-column label="财务分类名称" align="center" prop="financeCategoryName" />
          <el-table-column label="联系方式" align="center" prop="financeCategoryContact" />
          <el-table-column label="详细地址" align="center" prop="financeCategoryAddress" />
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
                v-hasPermi="['foundation:financeCategory:edit']"
              >修改</el-button>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                @click="handleDelete(scope.row)"
                v-hasPermi="['foundation:financeCategory:remove']"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />

        <!-- 新增/修改弹窗 -->
        <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
          <el-form ref="form" :model="form" :rules="rules" label-width="150px">
            <el-form-item label="财务分类编码" prop="financeCategoryCode">
              <el-input v-model="form.financeCategoryCode" placeholder="请输入财务分类编码" />
            </el-form-item>
            <el-form-item label="财务分类名称" prop="financeCategoryName">
              <el-input v-model="form.financeCategoryName" placeholder="请输入财务分类名称" />
            </el-form-item>
            <el-form-item label="联系方式" prop="financeCategoryContact">
              <el-input v-model="form.financeCategoryContact" placeholder="请输入联系方式" />
            </el-form-item>
            <el-form-item label="详细地址" prop="financeCategoryAddress">
              <el-input v-model="form.financeCategoryAddress" type="textarea" placeholder="请输入详细地址" />
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </el-dialog>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { listFinanceCategory, getFinanceCategory, delFinanceCategory, addFinanceCategory, updateFinanceCategory } from "@/api/foundation/financeCategory";

export default {
  name: "FinanceCategory",
  data() {
    return {
      // 树形数据配置
      treeData: [],
      treeProps: {
        label: 'financeCategoryName',
        children: 'children'
      },
      // 表格相关
      loading: true,
      financeCategoryList: [],
      total: 0,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        financeCategoryCode: null,
        financeCategoryName: null,
      },
      // 表单相关
      form: {},
      open: false,
      title: "",
      rules: {
        financeCategoryCode: [
          { required: true, message: "财务分类编码不能为空", trigger: "blur" }
        ],
        financeCategoryName: [
          { required: true, message: "财务分类名称不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 获取数据列表
    getList() {
      this.loading = true;
      listFinanceCategory(this.queryParams).then(response => {
        this.financeCategoryList = response.rows;
        this.total = response.total;
        this.treeData = [{
          financeCategoryId: 'root',
          financeCategoryName: '全部分类',
          children: this.financeCategoryList
        }];
        this.loading = false;
      });
    },
    // 树节点点击事件
    handleNodeClick(data) {
      if (data.financeCategoryId !== 'root') {
        // 这里可以添加节点筛选逻辑
      }
    },
    // 搜索相关方法
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 表格多选
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.financeCategoryId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    // 新增/修改操作
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加财务分类";
    },
    handleUpdate(row) {
      this.reset();
      const financeCategoryId = row.financeCategoryId || this.ids;
      getFinanceCategory(financeCategoryId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改财务分类";
      });
    },
    // 表单提交
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.financeCategoryId) {
            updateFinanceCategory(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addFinanceCategory(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    // 删除操作
    handleDelete(row) {
      const financeCategoryIds = row.financeCategoryId || this.ids;
      this.$modal.confirm('确认删除选中的数据？').then(() => {
        return delFinanceCategory(financeCategoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      });
    },
    // 其他辅助方法
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        financeCategoryId: null,
        financeCategoryCode: null,
        financeCategoryName: null,
        financeCategoryAddress: null,
        financeCategoryContact: null
      };
      this.resetForm("form");
    },
    // 导出功能
    handleExport() {
      this.download('foundation/financeCategory/export', {
        ...this.queryParams
      }, `financeCategory_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style scoped>
.tree-card {
  height: calc(100vh - 120px);
}
.tree-card ::v-deep .el-card__body {
  padding: 10px;
}
.custom-tree-node {
  font-size: 14px;
  display: flex;
  align-items: center;
}
.custom-tree-node i {
  margin-right: 5px;
  color: #409EFF;
}
</style>
