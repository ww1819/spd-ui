<template>
  <div class="app-container list-page first-inventory-page yj-stmt-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable/>
              </div>
            </template>
            <template v-else-if="t === 'warehouseCategory'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouseCategory v-model="queryParams.warehouseCategoryId" />
              </div>
            </template>
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
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="起始时间"
                clearable
                class="query-date-start"
                default-time="00:00:00"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="截止时间"
                clearable
                class="query-date-end"
                default-time="23:59:59"
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
        class="yj-stmt-main-table"
        v-loading="loading"
        :data="inventoryList"
        :height="tableHeight"
        show-summary
        :summary-method="getTotalSummaries"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="80" align="center" header-align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="仓库ID" v-if="false" align="center" prop="warehouse_id" width="150" show-overflow-tooltip resizable />
        <el-table-column label="仓库编码" align="left" header-align="center" class-name="ctk-col-left" prop="warehouse_code" width="160" show-overflow-tooltip resizable sortable :sort-method="sortByWarehouseCode"/>
        <el-table-column label="仓库名称" align="left" header-align="center" class-name="ctk-col-left" prop="warehouse_name" width="160" show-overflow-tooltip resizable sortable :sort-method="sortByWarehouseName"/>
        <el-table-column label="库房分类ID" v-if="false" align="center" prop="storeroom_id" width="160" show-overflow-tooltip resizable/>
        <el-table-column label="库房分类编码" align="left" header-align="center" class-name="ctk-col-left" prop="warehouse_category_code" width="160" show-overflow-tooltip resizable/>
        <el-table-column label="库房分类" align="left" header-align="center" class-name="ctk-col-left" prop="warehouse_category_name" width="160" show-overflow-tooltip resizable/>
        <el-table-column label="期初数量" align="center" prop="qc_qty" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.qc_qty">{{ scope.row.qc_qty | formatCurrency}}</span>
            <span v-else>0.0</span>
          </template>
        </el-table-column>
        <el-table-column label="期初金额" align="center" prop="qc_amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.qc_amt">{{ scope.row.qc_amt | formatCurrency}}</span>
            <span v-else>0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="期初导入数量" align="center" prop="qc_import_qty" width="130" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.qc_import_qty">{{ scope.row.qc_import_qty | formatCurrency}}</span>
            <span v-else>0.0</span>
          </template>
        </el-table-column>
        <el-table-column label="期初导入金额" align="center" prop="qc_import_amt" width="130" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.qc_import_amt">{{ scope.row.qc_import_amt | formatCurrency}}</span>
            <span v-else>0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="入库数量" align="center" prop="rk_qty" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.rk_qty">{{ scope.row.rk_qty | formatCurrency}}</span>
            <span v-else>0.0</span>
          </template>
        </el-table-column>
        <el-table-column label="入库金额" align="center" prop="rk_amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.rk_amt">{{ scope.row.rk_amt | formatCurrency}}</span>
            <span v-else>0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="出库数量" align="center" prop="ck_qty" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.ck_qty">{{ scope.row.ck_qty | formatCurrency}}</span>
            <span v-else>0.0</span>
          </template>
        </el-table-column>
        <el-table-column label="出库金额" align="center" prop="ck_amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.ck_amt">{{ scope.row.ck_amt | formatCurrency}}</span>
            <span v-else>0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="调入数量" align="center" prop="dbr_qty" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.dbr_qty">{{ scope.row.dbr_qty | formatCurrency}}</span>
            <span v-else>0.0</span>
          </template>
        </el-table-column>
        <el-table-column label="调入金额" align="center" prop="dbr_amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.dbr_amt">{{ scope.row.dbr_amt | formatCurrency}}</span>
            <span v-else>0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="调出数量" align="center" prop="dbc_qty" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.dbc_qty">{{ scope.row.dbc_qty | formatCurrency}}</span>
            <span v-else>0.0</span>
          </template>
        </el-table-column>
        <el-table-column label="调出金额" align="center" prop="dbc_amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.dbc_amt">{{ scope.row.dbc_amt | formatCurrency}}</span>
            <span v-else>0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="盘点数量" align="center" prop="pd_qty" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.pd_qty">{{ scope.row.pd_qty | formatCurrency}}</span>
            <span v-else>0.0</span>
          </template>
        </el-table-column>
        <el-table-column label="盘点金额" align="center" prop="pd_amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.pd_amt">{{ scope.row.pd_amt | formatCurrency}}</span>
            <span v-else>0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="结存数量" align="center" prop="jc_qty" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.jc_qty">{{ scope.row.jc_qty | formatCurrency}}</span>
            <span v-else>0.0</span>
          </template>
        </el-table-column>
        <el-table-column label="结存金额" align="center" prop="jc_amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.jc_amt">{{ scope.row.jc_amt | formatCurrency}}</span>
            <span v-else>0.00</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
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
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import { parseTime } from "@/utils/ruoyi";
import { listWarehouse } from "@/api/foundation/warehouse";
import {selectWarehousePsiReport} from "@/api/warehouse/warehousePsiReport";
import formatCurrency from "../../../../utils/format-currency";

