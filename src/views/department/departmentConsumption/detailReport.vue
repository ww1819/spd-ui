<template>
  <div class="app-container list-page first-inventory-page dept-consume-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="searchForm" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'department'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectDepartment v-model="searchForm.departmentId" field-placeholder="科室" />
              </div>
            </template>
            <el-input
              v-else-if="t === 'consumeBillNo'"
              v-model="searchForm.consumeBillNo"
              placeholder="单号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'hisChargeCode'"
              v-model="searchForm.hisChargeCode"
              placeholder="HIS收费编码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'patientId'"
              v-model="searchForm.patientId"
              placeholder="住院/门诊号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'specification'"
              v-model="searchForm.specification"
              placeholder="规格"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'model'"
              v-model="searchForm.model"
              placeholder="型号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'warehouseCategoryKeyword'"
              v-model="searchForm.warehouseCategoryKeyword"
              placeholder="耗材分类编码/名称/简码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'financeCategoryKeyword'"
              v-model="searchForm.financeCategoryKeyword"
              placeholder="财务分类编码/名称/简码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="searchForm.materialName"
              placeholder="耗材名称"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </div>
        <more-search-bar
          ref="moreSearchBar"
          class="ctk-more-search-bar--hidden"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          :show-picker="false"
          :show-save="false"
          :show-search-actions="false"
          @change="onMoreSearchTypesChange"
        />

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="消耗日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="searchForm.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="searchForm.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker query-date-end"
              />
            </el-form-item>
            <div class="ctk-query-actions query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="list-toolbar ctk-list-toolbar">
      <div class="list-toolbar-left">
        <el-button type="warning" size="small" icon="el-icon-download" class="spd-btn" @click="handleExport">导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <div class="toolbar-more-search" @mouseenter="onToolbarMoreEnter" @mouseleave="onToolbarMoreLeave">
          <span class="more-search-label">更多检索</span>
          <el-select
            ref="toolbarMoreSelect"
            v-model="moreSearchTypes"
            multiple
            collapse-tags
            size="small"
            :popper-append-to-body="false"
            placeholder="选择检索条件（可多选）"
            class="more-search-type"
            @change="onMoreSearchTypesChange"
            @visible-change="onToolbarMoreVisibleChange"
          >
            <el-option v-for="opt in moreSearchOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <el-button type="success" size="small" icon="el-icon-check" class="spd-btn" @click="saveMoreSearchDefaults">保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        <el-tooltip class="item" effect="dark" content="显隐列" placement="top">
          <el-button size="small" circle icon="el-icon-menu" @click="openColumnDialog" />
        </el-tooltip>
      </div>
    </el-row>

    <table-column-setting-dialog
      :visible.sync="columnDialogVisible"
      :ordered-columns="orderedColumns"
      :visible-count="visibleColumnList.length"
      :total-count="columns.length"
      :active-key="columnActiveKey"
      :can-move-up="canMoveColumnUp"
      :can-move-down="canMoveColumnDown"
      @select-row="selectColumnRow"
      @move="moveColumn"
      @set-visible="setColumnVisible"
      @set-sortable="setColumnSortable"
      @set-width="setColumnWidth"
      @set-align="setColumnAlign"
      @save="saveColumnConfig"
      @init="initColumnConfig"
    />

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="reportTable"
        class="dept-consume-main-table"
        :key="'dept-consume-detail-table-' + tableColumnEpoch"
        v-loading="loading"
        :data="tableData"
        :height="tableHeight"
        :row-key="getDeptConsumeRowKey"
        :row-class-name="deptConsumeRowClassName"
        border
        stripe
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleDeptConsumeRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="dept-consume-select-col col-serial-center" />
        <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <template v-for="item in tableColumnItems">
          <el-table-column
            v-if="Number(item.col.key) === 0"
            :key="'tc-' + tableColumnEpoch + '-0'"
            label="单号"
            prop="billNo"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 1"
            :key="'tc-' + tableColumnEpoch + '-1'"
            label="科室"
            prop="departmentName"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 2"
            :key="'tc-' + tableColumnEpoch + '-2'"
            label="耗材编码"
            prop="materialCode"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 3"
            :key="'tc-' + tableColumnEpoch + '-3'"
            label="耗材名称"
            prop="materialName"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 4"
            :key="'tc-' + tableColumnEpoch + '-4'"
            label="规格"
            prop="specification"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 5"
            :key="'tc-' + tableColumnEpoch + '-5'"
            label="型号"
            prop="model"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 6"
            :key="'tc-' + tableColumnEpoch + '-6'"
            label="单位"
            prop="unitName"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 7"
            :key="'tc-' + tableColumnEpoch + '-7'"
            label="单价"
            prop="unitPrice"
            show-overflow-tooltip
            resizable
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.unitPrice != null && scope.row.unitPrice !== ''">{{ scope.row.unitPrice | formatPrice }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 8"
            :key="'tc-' + tableColumnEpoch + '-8'"
            label="数量"
            prop="quantity"
            show-overflow-tooltip
            resizable
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 9"
            :key="'tc-' + tableColumnEpoch + '-9'"
            label="金额"
            prop="amount"
            show-overflow-tooltip
            resizable
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.amount">{{ scope.row.amount | formatCurrency }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 10"
            :key="'tc-' + tableColumnEpoch + '-10'"
            label="耗材分类"
            prop="category"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 11"
            :key="'tc-' + tableColumnEpoch + '-11'"
            label="财务分类"
            prop="financialCategory"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 12"
            :key="'tc-' + tableColumnEpoch + '-12'"
            label="注册证号"
            prop="registrationNumber"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 13"
            :key="'tc-' + tableColumnEpoch + '-13'"
            label="医保编码"
            prop="medicalInsuranceCode"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 14"
            :key="'tc-' + tableColumnEpoch + '-14'"
            label="收费编码"
            prop="hisChargeItemCode"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 15"
            :key="'tc-' + tableColumnEpoch + '-15'"
            label="收费名称"
            prop="hisChargeItemName"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 16"
            :key="'tc-' + tableColumnEpoch + '-16'"
            label="收费规格"
            prop="hisChargeItemSpeci"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 17"
            :key="'tc-' + tableColumnEpoch + '-17'"
            label="收费单位"
            prop="hisChargeItemUnit"
            show-overflow-tooltip
            resizable
            :class-name="(item.col.align || 'left') === 'left' ? 'ctk-col-left' : ''"
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 18"
            :key="'tc-' + tableColumnEpoch + '-18'"
            label="收费价格"
            prop="hisChargeItemPrice"
            show-overflow-tooltip
            resizable
            :sortable="item.col.sortable ? 'custom' : false"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.hisChargeItemPrice != null && scope.row.hisChargeItemPrice !== ''">{{ scope.row.hisChargeItemPrice | formatCurrency }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额:
        {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额:
        {{ pageTotalAmtFormatted }}
      </div>
      <div class="pagination-container">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          :pager-count="7"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import request from "@/utils/request";
import RightToolbar from "@/components/RightToolbar";
import TableColumnSettingDialog from "@/components/TableColumnSettingDialog";
import { createTableColumnSettingsMixin } from "@/mixins/tableColumnSettings";
import { exportDepartmentConsumptionDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import { buildDefaultDateRange } from "@/utils/defaultDateRange";
import deptConsumeLayoutMixin from "./mixins/deptConsumeLayoutMixin";

function createDefaultDates() {
  const { beginDate, endDate } = buildDefaultDateRange(5);
  return { beginDate, endDate };
}

function createDefaultDetailReportColumns() {
  return [
    { key: 0, label: "单号", visible: true, width: 180, align: "left", sortable: false },
    { key: 1, label: "科室", visible: true, width: 120, align: "left", sortable: false },
    { key: 2, label: "耗材编码", visible: true, width: 145, align: "left", sortable: true },
    { key: 3, label: "耗材名称", visible: true, width: 185, align: "left", sortable: true },
    { key: 4, label: "规格", visible: true, width: 130, align: "left", sortable: true },
    { key: 5, label: "型号", visible: true, width: 130, align: "left", sortable: true },
    { key: 6, label: "单位", visible: true, width: 100, align: "left", sortable: true },
    { key: 7, label: "单价", visible: true, width: 120, align: "center", sortable: true },
    { key: 8, label: "数量", visible: true, width: 110, align: "center", sortable: true },
    { key: 9, label: "金额", visible: true, width: 130, align: "center", sortable: true },
    { key: 10, label: "耗材分类", visible: true, width: 120, align: "left", sortable: false },
    { key: 11, label: "财务分类", visible: true, width: 120, align: "left", sortable: false },
    { key: 12, label: "注册证号", visible: true, width: 180, align: "left", sortable: false },
    { key: 13, label: "医保编码", visible: true, width: 120, align: "left", sortable: false },
    { key: 14, label: "收费编码", visible: true, width: 130, align: "left", sortable: false },
    { key: 15, label: "收费名称", visible: true, width: 150, align: "left", sortable: false },
    { key: 16, label: "收费规格", visible: true, width: 130, align: "left", sortable: false },
    { key: 17, label: "收费单位", visible: true, width: 100, align: "left", sortable: false },
    { key: 18, label: "收费价格", visible: true, width: 120, align: "center", sortable: false }
  ];
}

export default {
  name: "DetailReport",
  mixins: [
    deptConsumeLayoutMixin,
    createTableColumnSettingsMixin({
      createDefaultColumns: createDefaultDetailReportColumns,
      configKey: "dept_consumption_detail_columns",
      tableRef: "reportTable"
    })
  ],
  components: { SelectDepartment, RightToolbar, TableColumnSettingDialog },
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "科室", value: "department" },
        { label: "单号", value: "consumeBillNo" },
        { label: "HIS收费编码", value: "hisChargeCode" },
        { label: "住院/门诊号", value: "patientId" },
        { label: "耗材名称", value: "materialName" },
        { label: "规格", value: "specification" },
        { label: "型号", value: "model" },
        { label: "耗材分类", value: "warehouseCategoryKeyword" },
        { label: "财务分类", value: "financeCategoryKeyword" }
      ],
      selectedRowKeys: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      tableHeight: 400,
      tableData: [],
      total: 0,
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        sortField: null,
        sortOrder: null
      },
      searchForm: {
        departmentId: null,
        consumeBillNo: "",
        materialName: "",
        specification: "",
        model: "",
        hisChargeCode: "",
        patientId: "",
        warehouseCategoryKeyword: "",
        financeCategoryKeyword: "",
        ...createDefaultDates()
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.department.departmentConsumption.detail.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    },
    pageTotalQty() {
      return (this.tableData || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.tableData || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.loadUserColumnConfig().finally(() => {
      this.getList();
    });
  },
  mounted() {
    this.initDeptConsumeLayout();
  },
  methods: {
    stampRowKeys(rows) {
      const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
      return (rows || []).map((row, idx) => {
        if (row && !row._rowKey) {
          row._rowKey = `dept-consume-detail-${pageBase + idx}-${row.billNo || ''}-${row.materialCode || ''}-${idx}`;
        }
        return row;
      });
    },
    buildRequestParams() {
      const form = { ...this.searchForm };
      this.applyMoreSearchToQueryParams(form);
      const params = {
        departmentId: form.departmentId,
        consumeBillNo: form.consumeBillNo,
        materialName: form.materialName,
        specification: form.specification,
        model: form.model,
        hisChargeCode: form.hisChargeCode,
        patientId: form.patientId,
        warehouseCategoryKeyword: form.warehouseCategoryKeyword,
        financeCategoryKeyword: form.financeCategoryKeyword,
        beginDate: form.beginDate,
        endDate: form.endDate,
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        sortField: this.queryParams.sortField,
        sortOrder: this.queryParams.sortOrder
      };
      return params;
    },
    getList() {
      this.loading = true;
      request({
        url: "/department/batchConsume/auditedDetailList",
        method: "get",
        params: this.buildRequestParams()
      })
        .then(response => {
          if (response && (response.code === 200 || response.code === undefined)) {
            this.tableData = this.stampRowKeys(response.rows || response.data?.rows || []);
            this.total = response.total != null ? response.total : response.data?.total || 0;
            this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
          } else {
            this.tableData = [];
            this.total = 0;
            this.totalInfo = { totalQty: 0, totalAmt: 0 };
            if (response && response.msg) {
              this.$modal.msgWarning(response.msg);
            }
          }
          this.selectedRowKeys = [];
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
        })
        .catch(error => {
          this.$modal.msgError("查询失败：" + (error.msg || error.message || "未知错误"));
          this.tableData = [];
          this.total = 0;
          this.totalInfo = { totalQty: 0, totalAmt: 0 };
          this.selectedRowKeys = [];
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
        });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      Object.assign(this.searchForm, createDefaultDates());
      this.searchForm.consumeBillNo = "";
      this.queryParams.sortField = null;
      this.queryParams.sortOrder = null;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass(t) {
      if (t === 'department') {
        return 'more-search-field--select';
      }
      return 'more-search-field--text';
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.loadDefaults === "function") {
        return bar.loadDefaults();
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v));
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      const map = {
        department: 'departmentId',
        consumeBillNo: 'consumeBillNo',
        hisChargeCode: 'hisChargeCode',
        patientId: 'patientId',
        materialName: 'materialName',
        specification: 'specification',
        model: 'model',
        warehouseCategoryKeyword: 'warehouseCategoryKeyword',
        financeCategoryKeyword: 'financeCategoryKeyword'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.searchForm);
    },
    handleSortChange({ prop, order }) {
      this.queryParams.sortField = order ? prop : null;
      this.queryParams.sortOrder = order === "descending" ? "desc" : order === "ascending" ? "asc" : null;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const params = { ...this.buildRequestParams(), pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await request({
          url: "/department/batchConsume/auditedDetailList",
          method: "get",
          params
        });
        const ok = response && (response.code === 200 || response.code === undefined);
        const rows = ok ? response.rows || response.data?.rows || [] : [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const beginDate = this.searchForm.beginDate || "";
        const endDate = this.searchForm.endDate || beginDate;
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDepartmentConsumptionDetailStyledXlsx({
          rows,
          beginDate,
          endDate,
          fileName: `科室消耗明细报表${dateStr}.xlsx`
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style src="./styles/deptConsumeLayout.css"></style>
<style scoped src="./styles/deptConsumeLayoutScoped.css"></style>
