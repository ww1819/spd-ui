<template>
  <div class="app-container list-page first-inventory-page inv-psi-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="(t === 'warehouse' || t === 'materialName') ? 'more-search-field--select' : 'more-search-field--text'"
          >
            <template v-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable/>
              </div>
            </template>
            <template v-else-if="t === 'materialName'">
              <div class="query-select-wrapper more-search-select-wrap">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
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
            <el-form-item prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="单据类型"
                         multiple collapse-tags clearable class="more-search-select-wrap">
                <el-option label="入库单" value="101"/>
                <el-option label="出库单" value="201"/>
                <el-option label="退库单" value="401"/>
                <el-option label="退货单" value="301"/>
                <el-option label="调拨单" value="501"/>
              </el-select>
            </el-form-item>
            <el-form-item prop="supplierKeyword" class="query-item-inline">
              <el-input
                v-model="queryParams.supplierKeyword"
                placeholder="供应商编码/名称"
                clearable
                class="more-search-input more-search-input--dynamic"
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
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
    <el-table
      ref="invDetailTable"
      class="inv-detail-main-table"
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
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (Number(queryParams.pageNum) - 1) * Number(queryParams.pageSize) + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="产品编码" align="center" prop="materialCode" width="100" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column label="产品名称" align="center" prop="materialName" width="160" min-width="120" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" min-width="90" show-overflow-tooltip resizable/>
      <el-table-column label="类型" align="center" prop="billType" width="100" min-width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.billType"/>
        </template>
      </el-table-column>
      <el-table-column label="业务单号" align="center" prop="billNo" width="180" min-width="100" show-overflow-tooltip resizable />
      <el-table-column label="业务日期" align="center" prop="billDate" width="180" min-width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="100" min-width="90" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" min-width="70" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="price" width="120" min-width="90" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price != null && scope.row.price !== undefined && scope.row.price !== '' && Number(scope.row.price) !== 0">{{ Number(scope.row.price) | formatCurrency}}</span>
          <span v-else-if="scope.row.unitPrice != null && scope.row.unitPrice !== undefined && scope.row.unitPrice !== '' && Number(scope.row.unitPrice) !== 0">{{ Number(scope.row.unitPrice) | formatPrice }}</span>
          <span v-else-if="scope.row.materialAmt != null && scope.row.materialQty != null && Number(scope.row.materialQty) !== 0">
            {{ (Number(scope.row.materialAmt) / Number(scope.row.materialQty)) | formatCurrency}}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="80" min-width="70" show-overflow-tooltip resizable/>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" min-width="90" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="厂家" align="center" prop="factoryName" width="120" min-width="90" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column label="科室" align="center" prop="departmentName" width="160" min-width="90" show-overflow-tooltip resizable/>

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
import { listPurInventory } from "@/api/warehouse/purInventory";
import { exportWarehousePsiDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "thirdInventory",
  dicts: ['bill_type'],
  components: {SelectMaterial,SelectWarehouse,WarehouseAutocomplete,MaterialAutocomplete,RightToolbar},
  data() {
    return {
      loading: true,
      activeName: 'first',
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      inventoryList: [],
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        materialId: null,
        warehouseId: null,
        materialName: null,
        materialSpeciLike: null,
        materialModelLike: null,
        supplierKeyword: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        billType: null
      },
      form: {},
      rules: {
      },
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "billNo", label: "单号" },
        { value: "warehouse", label: "仓库" },
        { value: "materialName", label: "耗材" },
        { value: "materialSpeciLike", label: "规格" },
        { value: "materialModelLike", label: "型号" }
      ],
      selectedRowKeys: [],
      tableHeight: 400,
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.warehouse.inventory.third.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["billNo", "warehouse", "materialName", "materialSpeciLike", "materialModelLike"];
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
    this.getList();
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
    getList() {
      this.loading = true;
      const queryParams = this.buildPurInventoryQueryParams();
      listPurInventory(queryParams).then(response => {
        const rows = response.rows || [];
        this.inventoryList = rows.map((item, idx) => {
          const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
          return {
            ...item,
            _rowKey: `${pageBase + idx}_${item.id || ''}_${item.billNo || ''}_${item.materialCode || ''}`
          };
        });
        this.total = response.total;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0, subTotalAmt: 0, subTotalQty: 0 };
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      });
    },
    getStatDate(){
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
    },
    getEndDate(){
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
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
      this.queryParams.warehouseId = null;
      this.queryParams.materialName = null;
      this.queryParams.materialSpeciLike = null;
      this.queryParams.materialModelLike = null;
      this.queryParams.supplierKeyword = null;
      this.queryParams.billNo = null;
      this.queryParams.billType = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.selectedRowKeys = (selection || []).map(row => this.getDetailRowKey(row));
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
    moreSearchPlaceholderFor(t) {
      const map = {
        billNo: "单号",
        materialSpeciLike: "规格(模糊)",
        materialModelLike: "型号(模糊)"
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
      if (!set.has("billNo")) target.billNo = null;
      if (!set.has("warehouse")) target.warehouseId = null;
      if (!set.has("materialName")) target.materialName = null;
      if (!set.has("materialSpeciLike")) target.materialSpeciLike = null;
      if (!set.has("materialModelLike")) target.materialModelLike = null;
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
    buildPurInventoryQueryParams() {
      const queryParams = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(queryParams);
      let billTypeStr = null;
      if (Array.isArray(queryParams.billType) && queryParams.billType.length > 0) {
        billTypeStr = queryParams.billType.join(',');
      }
      delete queryParams.billType;
      if (billTypeStr) {
        queryParams.billTypeStr = billTypeStr;
      }
      if (queryParams.endDate && queryParams.endDate.length === 10) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      if (queryParams.beginDate === '') {
        queryParams.beginDate = null;
      }
      if (queryParams.endDate === '') {
        queryParams.endDate = null;
      }
      return queryParams;
    },
    async handleExport() {
      const base = this.buildPurInventoryQueryParams();
      const requestParams = { ...base, pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await listPurInventory(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning('暂无数据可导出');
          return;
        }
        const billOpts = this.dict.type.bill_type || [];
        const resolveBillType = (v) => {
          if (v == null || v === '') return '';
          const hit = billOpts.find((d) => String(d.value) === String(v));
          return hit ? hit.label : String(v);
        };
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const filterLines = [
          `仓库：${this.queryParams.warehouseId || '全部'}；耗材：${this.queryParams.materialName || '全部'}；规格：${this.queryParams.materialSpeciLike || '全部'}；型号：${this.queryParams.materialModelLike || '全部'}`,
          `供应商：${this.queryParams.supplierKeyword || '全部'}；单号：${this.queryParams.billNo || '全部'}；单据类型：${(Array.isArray(this.queryParams.billType) && this.queryParams.billType.length > 0) ? this.queryParams.billType.map(v => resolveBillType(v)).join('、') : '全部'}`,
        ];
        await exportWarehousePsiDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: (this.queryParams.endDate && String(this.queryParams.endDate).slice(0, 10)) || this.queryParams.beginDate || '',
          fileName: `进销存明细表${dateStr}.xlsx`,
          resolveBillType,
          filterLines,
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

.inv-psi-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.inv-psi-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.inv-psi-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 148px !important;
  min-width: 148px !important;
  max-width: 148px !important;
}
.inv-psi-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.inv-psi-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 148px !important;
  max-width: 148px !important;
}
.inv-psi-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 148px !important;
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
  width: 148px;
  min-width: 148px;
  max-width: 148px;
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
</style>
