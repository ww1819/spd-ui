<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="供应商编码" prop="code" label-width="100px">
            <el-input
              v-model="queryParams.code"
              placeholder="请输入供应商编码"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="供应商名称" prop="name" label-width="100px">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入供应商名称"
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
          v-hasPermi="['foundation:supplier:add']"
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
          v-hasPermi="['foundation:supplier:edit']"
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
          v-hasPermi="['foundation:supplier:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['foundation:supplier:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="supplierList" :row-class-name="supplierIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" />
      <el-table-column label="供应商编码" align="center" prop="code" />
      <el-table-column label="供应商名称" align="center" prop="name" />
      <el-table-column label="公司简称" align="center" prop="companyReferred" />
      <el-table-column label="法人" align="center" prop="legalPerson" />
      <el-table-column label="联系人" align="center" prop="contacts" />
      <el-table-column label="联系电话" align="center" prop="contactsPhone" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:supplier:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:supplier:remove']"
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

    <!-- 添加或修改供应商对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="供应商编码" prop="code">
                <el-input v-model="form.code" :disabled="isDisabled" placeholder="请输入供应商编码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入供应商名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="公司简称" prop="companyReferred">
                <el-input v-model="form.companyReferred" placeholder="请输入公司简称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="法人" prop="legalPerson">
                <el-input v-model="form.legalPerson" placeholder="请输入法人" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="证件号" prop="certNumber">
                <el-input v-model="form.certNumber" placeholder="请输入证件号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="地址" prop="address">
                <el-input v-model="form.address" placeholder="请输入地址" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="注册资金" prop="regMoney">
                <el-input v-model="form.regMoney" placeholder="请输入注册资金" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="银行账号" prop="bankAccount">
                <el-input v-model="form.bankAccount" placeholder="请输入银行账号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="联系人" prop="contacts">
                <el-input v-model="form.contacts" placeholder="请输入联系人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话" prop="contactsPhone">
                <el-input v-model="form.contactsPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="网址" prop="website">
                <el-input v-model="form.website" placeholder="请输入网址" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="邮编" prop="zipCode">
                <el-input v-model="form.zipCode" placeholder="请输入邮编" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="传真" prop="fax">
                <el-input v-model="form.fax" placeholder="请输入传真" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="公司负责人" prop="companyPerson">
                <el-input v-model="form.companyPerson" placeholder="请输入公司负责人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="税号" prop="taxNumber">
                <el-input v-model="form.taxNumber" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="电话" prop="phone">
                <el-input v-model="form.phone" placeholder="请输入电话" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="经营范围" prop="supplierRange">
                <el-input v-model="form.supplierRange" placeholder="请输入经营范围" />
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
import { listSupplier, getSupplier, delSupplier, addSupplier, updateSupplier } from "@/api/foundation/supplier";
import {pinyin} from "pinyin-pro";

export default {
  name: "Supplier",
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
      // 供应商表格数据
      supplierList: [],
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
          { required: true, message: "供应商编码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "供应商名称不能为空", trigger: "blur" }
        ],
        referredCode: [
          { required: true, message: "名称简码不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询供应商列表 */
    getList() {
      this.loading = true;
      listSupplier(this.queryParams).then(response => {
        this.supplierList = response.rows;
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
        id: null,
        code: null,
        name: null,
        delFlag: null,
        taxNumber: null,
        referredCode: null,
        regMoney: null,
        validTime: null,
        contacts: null,
        contactsPhone: null,
        website: null,
        legalPerson: null,
        zipCode: null,
        email: null,
        address: null,
        companyPerson: null,
        phone: null,
        certNumber: null,
        fax: null,
        bankAccount: null,
        companyReferred: null,
        supplierRange: null,
        supplierStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.resetForm("form");
    },
    supplierNameChange(val){
      const pinYinCode = pinyin(val, {
        pattern: 'first',
        toneType: 'none',
        type: 'array',
      }).join('').toUpperCase();

      this.form.referredCode = pinYinCode;
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
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.isDisabled = false;
      this.title = "添加供应商";
      this.form.supplierStatus = '2';
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getSupplier(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.isDisabled = true;
        this.title = "修改供应商";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateSupplier(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addSupplier(this.form).then(response => {
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
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除供应商编号为"' + ids + '"的数据项？').then(function() {
        return delSupplier(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    supplierIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/supplier/export', {
        ...this.queryParams
      }, `supplier_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
