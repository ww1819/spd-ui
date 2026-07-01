<template>
  <div class="app-container out-warehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="备货入/退货表" name="inbound"></el-tab-pane>
      <el-tab-pane label="备货出/退库表" name="outbound"></el-tab-pane>
      <el-tab-pane label="跟台表" name="follow"></el-tab-pane>
    </el-tabs>

    <div class="app-container first-inventory-page">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item prop="warehouseId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" placeholder="仓库" />
                </div>
              </el-form-item>
              <el-form-item prop="supplierId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectSupplier v-model="queryParams.supplierId" />
                </div>
              </el-form-item>
              <el-form-item prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectMaterial v-model="queryParams.materialId" />
                </div>
              </el-form-item>
              <el-form-item prop="inHospitalCode" class="query-item-inline">
                <el-input
                  v-model="queryParams.inHospitalCode"
                  placeholder="院内码"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16" class="query-row-second">
            <el-col :span="24" class="query-row-second-inner">
              <el-form-item prop="orderNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.orderNo"
                  :placeholder="activeName === 'outbound' ? '出库/退库单号' : '单号'"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item prop="departmentId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectDepartment v-model="queryParams.departmentId" fieldPlaceholder="科室" />
                </div>
              </el-form-item>
              <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
                <el-date-picker
                  v-model="queryParams.beginDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="起始日期"
                  clearable
                  class="query-date-start"
                />
                <span class="query-date-sep">至</span>
                <el-date-picker
                  v-model="queryParams.endDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="截止日期"
                  clearable
                  class="query-date-end"
                />
              </el-form-item>
              <el-form-item prop="orderStatus" class="query-item-inline">
                <el-select v-model="queryParams.orderStatus" placeholder="单据状态" clearable style="width: 150px">
                  <el-option
                    v-for="dict in dict.type.biz_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
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
            v-hasPermi="['gz:stockQuery:export']"
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

      <InboundRefundTable
        v-if="activeName === 'inbound'"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <OutboundRefundTable
        v-if="activeName === 'outbound'"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <FollowTable
        v-if="activeName === 'follow'"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
    </div>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplierDept";
import SelectMaterial from "@/components/SelectModel/SelectMaterialDept";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import RightToolbar from "@/components/RightToolbar";
import InboundRefundTable from "./components/InboundRefundTable.vue";
import OutboundRefundTable from "./components/OutboundRefundTable.vue";
import FollowTable from "./components/FollowTable.vue";
import { parseTime } from "@/utils/ruoyi";

function createDefaultBeginDate() {
  const date = new Date();
  date.setDate(date.getDate() - 5);
  return parseTime(date, '{y}-{m}-{d}');
}

function createDefaultEndDate() {
  return parseTime(new Date(), '{y}-{m}-{d}');
}

export default {
  name: "StockQuery",
  dicts: ['biz_status'],
  components: {
    SelectWarehouse,
    SelectSupplier,
    SelectMaterial,
    SelectDepartment,
    RightToolbar,
    InboundRefundTable,
    OutboundRefundTable,
    FollowTable
  },
  data() {
    return {
      activeName: 'inbound',
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        inHospitalCode: null,
        warehouseId: null,
        supplierId: null,
        departmentId: null,
        orderNo: null,
        orderStatus: null,
        beginDate: createDefaultBeginDate(),
        endDate: createDefaultEndDate()
      }
    };
  },
  created() {
    this.initDefaultDateRange();
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
    initDefaultDateRange() {
      this.queryParams.beginDate = createDefaultBeginDate();
      this.queryParams.endDate = createDefaultEndDate();
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.materialId = null;
      this.queryParams.inHospitalCode = null;
      this.queryParams.warehouseId = null;
      this.queryParams.supplierId = null;
      this.queryParams.departmentId = null;
      this.queryParams.orderNo = null;
      this.queryParams.orderStatus = null;
      this.initDefaultDateRange();
      this.queryParams.pageNum = 1;
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleTabClick() {
      this.resetQuery();
    },
    handleExport() {
      const exportUrl = this.activeName === 'inbound' ? 'gzOrder/export'
        : this.activeName === 'outbound' ? 'gzShipment/export'
          : 'gzFollow/export';
      this.download(exportUrl, {
        ...this.queryParams,
        orderType: this.activeName === 'inbound' ? 101 : this.activeName === 'outbound' ? 102 : null
      }, `备货查询_${this.activeName === 'inbound' ? '入退货表' : this.activeName === 'outbound' ? '出退库表' : '跟台表'}_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style>
/* 备货查询页：与出/退库查询一致，固定页面不滚动 */
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
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.out-warehouse-query-page .first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
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
.query-item-inline .el-form-item {
  margin-bottom: 0;
}
.query-select-wrapper {
  width: 180px;
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
.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 150px;
}
.query-item-date-range .query-date-start {
  margin-right: 6px;
}
.query-item-date-range .query-date-end {
  margin-left: 6px;
}
.query-item-date-range .query-date-sep {
  margin: 0 2px;
  flex-shrink: 0;
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
