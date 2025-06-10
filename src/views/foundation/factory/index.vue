<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="厂家编码" prop="factoryCode">
            <el-input
              v-model="queryParams.factoryCode"
              placeholder="请输入厂家编码"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="厂家名称" prop="factoryName">
            <el-input
              v-model="queryParams.factoryName"
              placeholder="请输入厂家名称"
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
          v-hasPermi="['foundation:factory:add']"
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
          v-hasPermi="['foundation:factory:edit']"
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
          v-hasPermi="['foundation:factory:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['foundation:factory:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="factoryList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="factoryId" width="50"/>
      <el-table-column label="厂家编码" align="center" prop="factoryCode" width="120"/>
      <el-table-column label="厂家名称" align="center" prop="factoryName" width="180"/>
      <el-table-column label="厂家地址" align="center" prop="factoryAddress" width="200"/>
      <el-table-column label="厂家联系方式" align="center" prop="factoryContact" width="120"/>
      <el-table-column label="状态" align="center" prop="factoryStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_use_status" :value="scope.row.factoryStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="创建日期" align="center" prop="createTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:factory:edit']"
          >修改</el-button>
          <el-button
            size="mini"
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

    <!-- 添加或修改厂家维护对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
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

          <el-row :gutter="20">
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
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
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
  },
  methods: {
    /** 查询厂家维护列表 */
    getList() {
      this.loading = true;
      listFactory(this.queryParams).then(response => {
        this.factoryList = response.rows;
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
            });
          } else {
            addFactory(this.form).then(response => {
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
      const factoryIds = row.factoryId || this.ids;
      this.$modal.confirm('是否确认删除厂家维护编号为"' + factoryIds + '"的数据项？').then(function() {
        return delFactory(factoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
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
