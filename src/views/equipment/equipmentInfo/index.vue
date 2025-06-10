<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="设备名称" prop="equipmentName">
            <el-input
              v-model="queryParams.equipmentName"
              placeholder="请输入设备名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="设备编码" prop="equipmentCode">
            <el-input
              v-model="queryParams.equipmentCode"
              placeholder="请输入设备编码"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <div style="display: inline">
            <span>起</span>
            <el-date-picker clearable
                            v-model="queryParams.beginDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择起始日期"
                            style="width: 140px"
            >
            </el-date-picker>
            <span>止</span>
            <el-date-picker clearable
                            v-model="queryParams.endDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择截止日期"
                            style="width: 140px"
            >
            </el-date-picker>
          </div>
        </el-col>
        <el-col :span="6">
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option
                v-for="dict in dict.type.sys_normal_disable"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
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
          v-hasPermi="['equipment:info:add']"
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
          v-hasPermi="['equipment:info:edit']"
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
          v-hasPermi="['equipment:info:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:info:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="equipmentId" width="50"/>
      <el-table-column label="设备编码" align="center" prop="equipmentCode" width="100"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="180"/>
      <el-table-column label="规格" align="center" prop="equipmentSpec" width="120"/>
      <el-table-column label="型号" align="center" prop="equipmentModel" width="120"/>
      <el-table-column label="供应商" align="center" prop="equipmentSupplier" width="180"/>
      <el-table-column label="净值" align="center" prop="equipmentNetValue" width="100"/>
      <el-table-column label="单位" align="center" prop="equipmentUnit" width="80"/>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
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
            v-hasPermi="['equipment:info:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:info:remove']"
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

    <!-- 添加或修改设备信息对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="设备编码" prop="equipmentCode">
                <el-input v-model="form.equipmentCode" placeholder="请输入设备编码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="设备名称" prop="equipmentName">
                <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="规格" prop="equipmentSpec">
                <el-input v-model="form.equipmentSpec" placeholder="请输入规格" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="型号" prop="equipmentModel">
                <el-input v-model="form.equipmentModel" placeholder="请输入型号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="供应商" prop="equipmentSupplier">
                <el-input v-model="form.equipmentSupplier" placeholder="请输入供应商" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="净值" prop="equipmentNetValue">
                <el-input v-model="form.equipmentNetValue" placeholder="请输入净值" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="单位" prop="equipmentUnit">
                <el-input v-model="form.equipmentUnit" placeholder="请输入单位" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="状态" prop="status">
                <el-select v-model="form.status" placeholder="请选择状态">
                  <el-option
                    v-for="dict in dict.type.sys_normal_disable"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
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
import { listEquipment, getEquipment, delEquipment, addEquipment, updateEquipment } from "@/api/equipment/equipmentInfo";

