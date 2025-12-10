<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="分类编码" prop="materialCategoryCode">
            <el-input
              v-model="queryParams.materialCategoryCode"
              placeholder="请输入分类编码"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="分类名称" prop="materialCategoryName">
            <el-input
              v-model="queryParams.materialCategoryName"
              placeholder="请输入分类名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
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
          v-hasPermi="['foundation:materialCategory:add']"
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
          v-hasPermi="['foundation:materialCategory:edit']"
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
          v-hasPermi="['foundation:materialCategory:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['foundation:materialCategory:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="materialCategoryList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="materialCategoryId" width="50"/>
      <el-table-column label="分类编码" align="center" prop="materialCategoryCode" width="120"/>
      <el-table-column label="分类名称" align="center" prop="materialCategoryName" width="180"/>
      <el-table-column label="分类地址" align="center" prop="materialCategoryAddress" width="200"/>
      <el-table-column label="联系方式" align="center" prop="materialCategoryContact" width="120"/>
      <el-table-column label="创建日期" align="center" prop="createTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:materialCategory:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:materialCategory:remove']"
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

    <!-- 添加或修改耗材分类对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="分类编码" prop="materialCategoryCode">
                <el-input v-model="form.materialCategoryCode" :disabled="isDisabled" placeholder="请输入分类编码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="分类名称" prop="materialCategoryName">
                <el-input v-model="form.materialCategoryName" placeholder="请输入分类名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="分类地址" prop="materialCategoryAddress">
                <el-input v-model="form.materialCategoryAddress" type="textarea" placeholder="请输入分类地址" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系方式" prop="materialCategoryContact">
                <el-input v-model="form.materialCategoryContact" placeholder="请输入联系方式" />
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
import { listMaterialCategory, getMaterialCategory, delMaterialCategory, addMaterialCategory, updateMaterialCategory } from "@/api/foundation/materialCategory";

export default {
  name: "MaterialCategory",
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
      // 耗材分类维护表格数据
      materialCategoryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialCategoryCode: null,
        materialCategoryName: null,
        materialCategoryAddress: null,
        materialCategoryContact: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        materialCategoryCode: [
          { required: true, message: "耗材分类编码不能为空", trigger: "blur" }
        ],
        materialCategoryName: [
          { required: true, message: "耗材分类名称不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询耗材分类维护列表 */
    getList() {
      this.loading = true;
      listMaterialCategory(this.queryParams).then(response => {
        this.materialCategoryList = response.rows;
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
        materialCategoryId: null,
        materialCategoryCode: null,
        materialCategoryName: null,
        materialCategoryAddress: null,
        materialCategoryContact: null,
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
      this.ids = selection.map(item => item.materialCategoryId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加耗材分类维护";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const materialCategoryId = row.materialCategoryId || this.ids
      getMaterialCategory(materialCategoryId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改耗材分类维护";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.materialCategoryId != null) {
            updateMaterialCategory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addMaterialCategory(this.form).then(response => {
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
      const materialCategoryIds = row.materialCategoryId || this.ids;
      this.$modal.confirm('是否确认删除耗材分类维护编号为"' + materialCategoryIds + '"的数据项？').then(function() {
        return delMaterialCategory(materialCategoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/materialCategory/export', {
        ...this.queryParams
      }, `materialCategory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
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
  min-width: 600px;
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
