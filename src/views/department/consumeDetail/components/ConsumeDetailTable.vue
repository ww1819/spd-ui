<template>
  <div class="app-container list-page first-inventory-page consume-detail-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'materialName'">
              <div class="query-select-wrapper more-search-select-wrap">
                <MaterialAutocomplete v-model="queryParams.materialName" />
              </div>
            </template>
            <template v-else-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable />
              </div>
            </template>
            <template v-else-if="t === 'department'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectDepartment v-model="queryParams.departmentId" clearable />
              </div>
            </template>
            <el-input
              v-else
              v-model="queryParams.billNo"
              placeholder="出库单号"
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
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker query-date-end"
              />
            </el-form-item>
            <el-form-item prop="batchNo" class="query-item-inline">
              <el-input
                v-model="queryParams.batchNo"
                placeholder="批号"
                clearable
                class="query-input-batch"
                @keyup.enter.native="handleQuery"
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
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="reportTable"
        class="consume-detail-main-table"
        v-loading="loading"
        :data="consumeDetailList"
        :height="tableHeight"
        :row-key="getConsumeRowKey"
        :row-class-name="consumeRowClassName"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleConsumeRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="consume-select-col col-serial-center" />
        <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库单号" align="left" header-align="center" class-name="ctk-col-left" prop="billNo" width="180" show-overflow-tooltip resizable />
        <el-table-column label="仓库" align="left" header-align="center" class-name="ctk-col-left" prop="warehouseName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="科室" align="left" header-align="center" class-name="ctk-col-left" prop="departmentName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode" />
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" />
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" prop="materialSpeci" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci" />
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByModel" />
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByUnitName" />
        <el-table-column label="数量" align="center" prop="qty" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByQty" />
        <el-table-column label="单价" align="center" prop="unitPrice" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice">
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="amt" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmt">
          <template slot-scope="scope">
            <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" align="left" header-align="center" class-name="ctk-col-left" prop="batchNo" width="200" show-overflow-tooltip resizable />
        <el-table-column label="批号" align="left" header-align="center" class-name="ctk-col-left" prop="batchNumber" width="120" show-overflow-tooltip resizable />
        <el-table-column label="生产日期" align="center" prop="beginTime" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, "{y}-{m}-{d}") }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" align="center" prop="endTime" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, "{y}-{m}-{d}") }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="制单人" align="left" header-align="center" class-name="ctk-col-left" prop="createrName" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.createrName">{{ scope.row.createrName }}</span>
            <span v-else-if="scope.row.createrNickName">{{ scope.row.createrNickName }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.billDate, "{y}-{m}-{d}") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核人" align="left" header-align="center" class-name="ctk-col-left" prop="auditPersonName" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.auditPersonName">{{ scope.row.auditPersonName }}</span>
            <span v-else-if="scope.row.auditNickName">{{ scope.row.auditNickName }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="审核日期" align="center" prop="auditDate" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, "{y}-{m}-{d}") }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="厂家" align="left" header-align="center" class-name="ctk-col-left" prop="factoryName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="供应商" align="left" header-align="center" class-name="ctk-col-left" prop="supplierName" width="160" show-overflow-tooltip resizable />
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
import { listConsumeDetail } from "@/api/department/consumeDetail";
import { exportConsumeDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import { getDefaultBeginDate, getDefaultEndDate } from "../consumeDetailDateDefaults";
import consumeDetailLayoutMixin from "../mixins/consumeDetailLayoutMixin";

export default {
  name: "ConsumeDetailTable",
  mixins: [consumeDetailLayoutMixin],
  components: { SelectWarehouse, SelectDepartment, MaterialAutocomplete, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "出库单号", value: "billNo" },
        { label: "耗材", value: "materialName" },
        { label: "仓库", value: "warehouse" },
        { label: "科室", value: "department" }
      ],
      selectedRowKeys: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      tableHeight: 400,
      total: 0,
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      consumeDetailList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        materialName: null,
        warehouseId: null,
        departmentId: null,
        beginDate: getDefaultBeginDate(),
        endDate: getDefaultEndDate(),
        batchNo: null
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.department.consumeDetail.detail.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    },
    pageTotalQty() {
      return (this.consumeDetailList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.consumeDetailList || []).reduce((s, r) => s + Number(r.amt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    }
  },
  mounted() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
    this.initConsumeDetailLayout();
  },
  methods: {
    stampRowKeys(rows) {
      const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
      return (rows || []).map((row, idx) => {
        if (row && !row._rowKey) {
          row._rowKey = `consume-detail-${pageBase + idx}-${row.billNo || ''}-${row.materialCode || ''}-${idx}`;
        }
        return row;
      });
    },
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByNum(a, b, prop) {
      const va = Number(a[prop]);
      const vb = Number(b[prop]);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortByMaterialCode(a, b) { return this.sortByStr(a, b, r => r.materialCode || ''); },
    sortByMaterialName(a, b) { return this.sortByStr(a, b, r => r.materialName || ''); },
    sortBySpeci(a, b) { return this.sortByStr(a, b, r => r.materialSpeci || ''); },
    sortByModel(a, b) { return this.sortByStr(a, b, r => r.materialModel || ''); },
    sortByUnitName(a, b) { return this.sortByStr(a, b, r => r.unitName || ''); },
    sortByQty(a, b) { return this.sortByNum(a, b, 'qty'); },
    sortByUnitPrice(a, b) { return this.sortByNum(a, b, 'unitPrice'); },
    sortByAmt(a, b) { return this.sortByNum(a, b, 'amt'); },
    getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(queryParams);
      listConsumeDetail(queryParams)
        .then(response => {
          this.consumeDetailList = this.stampRowKeys(response.rows || []);
          this.total = response.total != null ? response.total : 0;
          this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
          this.selectedRowKeys = [];
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
        })
        .catch(() => {
          this.consumeDetailList = [];
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
      this.queryParams.materialName = null;
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.beginDate = getDefaultBeginDate();
      this.queryParams.endDate = getDefaultEndDate();
      this.queryParams.batchNo = null;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass(t) {
      if (['warehouse', 'department', 'materialName'].includes(t)) {
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
        billNo: 'billNo',
        materialName: 'materialName',
        warehouse: 'warehouseId',
        department: 'departmentId'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 };
      this.applyMoreSearchToQueryParams(requestParams);
      this.loading = true;
      try {
        const response = await listConsumeDetail(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportConsumeDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室领用明细表${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    }
  }
};
</script>

<style src="../styles/consumeDetailLayout.css"></style>
<style scoped src="../styles/consumeDetailLayoutScoped.css"></style>
