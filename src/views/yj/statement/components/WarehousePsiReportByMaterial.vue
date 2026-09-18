<template>
  <div class="app-container list-page first-inventory-page yj-stmt-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div class="more-search-dynamic-field more-search-field--text">
            <el-input
              v-model="queryParams.supplierKeyword"
              placeholder="供应商编码/名称/简码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
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
            <el-input
              v-else-if="t === 'materialSpeciLike'"
              v-model="queryParams.materialSpeciLike"
              clearable
              :placeholder="moreSearchPlaceholderFor(t)"
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="queryParams.materialNameLike"
              clearable
              :placeholder="moreSearchPlaceholderFor(t)"
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
            <el-form-item label="显示列" class="query-item-inline column-opts">
              <el-checkbox v-model="columnOpts.showUnitPrice" @change="onColumnOptChange('showUnitPrice')">单价</el-checkbox>
              <el-checkbox v-model="columnOpts.showBatchNumber" @change="onColumnOptChange('showBatchNumber')">批号</el-checkbox>
              <el-checkbox v-model="columnOpts.showExpiry" @change="onColumnOptChange('showExpiry')">效期</el-checkbox>
              <el-checkbox v-model="columnOpts.showBatchNo" @change="onColumnOptChange('showBatchNo')">批次</el-checkbox>
            </el-form-item>
            <el-form-item v-if="columnOpts.showBatchNumber" label="批号" prop="batchNumberKeyword" class="query-item-inline">
              <el-input
                v-model="queryParams.batchNumberKeyword"
                clearable
                placeholder="批号模糊"
                class="more-search-input"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item v-if="columnOpts.showBatchNo" label="批次" prop="batchNo" class="query-item-inline">
              <el-input
                v-model="queryParams.batchNo"
                clearable
                placeholder="批次模糊"
                class="more-search-input"
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
            filterable
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
        ref="reportTable"
        class="yj-stmt-main-table"
        v-loading="loading"
        :data="displayList"
        :height="tableHeight"
        border
        stripe
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="index" label="序号" width="70" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType" class="col-serial-center-text">{{ scope.row._summaryType === 'subtotal' ? '小计' : '合计' }}</span>
            <span v-else class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="left" header-align="center" prop="warehouse_code" width="120" show-overflow-tooltip resizable class-name="ctk-col-left"/>
        <el-table-column label="仓库名称" align="left" header-align="center" prop="warehouse_name" width="140" show-overflow-tooltip resizable class-name="ctk-col-left"/>
        <el-table-column label="产品编码" align="left" header-align="center" prop="material_code" width="140" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode" class-name="ctk-col-left"/>
        <el-table-column label="产品名称" align="left" header-align="center" prop="material_name" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" class-name="ctk-col-left"/>
        <el-table-column label="规格" align="left" header-align="center" prop="speci" width="120" show-overflow-tooltip resizable class-name="ctk-col-left"/>
        <el-table-column label="型号" align="left" header-align="center" prop="model" width="120" show-overflow-tooltip resizable class-name="ctk-col-left"/>
        <el-table-column label="单位" align="left" header-align="center" prop="unit_name" width="80" show-overflow-tooltip resizable class-name="ctk-col-left"/>
        <el-table-column v-if="columnOpts.showUnitPrice" label="单价" align="center" prop="unit_price" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.unit_price | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOpts.showBatchNumber" label="批号" align="left" header-align="center" prop="batch_number" width="140" show-overflow-tooltip resizable class-name="ctk-col-left">
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.batch_number || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOpts.showExpiry" label="效期" align="left" header-align="center" prop="expiry_date" width="120" show-overflow-tooltip resizable class-name="ctk-col-left">
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.expiry_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOpts.showBatchNo" label="批次" align="left" header-align="center" prop="batch_no" width="180" show-overflow-tooltip resizable class-name="ctk-col-left">
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.batch_no || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商编码" align="left" header-align="center" prop="supplier_code" width="120" show-overflow-tooltip resizable class-name="ctk-col-left"/>
        <el-table-column label="供应商名称" align="left" header-align="center" prop="supplier_name" width="160" show-overflow-tooltip resizable class-name="ctk-col-left"/>
        <el-table-column label="期初数量" align="center" prop="qc_qty" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.qc_qty | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="期初金额" align="center" prop="qc_amt" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.qc_amt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="期初导入数量" align="center" prop="qc_import_qty" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.qc_import_qty | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="期初导入金额" align="center" prop="qc_import_amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.qc_import_amt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库数量" align="center" prop="rk_qty" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.rk_qty | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库金额" align="center" prop="rk_amt" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.rk_amt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库数量" align="center" prop="ck_qty" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.ck_qty | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库金额" align="center" prop="ck_amt" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.ck_amt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调入数量" align="center" prop="dbr_qty" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.dbr_qty | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调入金额" align="center" prop="dbr_amt" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.dbr_amt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调出数量" align="center" prop="dbc_qty" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.dbc_qty | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调出金额" align="center" prop="dbc_amt" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.dbc_amt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盘点数量" align="center" prop="pd_qty" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.pd_qty | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盘点金额" align="center" prop="pd_amt" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.pd_amt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结存数量" align="center" prop="jc_qty" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.jc_qty | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结存金额" align="center" prop="jc_amt" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.jc_amt | formatCurrency }}</span>
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
import RightToolbar from "@/components/RightToolbar";
import { selectWarehousePsiReportByMaterial } from "@/api/warehouse/warehousePsiReport";

