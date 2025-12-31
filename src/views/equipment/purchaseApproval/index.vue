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
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>
    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
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

    <el-table v-loading="loading" :data="purchaseApprovalList" :row-class-name="tableRowClassName" @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
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
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
          >查看</el-button>
          <el-button
            v-if="scope.row.status === '0'"
            size="small"
            type="text"
            icon="el-icon-check"
            @click="handleApprove(scope.row)"
          >审批</el-button>
          <el-button
            v-if="scope.row.status === '0'"
            size="small"
            type="text"
            icon="el-icon-close"
            @click="handleReject(scope.row)"
          >拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination v-show="total>0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 查看详情对话框 -->
    <el-dialog title="查看详情" :visible.sync="viewOpen" width="800px" append-to-body>
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

    <!-- 审批对话框 -->
    <el-dialog title="审批采购申请" :visible.sync="approveOpen" width="500px" append-to-body>
      <el-form :model="approveForm" :rules="approveRules" ref="approveForm" label-width="100px">
        <el-form-item label="审批意见" prop="reviewOpinion">
          <el-input
            type="textarea"
            :rows="4"
            v-model="approveForm.reviewOpinion"
            placeholder="请输入审批意见"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="approveOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitApprove">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog title="拒绝采购申请" :visible.sync="rejectOpen" width="500px" append-to-body>
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectForm" label-width="100px">
        <el-form-item label="拒绝原因" prop="reviewOpinion">
          <el-input
            type="textarea"
            :rows="4"
            v-model="rejectForm.reviewOpinion"
            placeholder="请输入拒绝原因"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rejectOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitReject">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPurchaseApproval, getPurchaseApproval, approvePurchaseApproval, rejectPurchaseApproval, exportPurchaseApproval } from "@/api/equipment/purchaseApproval";

export default {
  name: "PurchaseApproval",
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
      // 采购审批表格数据
      purchaseApprovalList: [],
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
      // 查看对话框
      viewOpen: false,
      // 审批对话框
      approveOpen: false,
      approveForm: {
        id: null,
        reviewOpinion: ''
      },
      approveRules: {
        reviewOpinion: [
          { required: true, message: "审批意见不能为空", trigger: "blur" }
        ]
      },
      // 拒绝对话框
      rejectOpen: false,
      rejectForm: {
        id: null,
        reviewOpinion: ''
      },
      rejectRules: {
        reviewOpinion: [
          { required: true, message: "拒绝原因不能为空", trigger: "blur" }
        ]
      }
    };
  },
  filters: {
    formatCurrency(value) {
      if (!value) return '¥0.00';
      return '¥' + parseFloat(value).toFixed(2);
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询采购审批列表 */
    getList() {
      this.loading = true;
      listPurchaseApproval(this.queryParams).then(response => {
        this.purchaseApprovalList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },
    /** 查看按钮操作 */
    handleView(row) {
      const id = row.id;
      getPurchaseApproval(id).then(response => {
        this.form = response.data;
        this.viewOpen = true;
      });
    },
    /** 审批按钮操作 */
    handleApprove(row) {
      this.approveForm.id = row.id;
      this.approveForm.reviewOpinion = '';
      this.approveOpen = true;
      this.$nextTick(() => {
        if (this.$refs.approveForm) {
          this.$refs.approveForm.clearValidate();
        }
      });
    },
    /** 提交审批 */
    submitApprove() {
      this.$refs["approveForm"].validate(valid => {
        if (valid) {
          approvePurchaseApproval(this.approveForm).then(response => {
            this.$modal.msgSuccess("审批成功");
            this.approveOpen = false;
            this.getList();
          });
        }
      });
    },
    /** 拒绝按钮操作 */
    handleReject(row) {
      this.rejectForm.id = row.id;
      this.rejectForm.reviewOpinion = '';
      this.rejectOpen = true;
      this.$nextTick(() => {
        if (this.$refs.rejectForm) {
          this.$refs.rejectForm.clearValidate();
        }
      });
    },
    /** 提交拒绝 */
    submitReject() {
      this.$refs["rejectForm"].validate(valid => {
        if (valid) {
          rejectPurchaseApproval(this.rejectForm).then(response => {
            this.$modal.msgSuccess("拒绝成功");
            this.rejectOpen = false;
            this.getList();
          });
        }
      });
    },
    tableRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      return '';
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/purchaseApproval/export', {
        ...this.queryParams
      }, `purchaseApproval_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped lang="scss">
.app-container > .el-form .el-row {
  margin-bottom: 8px;
}

.app-container > .el-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container > .el-form .el-form-item {
  margin-bottom: 0;
}

/* 第一行查询条件左对齐紧凑布局 */
.app-container > .el-form .query-row-first .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container > .el-form .query-row-first .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container > .el-form .query-row-first .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.app-container > .el-form .query-row-first .query-item-inline .el-input {
  width: 180px;
}

.app-container > .el-form .query-row-first .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-first .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container > .el-form .query-row-first .query-item-inline .el-select {
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
</style>

