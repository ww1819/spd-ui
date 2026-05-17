<template>
  <div class="app-container out-warehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="使用追溯明细表" name="detail"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(执行科室)" name="execDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(申请科室)" name="applyDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(供应商)" name="supplier"></el-tab-pane>
      <el-tab-pane label="高值耗材使用情况报表" name="usageReport"></el-tab-pane>
    </el-tabs>

    <div class="app-container first-inventory-page">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item prop="traceNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.traceNo"
                  placeholder="追溯单号"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item prop="qty" class="query-item-inline">
                <el-input
                  v-model="queryParams.qty"
                  placeholder="库存数量"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper query-input-material-name">
                  <MaterialAutocomplete v-model="queryParams.materialName" />
                </div>
              </el-form-item>
              <el-form-item prop="warehouseId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" />
                </div>
              </el-form-item>
              <el-form-item prop="warehouseDate" class="query-item-inline">
                <el-date-picker
                  v-model="queryParams.warehouseDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="入库日期"
                  clearable
                  style="width: 150px"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16" class="query-row-second">
            <el-col :span="24" class="query-row-second-inner">
              <el-form-item prop="unitPrice" class="query-item-inline">
                <el-input
                  v-model="queryParams.unitPrice"
                  placeholder="单价"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item prop="batchNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.batchNo"
                  placeholder="批次号"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item prop="materialNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.materialNo"
                  placeholder="批号"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item prop="materialDate" class="query-item-inline">
                <el-date-picker
                  v-model="queryParams.materialDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="耗材日期"
                  clearable
                  style="width: 150px"
                />
              </el-form-item>
              <el-form-item prop="orderStatus" class="query-item-inline">
                <el-select
                  v-model="queryParams.orderStatus"
                  placeholder="状态"
                  clearable
                  style="width: 150px"
                >
                  <el-option label="已审核" :value="2" />
                  <el-option label="未审核" :value="1" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <el-row :gutter="10" class="mb8 button-row-inventory button-row-inventory-flex">
        <div class="button-row-left">
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
        <div class="button-row-right">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
        </div>
      </el-row>

      <UseTraceDetail
        v-show="activeName === 'detail'"
        ref="detailTable"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <UseTraceSummaryExecDept
        v-show="activeName === 'execDept'"
        ref="execDeptTable"
        :query-params="queryParams"
      />
      <UseTraceSummaryApplyDept
        v-show="activeName === 'applyDept'"
        ref="applyDeptTable"
        :query-params="queryParams"
      />
      <UseTraceSummarySupplier
        v-show="activeName === 'supplier'"
        ref="supplierTable"
        :query-params="queryParams"
      />
      <UseTraceMaterialUsageReport
        v-show="activeName === 'usageReport'"
        ref="usageReportTable"
        :query-params="queryParams"
      />
    </div>
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
import UseTraceMaterialUsageReport from "./components/UseTraceMaterialUsageReport.vue";

export default {
  name: "RetrospectInventory",
  components: {
    SelectWarehouse,
    MaterialAutocomplete,
    RightToolbar,
    UseTraceDetail,
    UseTraceSummaryExecDept,
    UseTraceSummaryApplyDept,
    UseTraceSummarySupplier,
    UseTraceMaterialUsageReport
  },
  data() {
    return {
      activeName: 'detail',
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
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
        orderStatus: 2
      }
    };
  },
  activated() {
    document.body.classList.add('inventory-query-fixed');
  },
  deactivated() {
    document.body.classList.remove('inventory-query-fixed');
  },
  mounted() {
    document.body.classList.add('inventory-query-fixed');
  },
  beforeDestroy() {
    document.body.classList.remove('inventory-query-fixed');
  },
  methods: {
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.refreshActiveTable();
    },
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
      this.queryParams.orderStatus = 2;
      this.queryParams.pageNum = 1;
      this.handleQuery();
    },
    handleTabClick(tab) {
      this.$nextTick(() => {
        const refMap = {
          detail: 'detailTable',
          execDept: 'execDeptTable',
          applyDept: 'applyDeptTable',
          supplier: 'supplierTable',
          usageReport: 'usageReportTable'
        };
        const refName = refMap[tab.name];
        const ref = refName && this.$refs[refName];
        if (ref && typeof ref.getList === 'function') {
          ref.getList();
        }
      });
    },
    refreshActiveTable() {
      const refMap = {
        detail: 'detailTable',
        execDept: 'execDeptTable',
        applyDept: 'applyDeptTable',
        supplier: 'supplierTable',
        usageReport: 'usageReportTable'
      };
      const refName = refMap[this.activeName];
      const ref = refName && this.$refs[refName];
      if (ref && typeof ref.getList === 'function') {
        ref.getList();
      }
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleExport() {
      if (this.activeName === 'usageReport') {
        this.download('gz/traceability/usageReport/export', this.buildUsageReportQuery(), `高值耗材使用情况报表_${new Date().getTime()}.xlsx`);
        return;
      }
      this.download('gz/retrospect/export', {
        ...this.queryParams
      }, `retrospect_${new Date().getTime()}.xlsx`);
    },
    buildUsageReportQuery() {
      return {
        materialId: this.queryParams.materialId,
        materialName: this.queryParams.materialName,
        supplierId: this.queryParams.supplierId,
        batchNo: this.queryParams.batchNo,
        materialNo: this.queryParams.materialNo,
        beginDate: this.queryParams.materialDate,
        endDate: this.queryParams.warehouseDate
      };
    }
  }
};
</script>

<style>
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}

.app-container.first-inventory-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.out-warehouse-query-page .first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}

.out-warehouse-query-page .first-inventory-page .table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  min-width: 0;
  position: relative;
}

.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 16px;
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 10px;
  transition: height 0.2s ease;
}
.out-warehouse-query-page .first-inventory-page .table-container:hover ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 14px;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 3px;
  margin: 0 2px;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 3px;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}
.out-warehouse-query-page .first-inventory-page .table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}
</style>

<style scoped>
.app-container.out-warehouse-query-page {
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  height: calc(100vh - 92px) !important;
  overflow-y: hidden !important;
  overflow-x: hidden !important;
}
.inventory-tabs-compact {
  margin-top: 0;
}

.app-container.first-inventory-page {
  margin-top: -10px;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.query-row-left {
  margin-bottom: 2px;
}
.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
}
.query-item-inline .el-form-item__label {
  width: 80px !important;
}
.query-item-inline .el-form-item {
  margin-bottom: 0;
}
.query-select-wrapper {
  width: 180px;
}
.query-input-material-name {
  width: 170px;
}
.query-row-second {
  margin-bottom: 2px;
}
.query-row-second-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  gap: 4px;
  padding-bottom: 2px;
}
.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 8px;
  white-space: nowrap;
}
.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.form-fields-container {
  background: #fff;
  padding: 6px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
  border: 1px solid #EBEEF5;
}

.button-row-inventory {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
}
.button-row-inventory-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.button-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.button-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
</style>
