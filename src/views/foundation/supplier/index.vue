<template>
  <div class="app-container supplier-container">
    <el-row :gutter="20">
      <!-- 左侧供应商列表 -->
      <el-col :span="6">
        <el-card class="supplier-card">
          <div slot="header" class="supplier-header">
            <span>供应商</span>
          </div>
          <div class="supplier-list">
            <div
              v-for="supplier in allSupplierList"
              :key="supplier.id"
              :class="['supplier-item', { 'active': selectedSupplierId === supplier.id }]"
              @click="handleSupplierClick(supplier)">
              {{ supplier.name }}
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
            <el-form-item label="供应商编码" prop="code" label-width="100px">
              <el-input
                v-model="queryParams.code"
                placeholder="请输入供应商编码"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
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
          type="primary"
          plain
          icon="el-icon-refresh"
          size="small"
          :disabled="multiple"
          @click="handleUpdateReferred"
          v-hasPermi="['foundation:supplier:updateReferred']"
        >更新简码</el-button>
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

    <el-table v-loading="loading" :data="supplierList" :row-class-name="supplierIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip />
      <el-table-column label="供应商编码" align="center" prop="code" width="150" show-overflow-tooltip />
      <el-table-column label="供应商名称" align="center" prop="name" min-width="200" show-overflow-tooltip />
      <el-table-column label="公司简称" align="center" prop="companyReferred" width="150" show-overflow-tooltip />
      <el-table-column label="法人" align="center" prop="legalPerson" width="120" show-overflow-tooltip />
      <el-table-column label="联系人" align="center" prop="contacts" width="120" show-overflow-tooltip />
      <el-table-column label="地址" align="center" prop="address" min-width="200" show-overflow-tooltip />
      <el-table-column label="联系电话" align="center" prop="contactsPhone" width="150" show-overflow-tooltip />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right">
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
      </el-col>
    </el-row>

    <!-- 添加或修改供应商对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>{{ title }}</span>
          <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
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

          <!-- 供应商类型容器 -->
          <el-row>
            <el-col :span="24">
              <div class="supplier-type-container">
                <el-form-item label="供应商类型：" prop="supplierType" label-width="100px">
                  <div class="supplier-type-buttons">
                    <span 
                      v-for="type in supplierTypeOptions" 
                      :key="type.value"
                      :class="['supplier-type-btn', { 'active': form.supplierTypeList && form.supplierTypeList.includes(type.value) }]"
                      @click="toggleSupplierType(type.value)">
                      {{ type.label }}
                    </span>
                  </div>
                </el-form-item>
              </div>
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
import { listSupplier, getSupplier, delSupplier, addSupplier, updateSupplier, updateSupplierReferred } from "@/api/foundation/supplier";
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
      // 所有供应商列表（用于下拉框）
      allSupplierList: [],
      // 选中的供应商ID
      selectedSupplierId: null,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 供应商类型选项
      supplierTypeOptions: [
        { label: '耗材', value: '耗材' },
        { label: '设备', value: '设备' },
        { label: '配件', value: '配件' }
      ],
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
    this.getAllSupplierList();
  },
  methods: {
    /** 获取所有供应商列表（用于下拉框） */
    getAllSupplierList() {
      listSupplier({ pageNum: 1, pageSize: 10000 }).then(response => {
        this.allSupplierList = response.rows || [];
      });
    },
    /** 查询供应商列表 */
    getList() {
      this.loading = true;
      listSupplier(this.queryParams).then(response => {
        this.supplierList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 供应商列表项点击 */
    handleSupplierClick(supplier) {
      if (this.selectedSupplierId === supplier.id) {
        // 如果点击的是已选中的项，则取消选择
        this.selectedSupplierId = null;
        this.queryParams.name = null;
      } else {
        // 选中新的供应商
        this.selectedSupplierId = supplier.id;
        this.queryParams.name = supplier.name;
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
        supplierType: null,
        supplierTypeList: [],
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.resetForm("form");
    },
    /** 切换供应商类型 */
    toggleSupplierType(type) {
      if (!this.form.supplierTypeList) {
        this.$set(this.form, 'supplierTypeList', []);
      }
      const index = this.form.supplierTypeList.indexOf(type);
      if (index > -1) {
        // 如果已选中，则取消选择
        this.form.supplierTypeList.splice(index, 1);
      } else {
        // 如果未选中，则添加
        this.form.supplierTypeList.push(type);
      }
      // 同步更新 supplierType 字段（用于向后兼容，用逗号分隔）
      this.$set(this.form, 'supplierType', this.form.supplierTypeList.join(','));
      console.log('切换供应商类型后 - supplierTypeList:', this.form.supplierTypeList);
      console.log('切换供应商类型后 - supplierType:', this.form.supplierType);
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
      // 默认选中"耗材"
      this.form.supplierTypeList = ['耗材'];
      this.form.supplierType = '耗材';
      this.open = true;
      this.isDisabled = false;
      this.title = "添加供应商";
      this.form.supplierStatus = '2';
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      const id = row.id || this.ids
      getSupplier(id).then(response => {
        // 先重置表单
        this.reset();
        // 根据 request.js，响应拦截器返回的是 res.data，所以 response 本身就是后端返回的数据对象
        // 尝试多种可能的返回数据路径
        const responseData = response.data || response;
        const backendSupplierType = responseData?.supplierType || response?.supplierType;
        // 然后设置从后端获取的数据
        this.form = { ...this.form, ...responseData };
        // 将后端返回的 supplierType 字符串转换为数组
        // 注意：需要在设置 form 之后处理，因为 responseData 可能会覆盖 supplierTypeList
        if (backendSupplierType && typeof backendSupplierType === 'string' && backendSupplierType.trim()) {
          // 按逗号分割，过滤空值，并去除空格
          const typeList = backendSupplierType.split(',').map(item => item.trim()).filter(item => item);
          this.$set(this.form, 'supplierTypeList', typeList);
          this.$set(this.form, 'supplierType', backendSupplierType);
        } else if (backendSupplierType && Array.isArray(backendSupplierType)) {
          this.$set(this.form, 'supplierTypeList', backendSupplierType.filter(item => item));
          this.$set(this.form, 'supplierType', backendSupplierType.join(','));
        } else {
          // 如果后端没有返回supplierType，检查form中是否有（可能后端保存了但没有返回）
          if (this.form.supplierType && typeof this.form.supplierType === 'string' && this.form.supplierType.trim()) {
            const typeList = this.form.supplierType.split(',').map(item => item.trim()).filter(item => item);
            this.$set(this.form, 'supplierTypeList', typeList);
          } else {
            this.$set(this.form, 'supplierTypeList', []);
            this.$set(this.form, 'supplierType', '');
          }
        }
        console.log('后端返回的完整response:', response);
        console.log('后端返回的responseData:', responseData);
        console.log('后端返回的supplierType:', backendSupplierType);
        console.log('form中的supplierType:', this.form.supplierType);
        console.log('转换后的supplierTypeList:', this.form.supplierTypeList);
        this.open = true;
        this.isDisabled = true;
        this.title = "修改供应商";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 确保 supplierTypeList 存在
          if (!this.form.supplierTypeList || !Array.isArray(this.form.supplierTypeList)) {
            this.$set(this.form, 'supplierTypeList', []);
          }
          // 将数组转换为逗号分隔的字符串
          const supplierTypeStr = this.form.supplierTypeList.join(',');
          this.$set(this.form, 'supplierType', supplierTypeStr);
          // 准备提交数据，确保 supplierType 字段存在且不为空
          const submitData = { 
            ...this.form,
            supplierType: supplierTypeStr || ''
          };
          // 确保 supplierType 字段被正确提交
          console.log('提交前的 supplierTypeList:', this.form.supplierTypeList);
          console.log('提交前的 supplierType:', this.form.supplierType);
          console.log('提交的数据 supplierType:', submitData.supplierType);
          console.log('提交的完整数据:', JSON.stringify(submitData, null, 2));
          if (this.form.id != null) {
            updateSupplier(submitData).then(response => {
              console.log('更新成功，返回数据:', response);
              console.log('返回数据中的supplierType:', response.data?.supplierType || response.supplierType);
              this.$modal.msgSuccess("修改成功");
              this.getList();
              this.getAllSupplierList();
              // 保存成功后，如果返回的数据中没有supplierType，使用提交的数据
              // 因为后端可能不返回完整数据，我们需要确保本地数据保持正确
              if (!response.data?.supplierType && !response.supplierType && submitData.supplierType) {
                this.$set(this.form, 'supplierType', submitData.supplierType);
                if (submitData.supplierType) {
                  this.$set(this.form, 'supplierTypeList', submitData.supplierType.split(',').filter(item => item.trim()));
                }
              }
            }).catch(error => {
              console.error('更新失败:', error);
              this.$modal.msgError("修改失败：" + (error.msg || error.message || '未知错误'));
            });
          } else {
            addSupplier(submitData).then(response => {
              console.log('新增成功，返回数据:', response);
              console.log('返回数据中的supplierType:', response.data?.supplierType || response.supplierType);
              this.$modal.msgSuccess("新增成功");
              this.getList();
              this.getAllSupplierList();
              // 保存成功后，如果返回的数据中没有supplierType，使用提交的数据
              if (!response.data?.supplierType && !response.supplierType && submitData.supplierType) {
                this.$set(this.form, 'supplierType', submitData.supplierType);
                if (submitData.supplierType) {
                  this.$set(this.form, 'supplierTypeList', submitData.supplierType.split(',').filter(item => item.trim()));
                }
              }
            }).catch(error => {
              console.error('新增失败:', error);
              this.$modal.msgError("新增失败：" + (error.msg || error.message || '未知错误'));
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
        this.getAllSupplierList();
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
    },
    /** 更新名称简码 */
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的供应商");
        return;
      }
      this.$modal.confirm("是否为选中的供应商更新名称简码？").then(() => {
        return updateSupplierReferred(this.ids);
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

/* 供应商卡片样式 */
.supplier-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.supplier-card ::v-deep .el-card__header {
  padding: 18px 20px;
  border-bottom: 1px solid #EBEEF5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  flex-shrink: 0;
}

.supplier-card ::v-deep .el-card__body {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.supplier-header {
  font-weight: bold;
  font-size: 14px;
}

.supplier-list {
  height: 100%;
  overflow-y: auto;
  padding: 10px 0;
}

.supplier-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.supplier-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.supplier-item.active {
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

/* 确保供应商容器有相对定位，以便弹窗正确定位 */
.supplier-container {
  position: relative;
  min-height: calc(100vh - 84px);
  width: 100%;
  overflow: visible;
}

/* 供应商类型容器样式 */
.supplier-type-container {
  background: #fafafa;
  padding: 16px 20px;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  margin-top: 16px;
}

/* 供应商类型按钮组样式 */
.supplier-type-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.supplier-type-btn {
  display: inline-block;
  padding: 12px 20px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  user-select: none;
  height: 40px;
  line-height: 16px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.supplier-type-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.supplier-type-btn.active {
  background: #409EFF;
  border-color: #409EFF;
  color: #fff;
}

.supplier-type-btn.active:hover {
  background: #66b1ff;
  border-color: #66b1ff;
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