export default {
  name: "EquipmentInfo",
  dicts: ['sys_normal_disable'],
  data() {
    return {
      // 遮罩层
      loading: false,
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
      // 设备信息表格数据
      equipmentList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        equipmentName: null,
        equipmentCode: null,
        status: null
      },
      // 表单参数
      form: {
        assetCode: '',
        hospitalCode: '',
        barcode: '',
        assetName: '',
        assetAlias: '',
        auxiliaryCategory: '',
        assetStatus: '',
        financialCategory: '',
        financialCode: '',
        brand: '',
        origin: '',
        country: '',
        specification: '',
        model: '',
        unit: '',
        archiveCode: '',
        serialNumber: '',
        assetManager: '',
        maintenanceManager: '',
        useDepartment: '',
        manageDepartment: '',
        storageLocation: '',
        assetType: '',
        factoryNumber: '',
        productionDate: '',
        registrationNumber: '',
        expectedOperationDate: '',
        fundSource: '',
        invoiceNumber: '',
        invoiceAmount: 0,
        attachedAssetFlag: '',
        emergencyAsset: '',
        specialAsset: '',
        measurementAsset: '',
        attachedMaterials: [],
        benefitAnalysis: '',
        remark: '',
        power: '',
        theoryOperationTime: 0,
        publicEquipment: '',
        creator: '',
        createTime: '',
        modifier: '',
        modifyTime: '',
        archiveUsage: '',
        contractConsistent: '',
        specialNetworkAsset: '',
        building: '',
        floor: '',
        quantity: 0,
        contractName: '',
        contractPrice: 0,
        signDate: '',
        purchaseDate: '',
        acceptanceDate: '',
        reviewTime: '',
        warrantyExpireDate: '',
        bidDate: '',
        supplyNoticeDate: '',
        firstAcceptanceDate: '',
        deliveryDeadline: '',
        secondAcceptanceDate: '',
        warrantyOutDate: '',
        supplier: '',
        supplierContact: '',
        supplierPhone: '',
        maintenanceCompany: '',
        maintenanceContact: '',
        maintenancePhone: '',
        manufacturer: '',
        purchaseMethod: '',
        biddingForm: '',
        singleBudget: 0,
        projectBasis: '',
        biddingNumber: '',
        biddingDate: '',
        biddingAmount: 0
      },
      // 表单校验
      rules: {
        assetName: [
          { required: true, message: "资产名称不能为空", trigger: "blur" }
        ],
        assetStatus: [
          { required: true, message: "资产状态不能为空", trigger: "change" }
        ],
        financialCategory: [
          { required: true, message: "财务分类不能为空", trigger: "change" }
        ],
        useDepartment: [
          { required: true, message: "使用科室不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备信息列表 */
    getList() {
      this.loading = true;
      // 模拟数据，实际项目中应该调用后端接口
      setTimeout(() => {
        this.equipmentList = [
          {
            equipmentId: 1,
            equipmentCode: 'SB001',
            equipmentName: '测试设备1',
            equipmentSpec: '规格1',
            equipmentSupplier: '供应商1',
            equipmentNetValue: 1000,
            equipmentUnit: '台'
          },
          {
            equipmentId: 2,
            equipmentCode: 'SB002',
            equipmentName: '测试设备2',
            equipmentSpec: '规格2',
            equipmentSupplier: '供应商2',
            equipmentNetValue: 2000,
            equipmentUnit: '台'
          }
        ];
        this.total = 2;
        this.loading = false;
      }, 500);
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        assetCode: '',
        hospitalCode: '',
        barcode: '',
        assetName: '',
        assetAlias: '',
        auxiliaryCategory: '',
        assetStatus: '',
        financialCategory: '',
        financialCode: '',
        brand: '',
        origin: '',
        country: '',
        specification: '',
        model: '',
        unit: '',
        archiveCode: '',
        serialNumber: '',
        assetManager: '',
        maintenanceManager: '',
        useDepartment: '',
        manageDepartment: '',
        storageLocation: '',
        assetType: '',
        factoryNumber: '',
        productionDate: '',
        registrationNumber: '',
        expectedOperationDate: '',
        fundSource: '',
        invoiceNumber: '',
        invoiceAmount: 0,
        attachedAssetFlag: '',
        emergencyAsset: '',
        specialAsset: '',
        measurementAsset: '',
        attachedMaterials: [],
        benefitAnalysis: '',
        remark: '',
        power: '',
        theoryOperationTime: 0,
        publicEquipment: '',
        creator: '',
        createTime: '',
        modifier: '',
        modifyTime: '',
        archiveUsage: '',
        contractConsistent: '',
        specialNetworkAsset: '',
        building: '',
        floor: '',
        quantity: 0,
        contractName: '',
        contractPrice: 0,
        signDate: '',
        purchaseDate: '',
        acceptanceDate: '',
        reviewTime: '',
        warrantyExpireDate: '',
        bidDate: '',
        supplyNoticeDate: '',
        firstAcceptanceDate: '',
        deliveryDeadline: '',
        secondAcceptanceDate: '',
        warrantyOutDate: '',
        supplier: '',
        supplierContact: '',
        supplierPhone: '',
        maintenanceCompany: '',
        maintenanceContact: '',
        maintenancePhone: '',
        manufacturer: '',
        purchaseMethod: '',
        biddingForm: '',
        singleBudget: 0,
        projectBasis: '',
        biddingNumber: '',
        biddingDate: '',
        biddingAmount: 0
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
      this.ids = selection.map(item => item.equipmentId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备信息";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const equipmentId = row.equipmentId || this.ids
      // 模拟获取数据，实际项目中应该调用后端接口
      setTimeout(() => {
        this.form = {
          ...this.form,
          equipmentId: equipmentId,
          assetName: '测试设备' + equipmentId,
          assetStatus: '1',
          financialCategory: '1',
          useDepartment: '1'
        };
        this.open = true;
        this.title = "修改设备信息";
      }, 500);
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 模拟提交，实际项目中应该调用后端接口
          setTimeout(() => {
            this.$modal.msgSuccess(this.form.equipmentId ? "修改成功" : "新增成功");
            this.open = false;
            this.getList();
          }, 500);
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const equipmentIds = row.equipmentId || this.ids;
      this.$modal.confirm('是否确认删除设备信息编号为"' + equipmentIds + '"的数据项？').then(() => {
        // 模拟删除，实际项目中应该调用后端接口
        setTimeout(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        }, 500);
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.$modal.msgSuccess("导出成功");
    },
    /** 打印按钮操作 */
    handlePrint(row) {
      this.$modal.msgSuccess("打印成功");
    }
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.mb8 {
  margin-bottom: 8px;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.el-tabs {
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
}

.el-checkbox {
  margin-right: 20px;
  margin-bottom: 10px;
}

.local-modal-mask {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.local-modal-content {
  background: #fff;
  border-radius: 6px;
  min-width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
</style> 