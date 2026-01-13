<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabClick">
      <el-tab-pane label="使用追溯明细表" name="detail"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(执行科室)" name="execDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(申请科室)" name="applyDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(供应商)" name="supplier"></el-tab-pane>
    </el-tabs>

    <div class="query-container">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="追溯单号" prop="traceNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.traceNo"
                  placeholder="请输入追溯单号"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="库存数量" prop="qty" class="query-item-inline">
                <el-input
                  v-model="queryParams.qty"
                  placeholder="请输入库存数量"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="耗材" prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <MaterialAutocomplete v-model="queryParams.materialName"/>
                </div>
              </el-form-item>
              <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" />
                </div>
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
            </el-col>
          </el-row>
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="单价" prop="unitPrice" class="query-item-inline">
                <el-input
                  v-model="queryParams.unitPrice"
                  placeholder="请输入单价"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 180px"
                />
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
              <el-form-item label="耗材日期" prop="materialDate" class="query-item-inline">
                <el-date-picker
                  v-model="queryParams.materialDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="请选择耗材日期"
                  clearable
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="状态" prop="orderStatus" class="query-item-inline">
                <el-select
                  v-model="queryParams.orderStatus"
                  placeholder="请选择状态"
                  clearable
                  style="width: 180px"
                >
                  <el-option label="已审核" :value="2" />
                  <el-option label="未审核" :value="1" />
                </el-select>
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
          v-hasPermi="['gz:retrospect:export']"
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

    <UseTraceDetail 
      v-if="activeName === 'detail'" 
      :query-params="queryParams"
      @selection-change="handleSelectionChange"
    />
    <UseTraceSummaryExecDept 
      v-if="activeName === 'execDept'" 
      :query-params="queryParams"
    />
    <UseTraceSummaryApplyDept 
      v-if="activeName === 'applyDept'" 
      :query-params="queryParams"
    />
    <UseTraceSummarySupplier 
      v-if="activeName === 'supplier'" 
      :query-params="queryParams"
    />

  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import UseTraceDetail from "./components/UseTraceDetail.vue";
import UseTraceSummaryExecDept from "./components/UseTraceSummaryExecDept.vue";
import UseTraceSummaryApplyDept from "./components/UseTraceSummaryApplyDept.vue";
import UseTraceSummarySupplier from "./components/UseTraceSummarySupplier.vue";

export default {
  name: "RetrospectInventory",
  components: {
    SelectWarehouse,
    MaterialAutocomplete,
    RightToolbar,
    UseTraceDetail,
    UseTraceSummaryExecDept,
    UseTraceSummaryApplyDept,
    UseTraceSummarySupplier
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
        traceNo: null,
        qty: null,
        materialId: null,
        warehouseId: null,
        warehouseName: null,
        materialName: null,
        unitPrice: null,
        amt: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null,
        supplierId: null,
        orderStatus: 2 // 默认查询已审核的
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
      this.queryParams.traceNo = null;
      this.queryParams.warehouseName = null;
      this.queryParams.materialName = null;
      this.queryParams.qty = null;
      this.queryParams.unitPrice = null;
      this.queryParams.batchNo = null;
      this.queryParams.materialNo = null;
      this.queryParams.materialDate = null;
      this.queryParams.warehouseDate = null;
      this.queryParams.orderStatus = 2; // 重置为默认值：已审核
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
      this.download('gz/retrospect/export', {
        ...this.queryParams
      }, `retrospect_${new Date().getTime()}.xlsx`)
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
