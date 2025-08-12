<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="申请单号" prop="applicationNo">
        <el-input v-model="queryParams.applicationNo" placeholder="请输入申请单号" clearable />
      </el-form-item>
      <el-form-item label="设备名称" prop="equipmentName">
        <el-input v-model="queryParams.equipmentName" placeholder="请输入设备名称" clearable />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="待审核" value="0" />
          <el-option label="审核通过" value="1" />
          <el-option label="审核拒绝" value="2" />
          <el-option label="已采购" value="3" />
          <el-option label="已完成" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" icon="el-icon-edit" :disabled="single" @click="handleUpdate">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" icon="el-icon-delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentPurchaseApplicationList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="申请单号" align="center" prop="applicationNo" />
      <el-table-column label="申请标题" align="center" prop="applicationTitle" />
      <el-table-column label="设备名称" align="center" prop="equipmentName" />
      <el-table-column label="采购数量" align="center" prop="quantity" />
      <el-table-column label="总金额" align="center" prop="totalAmount">
        <template slot-scope="scope">
          <span>{{ scope.row.totalAmount ? '¥' + scope.row.totalAmount : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申请部门" align="center" prop="applicationDepartment" />
      <el-table-column label="申请人" align="center" prop="applicant" />
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === '0'" type="warning">待审核</el-tag>
          <el-tag v-else-if="scope.row.status === '1'" type="success">审核通过</el-tag>
          <el-tag v-else-if="scope.row.status === '2'" type="danger">审核拒绝</el-tag>
          <el-tag v-else-if="scope.row.status === '3'" type="primary">已采购</el-tag>
          <el-tag v-else-if="scope.row.status === '4'" type="info">已完成</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination v-show="total>0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改设备采购申请对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="60%" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="申请标题" prop="applicationTitle">
              <el-input v-model="form.applicationTitle" placeholder="请输入申请标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="equipmentName">
              <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="设备型号" prop="equipmentModel">
              <el-input v-model="form.equipmentModel" placeholder="请输入设备型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备品牌" prop="equipmentBrand">
              <el-input v-model="form.equipmentBrand" placeholder="请输入设备品牌" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="采购数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="申请部门" prop="applicationDepartment">
              <el-input v-model="form.applicationDepartment" placeholder="请输入申请部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人" prop="applicant">
              <el-input v-model="form.applicant" placeholder="请输入申请人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="申请理由" prop="applicationReason">
          <el-input v-model="form.applicationReason" type="textarea" placeholder="请输入申请理由" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

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
        <el-descriptions-item label="申请部门">{{ form.applicationDepartment }}</el-descriptions-item>
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
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      equipmentPurchaseApplicationList: [],
      title: "",
      open: false,
      viewOpen: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applicationNo: null,
        equipmentName: null,
        status: null
      },
      form: {},
      rules: {
        applicationTitle: [{ required: true, message: "申请标题不能为空", trigger: "blur" }],
        equipmentName: [{ required: true, message: "设备名称不能为空", trigger: "blur" }],
        quantity: [{ required: true, message: "采购数量不能为空", trigger: "blur" }],
        applicationDepartment: [{ required: true, message: "申请部门不能为空", trigger: "blur" }],
        applicant: [{ required: true, message: "申请人不能为空", trigger: "blur" }]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listEquipmentPurchaseApplication(this.queryParams).then(response => {
        this.equipmentPurchaseApplicationList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: null,
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
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备采购申请";
    },
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
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除设备采购申请编号为"' + ids + '"的数据项？').then(function() {
        return delEquipmentPurchaseApplication(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script> 