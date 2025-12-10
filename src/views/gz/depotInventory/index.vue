<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
    </el-tabs>

    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId"/>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="供应商" prop="supplierId" label-width="100px">
            <SelectSupplier v-model="queryParams.supplierId"/>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="入库单号" prop="orderNo" label-width="100px">
            <el-input
              v-model="queryParams.orderNo"
              placeholder="请输入入库单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="耗材" prop="materialId" label-width="100px">
            <MaterialAutocomplete v-model="queryParams.materialName"/>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="院内码" prop="inHospitalCode" label-width="100px">
            <el-input
              v-model="queryParams.inHospitalCode"
              placeholder="请输入院内码"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="入库日期" prop="warehouseDate" label-width="100px" style="display: flex; align-items: center;">
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
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <DepotInventoryDetail 
      v-if="activeName === 'detail'" 
      :query-params="queryParams"
      @selection-change="handleSelectionChange"
    />
    <DepotInventorySummary 
      v-if="activeName === 'summary'" 
      :query-params="queryParams"
    />

  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import DepotInventoryDetail from "./components/DepotInventoryDetail.vue";
import DepotInventorySummary from "./components/DepotInventorySummary.vue";

export default {
  name: "DepotInventory",
  components: {
    SelectWarehouse,
    MaterialAutocomplete,
    SelectSupplier,
    DepotInventoryDetail,
    DepotInventorySummary
  },
  data() {
    return {
      activeName: 'detail',
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        warehouseId: null,
        warehouseName: null,
        materialName: null,
        supplierId: null,
        orderNo: null,
        inHospitalCode: null,
        beginDate: null,
        endDate: null
      }
    };
  },
  methods: {
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.warehouseName = null;
      this.queryParams.materialName = null;
      this.queryParams.orderNo = null;
      this.queryParams.inHospitalCode = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.pageNum = 1;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('gz/depotInventory/export', {
        ...this.queryParams
      }, `depotInventory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
