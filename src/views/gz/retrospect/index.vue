<template>
  <div class="app-container out-warehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="使用追溯明细表" name="detail"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(执行科室)" name="execDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(开单科室)" name="applyDept"></el-tab-pane>
      <el-tab-pane label="使用追溯汇总表(供应商)" name="supplier"></el-tab-pane>
      <el-tab-pane label="高值耗材使用情况报表" name="usageReport"></el-tab-pane>
    </el-tabs>

    <div class="app-container first-inventory-page">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
          <el-row class="query-row-more">
            <el-col :span="24" class="query-row-more-inner">
              <el-form-item class="query-item-inline more-search-item">
                <div class="more-search-row">
                  <span class="more-search-label">更多检索</span>
                  <el-select
                    v-model="moreSearchTypes"
                    multiple
                    collapse-tags
                    placeholder="选择检索条件（可多选）"
                    class="more-search-type"
                    @change="onMoreSearchTypesChange"
                  >
                    <el-option label="院内码" value="inHospitalCode" />
                    <el-option label="耗材名称" value="materialKeyword" />
                    <el-option label="规格" value="materialSpeci" />
                    <el-option label="仓库" value="warehouse" />
                    <el-option label="生产厂家" value="factoryId" />
                    <el-option label="供应商" value="supplierId" />
                    <el-option label="批号" value="materialNo" />
                    <el-option label="收费编码" value="chargeCodeKeyword" />
                    <el-option label="门诊号/住院号" value="hospitalNumber" />
                    <el-option label="病人姓名" value="patientName" />
                    <el-option label="主条码" value="masterBarcode" />
                    <el-option label="辅条码" value="secondaryBarcode" />
                    <el-option label="UDI码" value="udiKeyword" />
                    <el-option label="阳光平台编码" value="sunshineCodeKeyword" />
                    <el-option label="医保编码" value="medicalNoKeyword" />
                  </el-select>
                  <div
                    v-for="t in moreSearchTypes"
                    :key="t"
                    class="more-search-dynamic-field"
                  >
                    <span class="more-search-field-label">{{ moreSearchTypeLabel(t) }}</span>
                    <template v-if="t === 'warehouse'">
                      <div class="query-select-wrapper more-search-warehouse-wrap">
                        <SelectWarehouse
                          v-model="queryParams.warehouseId"
                          includeWarehouseType="高值"
                          placeholder="仓库编码/名称/简码搜索"
                        />
                      </div>
                    </template>
                    <template v-else-if="t === 'factoryId'">
                      <div class="query-select-wrapper more-search-factory-wrap">
                        <SelectFactory v-model="queryParams.factoryId" placeholder="厂家名称/编码/简码搜索" />
                      </div>
                    </template>
                    <template v-else-if="t === 'supplierId'">
                      <div class="query-select-wrapper more-search-supplier-wrap">
                        <SelectSupplier
                          v-model="queryParams.supplierId"
                          :keyword.sync="queryParams.supplierKeyword"
                          allow-keyword-blur
                          placeholder="供应商编码/名称/简码搜索"
                        />
                      </div>
                    </template>
                    <el-input
                      v-else
                      v-model="queryParams[t]"
                      :placeholder="moreSearchPlaceholderFor(t)"
                      clearable
                      class="more-search-input more-search-input--dynamic"
                      @input="val => onMoreSearchInput(t, val)"
                      @keyup.enter.native="handleQuery"
                    />
                  </div>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16" class="query-row-second">
            <el-col :span="24" class="query-row-second-inner">
              <el-form-item label="日期" class="query-item-inline query-item-date-range">
                <el-date-picker
                  v-model="queryParams.startDate"
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
              <el-form-item prop="isBilling" class="query-item-inline">
                <el-select
                  v-model="queryParams.isBilling"
                  placeholder="计费"
                  clearable
                  style="width: 100px"
                >
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'billing-' + dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item prop="isProcure" class="query-item-inline">
                <el-select
                  v-model="queryParams.isProcure"
                  placeholder="集采"
                  clearable
                  style="width: 100px"
                >
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'procure-' + dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item prop="isMonitor" class="query-item-inline">
                <el-select
                  v-model="queryParams.isMonitor"
                  placeholder="重点耗材"
                  clearable
                  style="width: 110px"
                >
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="'monitor-' + dict.value"
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
        v-if="activeName === 'detail'"
        ref="detailTable"
        :query-params="queryParams"
        @selection-change="handleSelectionChange"
      />
      <UseTraceSummaryExecDept
        v-if="activeName === 'execDept'"
        ref="execDeptTable"
        :query-params="queryParams"
      />
      <UseTraceSummaryApplyDept
        v-if="activeName === 'applyDept'"
        ref="applyDeptTable"
        :query-params="queryParams"
      />
      <UseTraceSummarySupplier
        v-if="activeName === 'supplier'"
        ref="supplierTable"
        :query-params="queryParams"
      />
      <UseTraceMaterialUsageReport
        v-if="activeName === 'usageReport'"
        ref="usageReportTable"
        :query-params="queryParams"
      />
    </div>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectFactory from "@/components/SelectModel/SelectFactory";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import RightToolbar from "@/components/RightToolbar";
