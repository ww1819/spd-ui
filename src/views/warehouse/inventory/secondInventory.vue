<template>
  <div class="app-container list-page second-inventory-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <more-search-bar
          ref="moreSearchBar"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          @change="onMoreSearchTypesChange"
          @search="handleQuery"
          @reset="resetQuery"
        >
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="(t === 'supplier' || t === 'warehouse') ? 'more-search-field--select' : 'more-search-field--text'"
          >
            <template v-if="t === 'supplier'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectSupplier v-model="queryParams.supplierId" />
              </div>
            </template>
            <template v-else-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['设备', '高值']"/>
              </div>
            </template>
            <el-input
              v-else
              v-model="queryParams[t]"
              :placeholder="moreSearchPlaceholderFor(t)"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

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
            <el-form-item label="计费" prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="请选择计费"
                         clearable class="more-search-short-select">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
            </el-form-item>
            <el-form-item label="产品档案" prop="materialIsUse" class="query-item-inline">
              <el-select v-model="queryParams.materialIsUse" placeholder="启停用" clearable class="more-search-short-select">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item class="query-item-inline query-item-zero-stock">
              <el-button
                size="small"
                :class="showZeroStock ? 'spd-btn spd-btn--primary' : 'spd-btn spd-btn--secondary'"
                :type="showZeroStock ? 'primary' : 'default'"
                @click="toggleShowZeroStock"
              >零库存</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
    <el-table v-loading="loading" :data="inventoryList"
              @selection-change="handleSelectionChange"
              height="60vh"
              border>
      <el-table-column type="selection" width="48" align="center" fixed="left"/>
      <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="100" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode"/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName"/>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci"/>
      <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByModel"/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" min-width="70" show-overflow-tooltip resizable sortable :sort-method="sortByUnitName"/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" min-width="90" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="80" min-width="70" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialQty"/>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialAmt">
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" prop="isBilling" width="80" min-width="70" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.isBilling === '1' || scope.row.isBilling === 1 || scope.row.isBilling === 'true'">是</span>
          <span v-else-if="scope.row.isBilling === '0' || scope.row.isBilling === 0 || scope.row.isBilling === '2' || scope.row.isBilling === 'false'">否</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="产品档案状态" align="center" prop="materialIsUse" width="110" min-width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ materialUseDictLabel(scope.row.materialIsUse) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="registerNo" width="180" min-width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.registerNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证有效期" align="center" prop="periodDate" width="180" min-width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.periodDate">{{ parseTime(scope.row.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" min-width="90" show-overflow-tooltip resizable/>
      <el-table-column label="厂家" align="center" prop="factoryName" width="120" min-width="90" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column
        v-for="col in hisChargeItemColumnDefs"
        :key="'his-charge-' + col.key"
        :label="col.label"
        :width="col.width"
        align="center"
        show-overflow-tooltip
        resizable
      >
        <template slot-scope="scope">
          <span>{{ col.text(scope.row) }}</span>
        </template>
      </el-table-column>

    </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

  </div>
</template>

<script>
import { listInventorySummary } from "@/api/warehouse/inventory";
import { exportWarehouseInventorySummaryStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import RightToolbar from "@/components/RightToolbar";
import hisChargeItemTableColumnsMixin from "@/mixins/hisChargeItemTableColumns";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "secondInventory",
  dicts: ['is_use_status'],
  mixins: [hisChargeItemTableColumnsMixin],
  components: {SelectMaterial,SelectWarehouse,SelectSupplier,RightToolbar},
  data() {
    return {
      hisChargeFlatRow: true,
      // 遮罩层
      loading: true,
      activeName: 'first',
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
      // 库存明细表格数据
      inventoryList: [],
      totalInfo:{
        totalQty: 0,
        totalAmt:0
      },

      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        warehouseId: null,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        supplierId: null,
        beginDate: null,
        endDate: null,
        isBilling: null,
        materialIsUse: null,
        hisChargeItemId: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      },
      /** 是否显示零库存汇总（默认不显示） */
      showZeroStock: false,
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "supplier", label: "供应商" },
        { value: "materialName", label: "耗材名称" },
        { value: "materialSpeci", label: "规格" },
        { value: "materialModel", label: "型号" },
        { value: "hisChargeItemId", label: "收费项目ID" },
        { value: "warehouse", label: "仓库" }
      ]
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.warehouse.inventory.second.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["supplier", "materialName", "materialSpeci", "materialModel", "hisChargeItemId", "warehouse"];
    },
    /** 当前页数量合计 */
    pageTotalQty() {
      return (this.inventoryList || []).reduce((s, r) => s + Number(r.materialQty || 0), 0);
    },
    /** 当前页金额合计（格式化） */
    pageTotalAmtFormatted() {
      const amt = (this.inventoryList || []).reduce((s, r) => s + Number(r.materialAmt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    },
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
  },
  mounted() {
    listWarehouse().then((res) => {
      this.restaurants = res.rows;
    });
  },
  methods: {
    moreSearchPlaceholderFor(t) {
      const map = {
        materialName: "名称/编码/拼音模糊",
        materialSpeci: "规格模糊",
        materialModel: "型号模糊",
        hisChargeItemId: "收费项目ID模糊"
      };
      return map[t] || "请输入";
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
      if (!set.has("supplier")) target.supplierId = null;
      if (!set.has("warehouse")) target.warehouseId = null;
      if (!set.has("materialName")) target.materialName = null;
      if (!set.has("materialSpeci")) target.materialSpeci = null;
      if (!set.has("materialModel")) target.materialModel = null;
      if (!set.has("hisChargeItemId")) target.hisChargeItemId = null;
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    materialUseDictLabel(isUse) {
      if (isUse === undefined || isUse === null || isUse === '') return '--';
      const v = this.selectDictLabel && this.dict && this.dict.type && this.dict.type.is_use_status
        ? this.selectDictLabel(this.dict.type.is_use_status, String(isUse))
        : '';
      return v || '--';
    },
    /** 表头排序：字符串列 */
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    /** 表头排序：数值列 */
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
    sortByMaterialQty(a, b) { return this.sortByNum(a, b, 'materialQty'); },
    sortByMaterialAmt(a, b) { return this.sortByNum(a, b, 'materialAmt'); },
    querySearchAsync(queryString, cb) {
      const res = this.restaurants;
      if(res.length>0) {
        res.forEach(item => {
          item.value = item.name;
        })
      }

      let results = res.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1;
      })
      cb(results);
    },
    buildListQueryParams(extra = {}) {
      const params = { ...this.queryParams, ...extra };
      this.applyMoreSearchToQueryParams(params);
      if (this.showZeroStock) {
        params.onlyZeroQty = true;
        delete params.excludeZeroQty;
      } else {
        params.excludeZeroQty = true;
        delete params.onlyZeroQty;
      }
      return params;
    },
    toggleShowZeroStock() {
      this.showZeroStock = !this.showZeroStock;
      this.handleQuery();
    },
    /** 查询库存汇总列表 */
    getList() {
      this.loading = true;
      listInventorySummary(this.buildListQueryParams()).then(response => {
        this.inventoryList = Array.isArray(response) ? response : (response.rows || []);
        this.total = response.total != null ? response.total : (this.inventoryList || []).length;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0 };
        this.loading = false;
      }).catch(error => {
        console.error('汇总数据加载失败:', error);
        this.inventoryList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        qty: null,
        materialId: null,
        warehouseId: null,
        unitPrice: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null
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
      this.queryParams.materialName = null;
      this.queryParams.materialSpeci = null;
      this.queryParams.materialModel = null;
      this.queryParams.supplierId = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.isBilling = null;
      this.queryParams.materialIsUse = null;
      this.showZeroStock = false;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const requestParams = this.buildListQueryParams({ pageNum: 1, pageSize: 10000 });
      this.loading = true;
      try {
        const response = await listInventorySummary(requestParams);
        const rows = Array.isArray(response) ? response : (response.rows || []);
        if (!rows.length) {
          this.$message && this.$message.warning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        await exportWarehouseInventorySummaryStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `库存汇总查询表${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
  }

};
</script>

<style>
/* 与库存明细查询一致：内层不叠加左右 padding */
.app-container.second-inventory-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.second-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.second-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
.second-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.second-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.second-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}
</style>

<style scoped>
.app-container {
  margin-top: -10px;
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

.query-item-zero-stock {
  margin-right: 0;
  vertical-align: middle;
}
.query-item-zero-stock .el-button {
  min-width: 72px;
}

.query-row-second {
  margin-bottom: 2px;
  position: relative;
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

.query-select-billing {
  width: 120px;
}

.query-input-material-name {
  width: 170px;
}
.query-input-material-spec,
.query-input-material-model {
  width: 130px;
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

.form-fields-container {
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
}

.button-row-inventory {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
}

.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  min-width: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

/* 表体横向可滚；表内合计已关闭，合计见下方 pagination-summary */
.table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 16px;
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 10px;
  transition: height 0.2s ease;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:hover {
  height: 14px;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 3px;
  margin: 0 2px;
  cursor: pointer;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 3px;
  cursor: grab;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #808080;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #606060;
  cursor: grabbing;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}
.table-container ::v-deep .el-table th.el-table__cell .cell {
  white-space: nowrap;
}
.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}
.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}

.table-container ::v-deep .el-table th.col-serial-center .cell,
.table-container ::v-deep .el-table td.col-serial-center .cell {
  text-align: center !important;
}

.table-container ::v-deep .col-serial-center-text {
  display: block;
  width: 100%;
  text-align: center;
}
</style>
