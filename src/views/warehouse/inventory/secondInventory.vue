<template>
  <div class="app-container list-page first-inventory-page inv-summary-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div class="more-search-dynamic-field more-search-field--select">
            <div class="query-select-wrapper more-search-select-wrap">
              <SelectSupplier v-model="queryParams.supplierId" />
            </div>
          </div>
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="t === 'warehouse' ? 'more-search-field--select' : 'more-search-field--text'"
          >
            <template v-if="t === 'warehouse'">
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
        </div>
        <!-- 仅用于读写「更多检索」本地默认，界面不展示 -->
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
            <el-form-item label="日期" class="query-item-inline query-item-date-range">
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
            <el-form-item prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="计费"
                         clearable class="more-search-short-select">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
            </el-form-item>
            <el-form-item prop="materialIsUse" class="query-item-inline">
              <el-select v-model="queryParams.materialIsUse" placeholder="产品档案" clearable class="more-search-short-select">
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
                icon="el-icon-box"
                :class="showZeroStock ? 'spd-btn spd-btn--primary' : 'spd-btn spd-btn--secondary'"
                :type="showZeroStock ? 'primary' : 'default'"
                @click="toggleShowZeroStock"
              >零库存</el-button>
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
        <el-button
          type="warning"
          size="small"
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <div
          class="toolbar-more-search"
          @mouseenter="onToolbarMoreEnter"
          @mouseleave="onToolbarMoreLeave"
        >
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
            <el-option
              v-for="opt in moreSearchOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <el-button
          type="success"
          size="small"
          icon="el-icon-check"
          class="spd-btn"
          @click="saveMoreSearchDefaults"
        >保存查询条件</el-button>
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
      ref="invDetailTable"
      class="inv-detail-main-table"
      :key="'inv-summary-table-' + tableColumnEpoch"
      v-loading="loading"
      :data="inventoryList"
      :row-key="getDetailRowKey"
      :row-class-name="invDetailRowClassName"
      @selection-change="handleSelectionChange"
      @row-dblclick="handleDetailRowDblclick"
      :height="tableHeight"
      border
      stripe
    >
      <el-table-column type="selection" width="48" align="center" fixed="left"/>
      <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <template v-for="item in tableColumnItems">
        <el-table-column
          v-if="Number(item.col.key) === 0"
          :key="'tc-' + tableColumnEpoch + '-0'"
          label="产品编码"
          prop="materialCode"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :sort-method="sortByMaterialCode"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
        <el-table-column
          v-else-if="Number(item.col.key) === 1"
          :key="'tc-' + tableColumnEpoch + '-1'"
          label="产品名称"
          prop="materialName"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :sort-method="sortByMaterialName"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
        <el-table-column
          v-else-if="Number(item.col.key) === 2"
          :key="'tc-' + tableColumnEpoch + '-2'"
          label="规格"
          prop="materialSpeci"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :sort-method="sortBySpeci"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
        <el-table-column
          v-else-if="Number(item.col.key) === 3"
          :key="'tc-' + tableColumnEpoch + '-3'"
          label="型号"
          prop="materialModel"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :sort-method="sortByModel"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
        <el-table-column
          v-else-if="Number(item.col.key) === 4"
          :key="'tc-' + tableColumnEpoch + '-4'"
          label="单位"
          prop="unitName"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :sort-method="sortByUnitName"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
        <el-table-column
          v-else-if="Number(item.col.key) === 5"
          :key="'tc-' + tableColumnEpoch + '-5'"
          label="单价"
          prop="unitPrice"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        >
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="Number(item.col.key) === 6"
          :key="'tc-' + tableColumnEpoch + '-6'"
          label="数量"
          prop="materialQty"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :sort-method="sortByMaterialQty"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
        <el-table-column
          v-else-if="Number(item.col.key) === 7"
          :key="'tc-' + tableColumnEpoch + '-7'"
          label="金额"
          prop="materialAmt"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :sort-method="sortByMaterialAmt"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        >
          <template slot-scope="scope">
            <span v-if="scope.row.materialAmt">{{ scope.row.materialAmt | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="Number(item.col.key) === 8"
          :key="'tc-' + tableColumnEpoch + '-8'"
          label="计费"
          prop="isBilling"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        >
          <template slot-scope="scope">
            <span v-if="scope.row.isBilling === '1' || scope.row.isBilling === 1 || scope.row.isBilling === 'true'">是</span>
            <span v-else-if="scope.row.isBilling === '0' || scope.row.isBilling === 0 || scope.row.isBilling === '2' || scope.row.isBilling === 'false'">否</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="Number(item.col.key) === 9"
          :key="'tc-' + tableColumnEpoch + '-9'"
          label="产品档案状态"
          prop="materialIsUse"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        >
          <template slot-scope="scope">
            <span>{{ materialUseDictLabel(scope.row.materialIsUse) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="Number(item.col.key) === 10"
          :key="'tc-' + tableColumnEpoch + '-10'"
          label="注册证号"
          prop="registerNo"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        >
          <template slot-scope="scope">
            <span>{{ scope.row.registerNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="Number(item.col.key) === 11"
          :key="'tc-' + tableColumnEpoch + '-11'"
          label="注册证有效期"
          prop="periodDate"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        >
          <template slot-scope="scope">
            <span v-if="scope.row.periodDate">{{ parseTime(scope.row.periodDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="Number(item.col.key) === 12"
          :key="'tc-' + tableColumnEpoch + '-12'"
          label="仓库"
          prop="warehouseName"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
        <el-table-column
          v-else-if="Number(item.col.key) === 13"
          :key="'tc-' + tableColumnEpoch + '-13'"
          label="厂家"
          prop="factoryName"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
        <el-table-column
          v-else-if="Number(item.col.key) === 14"
          :key="'tc-' + tableColumnEpoch + '-14'"
          label="供应商"
          prop="supplierName"
          show-overflow-tooltip
          resizable
          :sortable="!!item.col.sortable"
          :align="item.col.align || 'center'"
          header-align="center"
          :width="item.col.width"
        />
      </template>
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
import TableColumnSettingDialog from "@/components/TableColumnSettingDialog";
import { createTableColumnSettingsMixin } from "@/mixins/tableColumnSettings";
import hisChargeItemTableColumnsMixin from "@/mixins/hisChargeItemTableColumns";
import { listWarehouse } from "@/api/foundation/warehouse";

function createDefaultSecondSummaryColumns() {
  return [
    { key: 0, label: "产品编码", visible: true, width: 100, align: "center", sortable: true },
    { key: 1, label: "产品名称", visible: true, width: 160, align: "center", sortable: true },
    { key: 2, label: "规格", visible: true, width: 100, align: "center", sortable: true },
    { key: 3, label: "型号", visible: true, width: 100, align: "center", sortable: true },
    { key: 4, label: "单位", visible: true, width: 80, align: "center", sortable: true },
    { key: 5, label: "单价", visible: true, width: 120, align: "center", sortable: false },
    { key: 6, label: "数量", visible: true, width: 80, align: "center", sortable: true },
    { key: 7, label: "金额", visible: true, width: 120, align: "center", sortable: true },
    { key: 8, label: "计费", visible: true, width: 80, align: "center", sortable: false },
    { key: 9, label: "产品档案状态", visible: true, width: 110, align: "center", sortable: false },
    { key: 10, label: "注册证号", visible: true, width: 180, align: "center", sortable: false },
    { key: 11, label: "注册证有效期", visible: true, width: 180, align: "center", sortable: false },
    { key: 12, label: "仓库", visible: true, width: 120, align: "center", sortable: false },
    { key: 13, label: "厂家", visible: true, width: 120, align: "center", sortable: false },
    { key: 14, label: "供应商", visible: true, width: 160, align: "center", sortable: false }
  ];
}

export default {
  name: "secondInventory",
  dicts: ['is_use_status'],
  mixins: [
    hisChargeItemTableColumnsMixin,
    createTableColumnSettingsMixin({
      createDefaultColumns: createDefaultSecondSummaryColumns,
      configKey: "inventory_second_summary_columns",
      tableRef: "invDetailTable"
    })
  ],
  components: {SelectMaterial,SelectWarehouse,SelectSupplier,RightToolbar,TableColumnSettingDialog},
  data() {
    return {
      hisChargeFlatRow: true,
      loading: true,
      activeName: 'first',
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      inventoryList: [],
      totalInfo:{
        totalQty: 0,
        totalAmt:0
      },
      title: "",
      open: false,
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
      form: {},
      rules: {
      },
      showZeroStock: false,
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "materialName", label: "产品名称" },
        { value: "materialSpeci", label: "规格" },
        { value: "materialModel", label: "型号" },
        { value: "hisChargeItemId", label: "收费项目ID" },
        { value: "warehouse", label: "仓库" }
      ],
      selectedRowKeys: [],
      tableHeight: 400,
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.warehouse.inventory.second.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["materialName", "materialSpeci", "materialModel", "hisChargeItemId", "warehouse"];
    },
    pageTotalQty() {
      return (this.inventoryList || []).reduce((s, r) => s + Number(r.materialQty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.inventoryList || []).reduce((s, r) => s + Number(r.materialAmt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    },
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.loadUserColumnConfig().finally(() => {
      this.getList();
    });
  },
  mounted() {
    listWarehouse().then((res) => {
      this.restaurants = res.rows;
    });
    this.$nextTick(() => {
      this.updateTableHeight();
      setTimeout(() => this.updateTableHeight(), 80);
    });
    window.addEventListener('resize', this.updateTableHeight);
  },
  activated() {
    this.$nextTick(() => this.updateTableHeight());
  },
  beforeDestroy() {
    this.clearToolbarMoreCloseTimer();
    window.removeEventListener('resize', this.updateTableHeight);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateTableHeight());
    }
  },
  methods: {
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        const h = Math.floor(panel.clientHeight);
        if (h > 120) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.invDetailTable && this.$refs.invDetailTable.doLayout) {
              this.$refs.invDetailTable.doLayout();
            }
          });
        }
      });
    },
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
      if (!set.has("warehouse")) target.warehouseId = null;
      if (!set.has("materialName")) target.materialName = null;
      if (!set.has("materialSpeci")) target.materialSpeci = null;
      if (!set.has("materialModel")) target.materialModel = null;
      if (!set.has("hisChargeItemId")) target.hisChargeItemId = null;
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    saveMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.saveDefaults === 'function') {
        bar.saveDefaults();
      }
    },
    clearToolbarMoreCloseTimer() {
      if (this.toolbarMoreCloseTimer) {
        clearTimeout(this.toolbarMoreCloseTimer);
        this.toolbarMoreCloseTimer = null;
      }
    },
    setToolbarMoreVisible(visible) {
      const sel = this.$refs.toolbarMoreSelect;
      if (!sel) return;
      if (sel.visible === visible) return;
      sel.visible = visible;
      if (!visible && typeof sel.blur === 'function') {
        sel.blur();
      }
    },
    onToolbarMoreEnter() {
      this.toolbarMoreHover = true;
      this.clearToolbarMoreCloseTimer();
      this.setToolbarMoreVisible(true);
    },
    onToolbarMoreLeave() {
      this.toolbarMoreHover = false;
      this.clearToolbarMoreCloseTimer();
      this.toolbarMoreCloseTimer = setTimeout(() => {
        if (!this.toolbarMoreHover) {
          this.setToolbarMoreVisible(false);
        }
      }, 280);
    },
    onToolbarMoreVisibleChange(visible) {
      if (!visible) {
        this.toolbarMoreHover = false;
      }
    },
    materialUseDictLabel(isUse) {
      if (isUse === undefined || isUse === null || isUse === '') return '--';
      const v = this.selectDictLabel && this.dict && this.dict.type && this.dict.type.is_use_status
        ? this.selectDictLabel(this.dict.type.is_use_status, String(isUse))
        : '';
      return v || '--';
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
    getList() {
      this.loading = true;
      listInventorySummary(this.buildListQueryParams()).then(response => {
        const rows = Array.isArray(response) ? response : (response.rows || []);
        this.inventoryList = rows.map((item, idx) => {
          const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
          return {
            ...item,
            _rowKey: `${pageBase + idx}_${item.id || ''}_${item.materialCode || ''}_${item.warehouseName || ''}`
          };
        });
        this.total = response.total != null ? response.total : (this.inventoryList || []).length;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0 };
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      }).catch(error => {
        console.error('汇总数据加载失败:', error);
        this.inventoryList = [];
        this.total = 0;
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
      });
    },
    getDetailRowKey(row) {
      return (row && row._rowKey) || (row && row.id) || '';
    },
    invDetailRowClassName({ row }) {
      const key = this.getDetailRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'inv-row-selected';
      }
      return '';
    },
    handleDetailRowDblclick(row) {
      const table = this.$refs.invDetailTable;
      if (!table || !row) return;
      const key = this.getDetailRowKey(row);
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || [];
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getDetailRowKey(r) === key)
      ));
      table.toggleRowSelection(row, !selected);
    },
    cancel() {
      this.open = false;
      this.reset();
    },
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
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.materialName = null;
      this.queryParams.materialSpeci = null;
      this.queryParams.materialModel = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.hisChargeItemId = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.isBilling = null;
      this.queryParams.materialIsUse = null;
      this.showZeroStock = false;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
      this.selectedRowKeys = (selection || []).map(row => this.getDetailRowKey(row))
    },
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
.app-container.first-inventory-page {
  padding-top: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  flex: 0 0 auto !important;
  gap: 12px !important;
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding: 4px 0 6px !important;
  min-height: 40px !important;
  overflow: visible !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 32px !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  margin-left: auto !important;
  padding: 0 4px !important;
  flex: 0 0 auto !important;
  overflow: visible !important;
  background: transparent !important;
}
.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}