import UseTraceDetail from "./components/UseTraceDetail.vue";
import UseTraceSummaryExecDept from "./components/UseTraceSummaryExecDept.vue";
import UseTraceSummaryApplyDept from "./components/UseTraceSummaryApplyDept.vue";
import UseTraceSummarySupplier from "./components/UseTraceSummarySupplier.vue";
import UseTraceMaterialUsageReport from "./components/UseTraceMaterialUsageReport.vue";

export default {
  name: "RetrospectInventory",
  dicts: ['is_yes_no'],
  components: {
    SelectWarehouse,
    SelectFactory,
    SelectSupplier,
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
      moreSearchTypes: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        inHospitalCode: null,
        materialKeyword: null,
        materialSpeci: null,
        factoryId: null,
        warehouseId: null,
        warehouseName: null,
        supplierId: null,
        supplierKeyword: null,
        materialNo: null,
        chargeCodeKeyword: null,
        hospitalNumber: null,
        patientName: null,
        masterBarcode: null,
        secondaryBarcode: null,
        udiKeyword: null,
        sunshineCodeKeyword: null,
        medicalNoKeyword: null,
        startDate: null,
        endDate: null,
        orderStatus: 2,
        isBilling: null,
        isProcure: null,
        isMonitor: null
      }
    };
  },
  created() {
    this.initDefaultScanDateRange();
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
    formatScanDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    initDefaultScanDateRange() {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 5);
      this.queryParams.startDate = this.formatScanDate(start);
      this.queryParams.endDate = this.formatScanDate(end);
    },
    onMoreSearchTypesChange(val) {
      const set = new Set(val || []);
      if (!set.has('inHospitalCode')) {
        this.queryParams.inHospitalCode = null;
      }
      if (!set.has('materialKeyword')) {
        this.queryParams.materialKeyword = null;
      }
      if (!set.has('materialSpeci')) {
        this.queryParams.materialSpeci = null;
      }
      if (!set.has('warehouse')) {
        this.queryParams.warehouseId = null;
      }
      if (!set.has('factoryId')) {
        this.queryParams.factoryId = null;
      }
      if (!set.has('supplierId')) {
        this.queryParams.supplierId = null;
        this.queryParams.supplierKeyword = null;
      }
      if (!set.has('materialNo')) {
        this.queryParams.materialNo = null;
      }
      if (!set.has('chargeCodeKeyword')) {
        this.queryParams.chargeCodeKeyword = null;
      }
      if (!set.has('hospitalNumber')) {
        this.queryParams.hospitalNumber = null;
      }
      if (!set.has('patientName')) {
        this.queryParams.patientName = null;
      }
      if (!set.has('masterBarcode')) {
        this.queryParams.masterBarcode = null;
      }
      if (!set.has('secondaryBarcode')) {
        this.queryParams.secondaryBarcode = null;
      }
      if (!set.has('udiKeyword')) {
        this.queryParams.udiKeyword = null;
      }
      if (!set.has('sunshineCodeKeyword')) {
        this.queryParams.sunshineCodeKeyword = null;
      }
      if (!set.has('medicalNoKeyword')) {
        this.queryParams.medicalNoKeyword = null;
      }
    },
    moreSearchTypeLabel(t) {
      const map = {
        inHospitalCode: '院内码',
        materialKeyword: '耗材名称',
        materialSpeci: '规格',
        warehouse: '仓库',
        factoryId: '生产厂家',
        supplierId: '供应商',
        materialNo: '批号',
        chargeCodeKeyword: '收费编码',
        hospitalNumber: '门诊号/住院号',
        patientName: '病人姓名',
        masterBarcode: '主条码',
        secondaryBarcode: '辅条码',
        udiKeyword: 'UDI码',
        sunshineCodeKeyword: '阳光平台编码',
        medicalNoKeyword: '医保编码'
      };
      return map[t] || t;
    },
    moreSearchPlaceholderFor(t) {
      const map = {
        inHospitalCode: '院内码模糊',
        materialKeyword: '耗材编码/名称/简码',
        materialSpeci: '规格模糊',
        materialNo: '批号模糊',
        chargeCodeKeyword: '收费编码模糊',
        hospitalNumber: '门诊号/住院号模糊',
        patientName: '病人姓名模糊',
        masterBarcode: '主条码模糊',
        secondaryBarcode: '辅条码模糊',
        udiKeyword: 'UDI码模糊',
        sunshineCodeKeyword: '阳光平台编码模糊',
        medicalNoKeyword: '医保编码模糊'
      };
      return map[t] || '请输入关键字';
    },
    trimLeadingSpaces(val) {
      if (val === null || val === undefined) {
        return val;
      }
      return String(val).replace(/^\s+/, '');
    },
    onMoreSearchInput(field, val) {
      const trimmed = this.trimLeadingSpaces(val);
      if (trimmed !== val) {
        this.queryParams[field] = trimmed;
      }
    },
    normalizeSearchTextParams() {
      const fields = [
        'inHospitalCode', 'materialKeyword', 'materialSpeci', 'materialNo', 'supplierKeyword',
        'chargeCodeKeyword', 'hospitalNumber', 'patientName', 'masterBarcode', 'secondaryBarcode',
        'udiKeyword', 'sunshineCodeKeyword', 'medicalNoKeyword'
      ];
      fields.forEach((f) => {
        const v = this.queryParams[f];
        if (v != null && v !== '') {
          const trimmed = this.trimLeadingSpaces(v);
          this.queryParams[f] = trimmed === '' ? null : trimmed;
        }
      });
    },
    handleQuery() {
      this.normalizeSearchTextParams();
      this.queryParams.pageNum = 1;
      this.refreshActiveTable();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.inHospitalCode = null;
      this.queryParams.materialKeyword = null;
      this.queryParams.materialSpeci = null;
      this.queryParams.factoryId = null;
      this.queryParams.warehouseName = null;
      this.queryParams.warehouseId = null;
      this.queryParams.supplierId = null;
      this.queryParams.supplierKeyword = null;
      this.queryParams.materialNo = null;
      this.queryParams.chargeCodeKeyword = null;
      this.queryParams.hospitalNumber = null;
      this.queryParams.patientName = null;
      this.queryParams.masterBarcode = null;
      this.queryParams.secondaryBarcode = null;
      this.queryParams.udiKeyword = null;
      this.queryParams.sunshineCodeKeyword = null;
      this.queryParams.medicalNoKeyword = null;
      this.queryParams.orderStatus = 2;
      this.queryParams.isBilling = null;
      this.queryParams.isProcure = null;
      this.queryParams.isMonitor = null;
      this.queryParams.pageNum = 1;
      this.moreSearchTypes = [];
      this.initDefaultScanDateRange();
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
    async handleExport() {
      const refMap = {
        detail: 'detailTable',
        execDept: 'execDeptTable',
        applyDept: 'applyDeptTable',
        supplier: 'supplierTable',
        usageReport: 'usageReportTable'
      };
      const refName = refMap[this.activeName];
      const ref = refName && this.$refs[refName];
      if (!ref || typeof ref.exportTable !== 'function') {
        this.$modal.msgError('当前页签不支持导出');
        return;
      }
      await ref.exportTable();
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
.query-row-more {
  margin-bottom: 2px;
}
.query-row-more-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  padding-bottom: 2px;
}
.query-row-more-inner .more-search-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 0;
}
.query-row-more-inner .more-search-item >>> .el-form-item__content {
  line-height: 32px;
}
.more-search-item >>> .el-form-item__content {
  line-height: 32px;
  max-width: none;
}
.more-search-row {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  flex-shrink: 0;
  min-height: 32px;
}
.more-search-dynamic-field {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  flex-shrink: 0;
}
.more-search-field-label {
  color: #606266;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.more-search-label {
  color: #606266;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.more-search-type {
  min-width: 220px;
  width: auto;
  max-width: 360px;
  flex-shrink: 0;
}
.more-search-type >>> .el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
}
.more-search-type >>> .el-select__tags {
  max-width: calc(100% - 28px);
}
.more-search-type >>> .el-input {
  display: flex;
  align-items: center;
}
.more-search-input {
  width: 200px;
}
.more-search-input--dynamic {
  width: 180px;
}
.more-search-warehouse-wrap {
  width: 210px;
}
.more-search-factory-wrap,
.more-search-supplier-wrap {
  width: 210px;
}
.more-search-warehouse-wrap >>> .el-select,
.more-search-factory-wrap >>> .el-select,
.more-search-supplier-wrap >>> .el-select,
.more-search-supplier-wrap >>> .el-autocomplete {
  width: 100%;
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
