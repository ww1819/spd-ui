<template>
  <div class="app-container">
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

    <el-table v-loading="loading" :data="financeCategoryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="财务分类编码" align="center" prop="financeCategoryCode" />
      <el-table-column label="财务分类名称" align="center" prop="financeCategoryName" />
      <el-table-column label="财务分类地址" align="center" prop="financeCategoryAddress" />
      <el-table-column label="财务分类联系方式" align="center" prop="financeCategoryContact" />
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

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改财务分类维护对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="财务分类编码" prop="financeCategoryCode">
          <el-input v-model="form.financeCategoryCode" placeholder="请输入财务分类编码" />
        </el-form-item>
        <el-form-item label="财务分类名称" prop="financeCategoryName">
          <el-input v-model="form.financeCategoryName" placeholder="请输入财务分类名称" />
        </el-form-item>

        <el-form-item label="财务分类联系方式" prop="financeCategoryContact">
          <el-input v-model="form.financeCategoryContact" placeholder="请输入财务分类联系方式" />
        </el-form-item>

        <el-form-item label="财务分类地址" prop="financeCategoryAddress">
          <el-input v-model="form.financeCategoryAddress" type="textarea" placeholder="请输入财务分类地址" />
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
import { listFinanceCategory, getFinanceCategory, delFinanceCategory, addFinanceCategory, updateFinanceCategory } from "@/api/foundation/financeCategory";

export default {
  name: "FinanceCategory",
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
      // 财务分类维护表格数据
      financeCategoryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        financeCategoryCode: null,
        financeCategoryName: null,
        financeCategoryAddress: null,
        financeCategoryContact: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        financeCategoryCode: [
          { required: true, message: "财务分类编码不能为空", trigger: "blur" }
        ],
        financeCategoryName: [
          { required: true, message: "财务分类名称不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询财务分类维护列表 */
    getList() {
      this.loading = true;
      listFinanceCategory(this.queryParams).then(response => {
        this.financeCategoryList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        financeCategoryId: null,
        financeCategoryCode: null,
        financeCategoryName: null,
        financeCategoryAddress: null,
        financeCategoryContact: null,
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
      this.ids = selection.map(item => item.financeCategoryId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加财务分类维护";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const financeCategoryId = row.financeCategoryId || this.ids
      getFinanceCategory(financeCategoryId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改财务分类维护";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.financeCategoryId != null) {
            updateFinanceCategory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addFinanceCategory(this.form).then(response => {
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
      const financeCategoryIds = row.financeCategoryId || this.ids;
      this.$modal.confirm('是否确认删除财务分类维护编号为"' + financeCategoryIds + '"的数据项？').then(function() {
        return delFinanceCategory(financeCategoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/financeCategory/export', {
        ...this.queryParams
      }, `financeCategory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
