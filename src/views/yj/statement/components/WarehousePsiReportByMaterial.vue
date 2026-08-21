<template>
  <div class="app-container list-page first-inventory-page">
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
              placeholder="规格模糊"
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'supplierKeyword'"
              v-model="queryParams.supplierKeyword"
              clearable
              placeholder="编码/名称/简码"
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="queryParams.materialNameLike"
              clearable
              placeholder="编码/名称/简码"
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
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="handleExport">导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="displayList"
        height="55vh"
        border
        stripe
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="index" label="序号" width="70" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">{{ scope.row._summaryType === 'subtotal' ? '小计' : '合计' }}</span>
            <span v-else>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="center" prop="warehouse_code" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="仓库名称" align="center" prop="warehouse_name" width="140" show-overflow-tooltip resizable/>
        <el-table-column label="耗材编码" align="center" prop="material_code" width="140" show-overflow-tooltip resizable/>
        <el-table-column label="耗材名称" align="center" prop="material_name" min-width="160" show-overflow-tooltip resizable/>
        <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="单位" align="center" prop="unit_name" width="80" show-overflow-tooltip resizable/>
        <el-table-column v-if="columnOpts.showUnitPrice" label="单价" align="center" prop="unit_price" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.unit_price | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOpts.showBatchNumber" label="批号" align="center" prop="batch_number" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.batch_number || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOpts.showExpiry" label="效期" align="center" prop="expiry_date" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.expiry_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOpts.showBatchNo" label="批次" align="center" prop="batch_no" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.batch_no || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商编码" align="center" prop="supplier_code" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="供应商名称" align="center" prop="supplier_name" width="160" show-overflow-tooltip resizable/>
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

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import RightToolbar from "@/components/RightToolbar";
import Pagination from "@/components/Pagination";
import { selectWarehousePsiReportByMaterial } from "@/api/warehouse/warehousePsiReport";

const PSI_SUM_FIELDS = [
  'qc_qty', 'qc_amt', 'qc_import_qty', 'qc_import_amt',
  'rk_qty', 'rk_amt', 'ck_qty', 'ck_amt',
  'dbr_qty', 'dbr_amt', 'dbc_qty', 'dbc_amt',
  'pd_qty', 'pd_amt', 'jc_qty', 'jc_amt'
]

export default {
  name: "WarehousePsiReportByMaterial",
  components: { SelectWarehouse, RightToolbar, Pagination },
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "仓库", value: "warehouse" },
        { label: "耗材", value: "materialNameLike" },
        { label: "规格", value: "materialSpeciLike" },
        { label: "供应商", value: "supplierKeyword" }
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
        // 走 BaseEntity.params，保证 Spring 一定能绑定（顶栏 show* 字段在未重编译时会丢）
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
      return this.moreSearchOptions.map(o => o.value);
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
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
  },
  methods: {
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
        // 顶栏参数（Controller @RequestParam 显式接收）
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
        // 兼容 HashMap 大小写键名
        this.inventoryList = (Array.isArray(rows) ? rows : []).map((row) => this.normalizePsiRow(row));
        this.total = (response && response.total) != null ? response.total : this.inventoryList.length;
        const params = response && response.totalInfo && response.totalInfo.params
        this.grandTotalSums = (params && params.psiSums) || this.sumRows(this.inventoryList)
        this.loading = false;
      }).catch(() => {
        this.inventoryList = [];
        this.grandTotalSums = {};
        this.total = 0;
        this.loading = false;
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
      return this.formatDate(myDate);
    },
    getEndDate() {
      return this.formatDate(new Date());
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
        materialSpeciLike: 'materialSpeciLike',
        supplierKeyword: 'supplierKeyword'
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

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 2px;
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
.list-query-panel {
  margin-top: -20px;
}

.table-container {
  margin-top: 5px;
  overflow: visible;
  width: calc(100% + 40px);
  margin-left: -20px;
  margin-right: -20px;
  position: relative;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 8px;
}

.table-container ::v-deep .el-table th.el-table__cell,
.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
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
</style>
