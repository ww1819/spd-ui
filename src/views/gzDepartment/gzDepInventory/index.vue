<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabClick">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
    </el-tabs>

    <div class="query-container">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="耗材" prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectMaterial v-model="queryParams.materialId" />
                </div>
              </el-form-item>
              <el-form-item label="科室" prop="departmentId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectDepartment v-model="queryParams.departmentId" />
                </div>
              </el-form-item>
              <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectSupplier v-model="queryParams.supplierId" />
                </div>
              </el-form-item>
              <el-form-item label="批次号" prop="batchNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.batchNo"
                  placeholder="请输入批次号"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="批号" prop="materialNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.materialNo"
                  placeholder="请输入批号"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="生产日期" prop="materialDate" class="query-item-inline">
                <el-date-picker
                  v-model="queryParams.materialDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="请选择生产日期"
                  clearable
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="入库日期" prop="warehouseDate" class="query-item-inline">
                <el-date-picker
                  v-model="queryParams.warehouseDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="请选择入库日期"
                  clearable
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="零库存显示" class="query-item-inline">
                <el-switch
                  v-model="queryParams.showZeroStock"
                  active-text="显示"
                  inactive-text="隐藏"
                  active-color="#13ce66"
                  inactive-color="#ff4949"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 0px; margin-top: -8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['gzDepartment:gzDepInventory:export']"
        >导出</el-button>
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </div>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
    </el-row>

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
import RightToolbar from "@/components/RightToolbar";
import GzDepInventoryDetail from "./components/GzDepInventoryDetail.vue";
import GzDepInventorySummary from "./components/GzDepInventorySummary.vue";

export default {
  name: "GzDepInventory",
  components: {
    SelectMaterial,
    SelectDepartment,
    SelectSupplier,
    RightToolbar,
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
        warehouseDate: null,
        showZeroStock: false // 是否显示零库存，默认false（不显示）
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
      this.handleQuery();
    },
    /** 标签页切换 */
    handleTabClick(tab) {
      // 切换标签页时重置查询参数
      this.resetQuery();
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

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

/* 标签页样式优化 */
::v-deep .el-tabs {
  margin-bottom: 16px;
  
  .el-tabs__header {
    margin: 0 0 16px 0;
  }
  
  .el-tabs__item {
    padding: 0 20px;
    height: 40px;
    line-height: 40px;
    font-size: 14px;
  }
  
  .el-tabs__item.is-active {
    color: #409EFF;
    font-weight: 500;
  }
}

/* 查询条件样式 */
.query-row-left {
  margin-bottom: 8px;
}

.query-row-left:first-child {
  margin-top: 4px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0px;
  margin-top: 0px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 10px;
  position: relative;
}

.query-row-second .el-form-item {
  white-space: nowrap;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 查询容器样式 */
.query-container {
  margin-top: -20px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 6px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
}

/* 表格容器样式 */
::v-deep .table-container {
  margin-top: -8px;
  overflow: visible;
  width: 100%;
  position: relative;
}

/* 按钮行布局优化 */
.mb8 {
  width: 100%;
}

.mb8 > div:first-child {
  flex: 0 0 auto;
}

.mb8 .top-right-btn {
  flex: 0 0 auto;
  margin-left: auto;
}
</style>