export default {
  name: "PurInventoryTable",
  computed: {
    formatCurrency() {
      return formatCurrency
    },
    moreSearchStorageKey() {
      return "spd.yj.statement.warehousePsi.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return [];
    }
  },
  dicts: ['bill_type'],
  components: {SelectWarehouse,WarehouseAutocomplete,RightToolbar,SelectWarehouseCategory},
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "仓库", value: "warehouse" },
        { label: "库房分类", value: "warehouseCategory" }
      ],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      tableHeight: 400,
      total: 0,
      inventoryList: [],
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        warehouseCategoryId: null
      }
    };
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateTableHeight());
    }
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
    window.removeEventListener('resize', this.updateTableHeight);
    this.clearToolbarMoreCloseTimer();
  },
  methods: {
    parseTime,
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        const h = Math.floor(panel.clientHeight);
        if (h > 120) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.reportTable && this.$refs.reportTable.doLayout) {
              this.$refs.reportTable.doLayout();
            }
          });
        }
      });
    },
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByWarehouseCode(a, b) {
      return this.sortByStr(a, b, r => r.warehouse_code || '');
    },
    sortByWarehouseName(a, b) {
      return this.sortByStr(a, b, r => r.warehouse_name || '');
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
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(column.property === 'materialQty' || column.property === 'materialAmt'){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            if(column.property === 'materialAmt') {
              sums[index] = '￥' + this.formatAmount(sums[index]);
            } else {
              sums[index] = this.formatSumByProp(sums[index], column.property);
            }
          } else {
            sums[index] = '';
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
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
      const queryParams = {
        ...this.queryParams
      };
      this.applyMoreSearchToQueryParams(queryParams);

      if (queryParams.beginDate && queryParams.beginDate.length === 10) {
        queryParams.beginDate = queryParams.beginDate + ' 00:00:00';
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
      selectWarehousePsiReport(queryParams).then(response => {
        this.inventoryList = response.rows || [];
        this.total = response.total || 0;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0, subTotalAmt: 0, subTotalQty: 0 };
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      }).catch(error => {
        console.error('查询进销存明细列表失败:', error);
        this.inventoryList = [];
        this.total = 0;
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
      return year + "-" + month + "-" + day + " 00:00:00";
    },
    getEndDate(){
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day + " 23:59:59";
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.warehouseId = null;
      this.queryParams.warehouseCategoryId = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
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
    moreSearchFieldClass(t) {
      if (['warehouse', 'warehouseCategory'].includes(t)) {
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
        warehouse: 'warehouseId',
        warehouseCategory: 'warehouseCategoryId'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange(val) {
      const allow = new Set(this.moreSearchOptions.map(o => o.value));
      const cleaned = (val || this.moreSearchTypes || []).filter(v => allow.has(v));
      if (cleaned.length !== (this.moreSearchTypes || []).length) {
        this.moreSearchTypes = cleaned;
      }
      this.applyMoreSearchToQueryParams(this.queryParams);
      this.$nextTick(() => this.updateTableHeight());
    },
    handleExport() {
      const queryParams = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(queryParams);
      this.download('warehouse/purInventory/export', queryParams, `pur_inventory_${new Date().getTime()}.xlsx`)
    },
  }
};
</script>

<style>
.app-container.first-inventory-page.yj-stmt-query {
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

.yj-stmt-query .pagination-wrapper {
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
.yj-stmt-query .pagination-wrapper .pagination-container {
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
.yj-stmt-query .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
}
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
}
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 160px !important;
}

.yj-stmt-query .yj-stmt-main-table .el-table__header-wrapper th,
.yj-stmt-query .yj-stmt-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.yj-stmt-query .yj-stmt-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.yj-stmt-query .yj-stmt-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
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

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-item-inline .el-form-item {
  margin-bottom: 0;
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
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-more-search {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
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

.table-container ::v-deep .el-table th.ctk-col-left .cell {
  text-align: center !important;
}
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
}
</style>
