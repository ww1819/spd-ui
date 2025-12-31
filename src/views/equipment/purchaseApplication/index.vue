<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-first">
        <el-col :span="24">
          <el-form-item label="申请单号" prop="applicationNo" class="query-item-inline">
            <el-input
              v-model="queryParams.applicationNo"
              placeholder="请输入申请单号"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 180px"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="制单日期" style="display: flex; align-items: center;">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 180px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
              style="width: 180px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" class="query-status-col">
          <el-form-item label="状态" prop="status" class="query-item-status-aligned">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 150px">
              <el-option label="待审核" value="0" />
              <el-option label="审核通过" value="1" />
              <el-option label="审核拒绝" value="2" />
              <el-option label="已采购" value="3" />
              <el-option label="已完成" value="4" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
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
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentPurchaseApplicationList"
              :row-class-name="tableRowClassName"
              @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="申请单号" align="center" prop="applicationNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.applicationNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="申请标题" align="center" prop="applicationTitle" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" show-overflow-tooltip resizable />
      <el-table-column label="采购数量" align="center" prop="quantity" show-overflow-tooltip resizable />
      <el-table-column label="总金额" align="center" prop="totalAmount" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="申请科室" align="center" prop="applicationDepartment" show-overflow-tooltip resizable />
      <el-table-column label="申请人" align="center" prop="applicant" show-overflow-tooltip resizable />
      <el-table-column label="状态" align="center" prop="status" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === '0'" type="warning">待审核</el-tag>
          <el-tag v-else-if="scope.row.status === '1'" type="success">审核通过</el-tag>
          <el-tag v-else-if="scope.row.status === '2'" type="danger">审核拒绝</el-tag>
          <el-tag v-else-if="scope.row.status === '3'" type="primary">已采购</el-tag>
          <el-tag v-else-if="scope.row.status === '4'" type="info">已完成</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" resizable>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
          >查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination v-show="total>0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改设备采购申请对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">
              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="申请单号" prop="applicationNo">
                    <el-input v-model="form.applicationNo" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="申请标题" prop="applicationTitle">
                    <el-input v-model="form.applicationTitle" placeholder="请输入申请标题" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="设备名称" prop="equipmentName">
                    <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="设备型号" prop="equipmentModel">
                    <el-input v-model="form.equipmentModel" placeholder="请输入设备型号" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="设备品牌" prop="equipmentBrand">
                    <el-input v-model="form.equipmentBrand" placeholder="请输入设备品牌" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="采购数量" prop="quantity">
                    <el-input-number v-model="form.quantity" :min="1" :max="999" controls-position="right" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="单价" prop="unitPrice">
                    <el-input-number v-model="form.unitPrice" :min="0" :precision="2" :step="0.1" controls-position="right" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="总金额" prop="totalAmount">
                    <el-input v-model="form.totalAmount" :disabled="true" placeholder="自动计算" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="申请科室" prop="applicationDepartment">
                    <el-input v-model="form.applicationDepartment" placeholder="请输入申请科室" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="申请人" prop="applicant">
                    <el-input v-model="form.applicant" placeholder="请输入申请人" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="8">
                <el-col :span="24">
                  <el-form-item label="申请理由" prop="applicationReason">
                    <el-input v-model="form.applicationReason" type="textarea" placeholder="请输入申请理由" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="8">
                <el-col :span="24">
                  <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
            <div class="modal-footer">
              <el-button @click="cancel">取 消</el-button>
              <el-button type="primary" @click="submitForm">确 定</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 查看设备采购申请对话框 -->
    <el-dialog title="查看设备采购申请" :visible.sync="viewOpen" width="60%" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="申请单号">{{ form.applicationNo }}</el-descriptions-item>
        <el-descriptions-item label="申请标题">{{ form.applicationTitle }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ form.equipmentName }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ form.equipmentModel }}</el-descriptions-item>
        <el-descriptions-item label="设备品牌">{{ form.equipmentBrand }}</el-descriptions-item>
        <el-descriptions-item label="采购数量">{{ form.quantity }}</el-descriptions-item>
        <el-descriptions-item label="单价">{{ form.unitPrice ? '¥' + form.unitPrice : '-' }}</el-descriptions-item>
        <el-descriptions-item label="总金额">{{ form.totalAmount ? '¥' + form.totalAmount : '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请科室">{{ form.applicationDepartment }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ form.applicant }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="form.status === '0'" type="warning">待审核</el-tag>
          <el-tag v-else-if="form.status === '1'" type="success">审核通过</el-tag>
          <el-tag v-else-if="form.status === '2'" type="danger">审核拒绝</el-tag>
          <el-tag v-else-if="form.status === '3'" type="primary">已采购</el-tag>
          <el-tag v-else-if="form.status === '4'" type="info">已完成</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-descriptions :column="1" border style="margin-top: 20px;">
        <el-descriptions-item label="申请理由">{{ form.applicationReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ form.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listEquipmentPurchaseApplication, getEquipmentPurchaseApplication, delEquipmentPurchaseApplication, addEquipmentPurchaseApplication, updateEquipmentPurchaseApplication } from "@/api/equipment/purchaseApplication";

export default {
  name: "EquipmentPurchaseApplication",
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
      // 设备采购申请表格数据
      equipmentPurchaseApplicationList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      viewOpen: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applicationNo: null,
        equipmentName: null,
        status: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        applicationTitle: [
          { required: true, message: "申请标题不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        quantity: [
          { required: true, message: "采购数量不能为空", trigger: "blur" }
        ],
        applicationDepartment: [
          { required: true, message: "申请科室不能为空", trigger: "blur" }
        ],
        applicant: [
          { required: true, message: "申请人不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  watch: {
    'form.quantity'(newVal) {
      this.calculateTotalAmount();
    },
    'form.unitPrice'(newVal) {
      this.calculateTotalAmount();
    }
  },
  methods: {
    /** 计算总金额 */
    calculateTotalAmount() {
      if (this.form.quantity && this.form.unitPrice) {
        this.form.totalAmount = (parseFloat(this.form.quantity) * parseFloat(this.form.unitPrice)).toFixed(2);
      } else {
        this.form.totalAmount = null;
      }
    },
    /** 查询设备采购申请列表 */
    getList() {
      this.loading = true;
      listEquipmentPurchaseApplication(this.queryParams).then(response => {
        this.equipmentPurchaseApplicationList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 表格行类名 */
    tableRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.$modal.msgInfo("导出功能开发中");
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
        applicationNo: null,
        applicationTitle: null,
        equipmentName: null,
        equipmentModel: null,
        equipmentBrand: null,
        quantity: 1,
        unitPrice: null,
        totalAmount: null,
        applicationDepartment: null,
        applicant: null,
        applicationReason: null,
        remark: null
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
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      // 生成申请单号
      const timestamp = Date.now();
      this.form.applicationNo = 'SQSB' + timestamp;
      this.open = true;
      this.title = "添加设备采购申请";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getEquipmentPurchaseApplication(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备采购申请";
      });
    },
    handleView(row) {
      this.reset();
      const id = row.id || this.ids
      getEquipmentPurchaseApplication(id).then(response => {
        this.form = response.data;
        this.viewOpen = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateEquipmentPurchaseApplication(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentPurchaseApplication(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除设备采购申请编号为"' + ids + '"的数据项？').then(function() {
        return delEquipmentPurchaseApplication(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  },
  filters: {
    formatCurrency(value) {
      if (!value) return '--';
      return '¥' + parseFloat(value).toFixed(2);
    }
  }
};
</script>

<style scoped lang="scss">
/* 第一行查询条件左对齐紧凑布局 */
.app-container > .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container > .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container > .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.app-container > .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container > .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 第二行日期范围布局 */
.app-container > .el-form .query-row-second {
  position: relative;
}

/* 确保日期的两个日期选择器在同一行 */
.app-container > .el-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container > .el-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container > .el-form .query-row-second .query-status-col {
  display: flex;
  align-items: flex-start;
}

.app-container > .el-form .query-row-second .query-item-status-aligned {
  margin-bottom: 0;
}

/* 弹窗样式 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  min-height: 48px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  margin-top: 10px;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 10px;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-input,
.local-modal-content .modal-form-compact .el-select,
.local-modal-content .modal-form-compact .el-date-picker {
  width: 100%;
}

/* 缩小所有输入框高度 */
.local-modal-content .modal-form-compact .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
}

.local-modal-content .modal-form-compact .el-input__icon {
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-select .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor.el-input {
  height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-form-item__content {
  margin-left: 0 !important;
  line-height: 28px;
}

.local-modal-content .modal-form-compact .el-form-item__label {
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

/* textarea 样式调整 */
.local-modal-content .modal-form-compact .el-textarea__inner {
  min-height: 60px !important;
}

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 确保页面容器有相对定位 */
.app-container {
  position: relative;
}
</style>