<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
    </el-tabs>

    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="耗材" prop="materialId" label-width="100px">
            <SelectMaterial v-model="queryParams.materialId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="科室" prop="departmentId" label-width="100px">
            <SelectDepartment v-model="queryParams.departmentId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="供应商" prop="supplierId" label-width="100px">
            <SelectSupplier v-model="queryParams.supplierId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="批次号" prop="batchNo" label-width="100px">
            <el-input
              v-model="queryParams.batchNo"
              placeholder="请输入批次号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="批号" prop="materialNo" label-width="100px">
            <el-input
              v-model="queryParams.materialNo"
              placeholder="请输入批号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="生产日期" prop="materialDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.materialDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择生产日期">
            </el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="入库日期" prop="warehouseDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.warehouseDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择入库日期">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item >
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <GzDepInventoryDetail 
      v-if="activeName === 'detail'" 
      :query-params="queryParams"
      @selection-change="handleSelectionChange"
    />
    <GzDepInventorySummary 
      v-if="activeName === 'summary'" 
      :query-params="queryParams"
    />
  </div>
</template>

<script>
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import GzDepInventoryDetail from "./components/GzDepInventoryDetail.vue";
import GzDepInventorySummary from "./components/GzDepInventorySummary.vue";

export default {
  name: "GzDepInventory",
  components: {
    SelectMaterial,
    SelectDepartment,
    SelectSupplier,
    GzDepInventoryDetail,
    GzDepInventorySummary
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
        departmentId: null,
        supplierId: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null
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
      this.download('gzDepartment/gzDepInventory/export', {
        ...this.queryParams
      }, `gzDepInventory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