.first-inventory-page .el-table th .cell {
  white-space: nowrap;
}

.first-inventory-page .inv-detail-main-table .el-table__header-wrapper th,
.first-inventory-page .inv-detail-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}

.inv-summary-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.inv-summary-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.inv-summary-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  height: 32px !important;
  overflow: visible !important;
}
.inv-summary-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.inv-summary-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
}
.inv-summary-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 160px !important;
}

.first-inventory-page .inv-detail-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body tr.inv-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body tr.inv-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
</style>

<style scoped>
.app-container {
  margin-top: 0;
  padding-top: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
}

.query-select-wrapper {
  width: 180px;
}

.more-search-dynamic-field {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  height: 32px;
}
.more-search-label {
  color: #606266;
  font-size: 12px;
  line-height: 32px;
  white-space: nowrap;
}

.ctk-query-top-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.ctk-more-search-bar--hidden {
  display: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}
.more-search-type {
  width: 160px;
  min-width: 160px;
  max-width: 160px;
}
.more-search-input--dynamic {
  width: 180px;
}

.query-row-second {
  margin-top: 0;
  margin-bottom: 0;
}

.query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding-bottom: 0;
}

.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 0;
  white-space: nowrap;
}

.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.ctk-query-actions {
  margin-left: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 138px;
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

.query-item-zero-stock {
  margin-right: 0;
  vertical-align: middle;
}
.query-item-zero-stock .el-button {
  min-width: 72px;
}

.form-fields-container {
  margin-bottom: 4px;
  margin-top: 0;
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
}

.ctk-list-toolbar.list-toolbar {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  flex: 0 0 auto;
  flex-wrap: nowrap !important;
  align-items: center !important;
}
.ctk-list-toolbar .list-toolbar-right {
  flex-wrap: nowrap !important;
  flex-shrink: 0;
}

.table-container {
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  min-height: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
  flex: 1 1 auto;
}

.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 4px 6px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 6px !important;
}

.table-container ::v-deep .el-table thead th.el-table__cell > .cell,
.table-container ::v-deep .el-table tbody td.el-table__cell > .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 23px;
  word-break: normal;
}

.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}

.table-container ::v-deep .el-table th.col-serial-center .cell,
.table-container ::v-deep .el-table td.col-serial-center .cell {
  text-align: center !important;
  justify-content: center;
}

.table-container ::v-deep .col-serial-center-text {
  display: block;
  width: 100%;
  text-align: center;
}
</style>