const PSI_SUM_FIELDS = [
  'qc_qty', 'qc_amt', 'qc_import_qty', 'qc_import_amt',
  'rk_qty', 'rk_amt', 'ck_qty', 'ck_amt',
  'dbr_qty', 'dbr_amt', 'dbc_qty', 'dbc_amt',
  'pd_qty', 'pd_amt', 'jc_qty', 'jc_amt'
]

export default {
  name: "WarehousePsiReportByMaterial",
  components: { SelectWarehouse, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      tableHeight: 400,
      moreSearchOptions: [
        { label: "仓库", value: "warehouse" },
        { label: "耗材", value: "materialNameLike" },
        { label: "规格", value: "materialSpeciLike" }
      ],
      total: 0,
      inventoryList: [],
      grandTotalSums: {},
      columnOpts: {
        showUnitPrice: false,
        showBatchNumber: false,
        showExpiry: false,
        showBatchNo: false
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        materialNameLike: null,
        materialSpeciLike: null,
        supplierKeyword: null,
        batchNumberKeyword: null,
        batchNo: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        params: {
          showUnitPrice: '0',
          showBatchNumber: '0',
          showExpiry: '0',
          showBatchNo: '0'
        }
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.yj.statement.warehousePsiByMaterial.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return [];
    },
    displayList() {
      if (!this.inventoryList || !this.inventoryList.length) {
        return []
      }
      return [
        ...this.inventoryList,
        this.buildSummaryRow('subtotal', '小计', this.sumRows(this.inventoryList)),
        this.buildSummaryRow('total', '合计', this.grandTotalSums)
      ]
    }
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
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
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
      }, 120);
    },
    onToolbarMoreVisibleChange(visible) {
      if (!visible) {
        this.toolbarMoreHover = false;
      }
    },
    moreSearchPlaceholderFor(t) {
      const map = {
        materialNameLike: "编码/名称/简码",
        materialSpeciLike: "规格模糊"
      };
      return map[t] || "请输入";
    },
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortSummaryOrder(a, b) {
      const sa = a && a._summaryType;
      const sb = b && b._summaryType;
      if (sa && sb) {
        if (sa === 'subtotal' && sb === 'total') return -1;
        if (sa === 'total' && sb === 'subtotal') return 1;
        return 0;
      }
      if (sa) return 1;
      if (sb) return -1;
      return null;
    },
    sortByMaterialCode(a, b) {
      const order = this.sortSummaryOrder(a, b);
      if (order !== null) return order;
      return this.sortByStr(a, b, r => r.material_code || '');
    },
    sortByMaterialName(a, b) {
      const order = this.sortSummaryOrder(a, b);
      if (order !== null) return order;
      return this.sortByStr(a, b, r => r.material_name || '');
    },
    flag(v) {
      return v ? '1' : '0'
    },
    syncShowFlagsToParams() {
      if (!this.queryParams.params) {
        this.$set(this.queryParams, 'params', {})
      }
      const p = this.queryParams.params
      p.showUnitPrice = this.flag(this.columnOpts.showUnitPrice)
      p.showBatchNumber = this.flag(this.columnOpts.showBatchNumber)
      p.showExpiry = this.flag(this.columnOpts.showExpiry)
      p.showBatchNo = this.flag(this.columnOpts.showBatchNo)
    },
    onColumnOptChange(key) {
      if (key === 'showBatchNumber' && !this.columnOpts.showBatchNumber) {
        this.queryParams.batchNumberKeyword = null
      }
      if (key === 'showBatchNo' && !this.columnOpts.showBatchNo) {
        this.queryParams.batchNo = null
      }
      this.handleQuery()
    },
    sumRows(rows) {
      const sums = {}
      PSI_SUM_FIELDS.forEach((k) => { sums[k] = 0 })
      ;(rows || []).forEach((row) => {
        PSI_SUM_FIELDS.forEach((k) => {
          const n = Number(row[k])
          sums[k] += Number.isFinite(n) ? n : 0
        })
      })
      return sums
    },
    buildSummaryRow(type, label, sums) {
      const row = {
        _summaryType: type,
        warehouse_code: '',
        warehouse_name: label,
        material_code: '',
        material_name: '',
        speci: '',
        model: '',
        unit_name: '',
        unit_price: '',
        batch_number: '',
        expiry_date: '',
        batch_no: '',
        supplier_code: '',
        supplier_name: ''
      }
      PSI_SUM_FIELDS.forEach((k) => {
        const n = Number(sums && sums[k])
        row[k] = Number.isFinite(n) ? n : 0
      })
      return row
    },
    tableRowClassName({ row }) {
      if (row && row._summaryType === 'subtotal') return 'psi-summary-subtotal'
      if (row && row._summaryType === 'total') return 'psi-summary-total'
      return ''
    },
    getList() {
      this.loading = true;
      this.syncShowFlagsToParams();
      const src = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(src);
      const queryParams = {
        pageNum: src.pageNum,
        pageSize: src.pageSize,
        warehouseId: src.warehouseId,
        materialNameLike: src.materialNameLike || undefined,
        materialSpeciLike: src.materialSpeciLike || undefined,
        supplierKeyword: src.supplierKeyword || undefined,
        beginDate: src.beginDate || undefined,
        endDate: src.endDate || undefined,
        showUnitPrice: this.flag(this.columnOpts.showUnitPrice),
        showBatchNumber: this.flag(this.columnOpts.showBatchNumber),
        showExpiry: this.flag(this.columnOpts.showExpiry),
        showBatchNo: this.flag(this.columnOpts.showBatchNo),
        params: {
          showUnitPrice: this.flag(this.columnOpts.showUnitPrice),
          showBatchNumber: this.flag(this.columnOpts.showBatchNumber),
          showExpiry: this.flag(this.columnOpts.showExpiry),
          showBatchNo: this.flag(this.columnOpts.showBatchNo)
        }
      };
      if (queryParams.beginDate && String(queryParams.beginDate).length === 10) {
        queryParams.beginDate = queryParams.beginDate + ' 00:00:00';
      }
      if (queryParams.endDate && String(queryParams.endDate).length === 10) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      if (this.columnOpts.showBatchNumber && this.queryParams.batchNumberKeyword) {
        queryParams.batchNumberKeyword = this.queryParams.batchNumberKeyword;
      }
      if (this.columnOpts.showBatchNo && this.queryParams.batchNo) {
        queryParams.batchNo = this.queryParams.batchNo;
      }
      selectWarehousePsiReportByMaterial(queryParams).then(response => {
        const rows = (response && (response.rows || response.data)) || [];
        this.inventoryList = (Array.isArray(rows) ? rows : []).map((row) => this.normalizePsiRow(row));
        this.total = (response && response.total) != null ? response.total : this.inventoryList.length;
        const params = response && response.totalInfo && response.totalInfo.params
        this.grandTotalSums = (params && params.psiSums) || this.sumRows(this.inventoryList)
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      }).catch(() => {
        this.inventoryList = [];
        this.grandTotalSums = {};
        this.total = 0;
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      });
    },
    normalizePsiRow(row) {
      if (!row || typeof row !== 'object') return row
      const pick = (...keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k]
        }
        return null
      }
      return {
        ...row,
        unit_price: pick('unit_price', 'unitPrice', 'UNIT_PRICE'),
        batch_number: pick('batch_number', 'batchNumber', 'BATCH_NUMBER'),
        expiry_date: pick('expiry_date', 'expiryDate', 'EXPIRY_DATE'),
        batch_no: pick('batch_no', 'batchNo', 'BATCH_NO')
      }
    },
    getStatDate() {
      const myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      return this.formatDate(myDate) + " 00:00:00";
    },
    getEndDate() {
      return this.formatDate(new Date()) + " 23:59:59";
    },
    formatDate(myDate) {
      const year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.warehouseId = null;
      this.queryParams.materialNameLike = null;
      this.queryParams.materialSpeciLike = null;
      this.queryParams.supplierKeyword = null;
      this.queryParams.batchNumberKeyword = null;
      this.queryParams.batchNo = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.columnOpts = {
        showUnitPrice: false,
        showBatchNumber: false,
        showExpiry: false,
        showBatchNo: false
      };
      this.queryParams.params = {
        showUnitPrice: '0',
        showBatchNumber: '0',
        showExpiry: '0',
        showBatchNo: '0'
      };
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass(t) {
      if (t === 'warehouse') {
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
        materialNameLike: 'materialNameLike',
        materialSpeciLike: 'materialSpeciLike'
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
    handleExport() {
      this.$modal.msgWarning('导出功能暂未开放，请先搜索后使用页面数据');
    }
  }
};
</script>

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

.more-search-input--dynamic {
  width: 180px;
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

.query-row-second .el-form-item {
  white-space: nowrap;
  margin-bottom: 0;
}

.column-opts ::v-deep .el-checkbox {
  margin-right: 12px;
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

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
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

.table-container ::v-deep .el-table th.el-table__cell,
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
  justify-content: center !important;
}

.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
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

.table-container ::v-deep .psi-summary-subtotal td {
  background: #fafafa !important;
  font-weight: 600;
}

.table-container ::v-deep .psi-summary-total td {
  background: #fff7e6 !important;
  font-weight: 700;
  color: #cf1322;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  flex: 0 0 auto;
  gap: 12px;
  margin-top: 4px;
  margin-bottom: 0;
  padding: 4px 0 6px;
  min-height: 40px;
  overflow: visible;
}

.pagination-wrapper .pagination-container {
  position: relative;
  height: auto;
  min-height: 32px;
  margin-top: 0;
  margin-bottom: 0;
  margin-left: auto;
  padding: 0 4px;
  flex: 0 0 auto;
  overflow: visible;
  background: transparent;
}

.pagination-wrapper .pagination-container .el-pagination {
  position: relative;
  right: auto;
  padding: 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}
</style>

<style>
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 148px !important;
  min-width: 148px !important;
  max-width: 148px !important;
}
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 148px !important;
  max-width: 148px !important;
}
.yj-stmt-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 148px !important;
}
</style>
