<template>
  <div class="gz-dep-table-panel">
    <div class="table-container" ref="tablePanel">
      <el-table
        ref="table"
        class="gz-dep-main-table"
        v-loading="loading"
        :data="gzDepInventoryList"
        :height="tableHeight"
        :row-key="getDetailRowKey"
        :row-class-name="gzDepRowClassName"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleDetailRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="col-serial-center" />
        <el-table-column label="序号" align="center" header-align="center" width="80" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" prop="material.code" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode"/>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="material.name" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName"/>
        <el-table-column
          v-for="col in hisChargeItemColumnDefs"
          :key="'his-charge-' + col.key"
          :label="col.label"
          :width="col.width"
          align="left"
          header-align="center"
          class-name="ctk-col-left"
          show-overflow-tooltip
          resizable
        >
          <template slot-scope="scope">
            <span>{{ col.text(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" prop="material.speci" width="120" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci"/>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" prop="material.model" width="120" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByModel"/>
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByUnitName">
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByQty"/>
        <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice">
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmt">
          <template slot-scope="scope">
            <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="生产日期" align="left" header-align="center" class-name="ctk-col-left" prop="materialDate" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" align="left" header-align="center" class-name="ctk-col-left" prop="endTime" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" align="left" header-align="center" class-name="ctk-col-left" prop="materialNo" width="150" show-overflow-tooltip resizable/>
        <el-table-column label="院内码" align="left" header-align="center" class-name="ctk-col-left" prop="inHospitalCode" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByInHospitalCode"/>
        <el-table-column label="主条码" align="left" header-align="center" class-name="ctk-col-left" prop="masterBarcode" width="180" show-overflow-tooltip resizable/>
        <el-table-column label="辅条码" align="left" header-align="center" class-name="ctk-col-left" prop="secondaryBarcode" width="150" show-overflow-tooltip resizable/>
        <el-table-column label="科室" align="left" header-align="center" class-name="ctk-col-left" prop="department.name" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="仓库" align="left" header-align="center" class-name="ctk-col-left" prop="warehouse.name" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="批次" align="left" header-align="center" class-name="ctk-col-left" prop="batchNo" width="150" show-overflow-tooltip resizable/>
        <el-table-column label="生产厂家" align="left" header-align="center" class-name="ctk-col-left" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商" align="left" header-align="center" class-name="ctk-col-left" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库单号" align="left" header-align="center" class-name="ctk-col-left" prop="shipmentNo" width="180" show-overflow-tooltip resizable/>
        <el-table-column label="制单人" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.createBy || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单日期" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="审核人" align="left" header-align="center" class-name="ctk-col-left" prop="auditBy" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="审核日期" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="left" header-align="center" class-name="ctk-col-left" prop="remark" width="200" show-overflow-tooltip resizable/>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary" v-if="total > 0">
        <span class="summary-label">合计：</span>当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <div class="pagination-container" v-show="total > 0">
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
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory";
import hisChargeItemTableColumnsMixin from "@/mixins/hisChargeItemTableColumns";

export default {
  name: "GzDepInventoryDetail",
  mixins: [hisChargeItemTableColumnsMixin],
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      gzDepInventoryList: [],
      total: 0,
      ids: [],
      selectedRowKeys: [],
      tableHeight: 400
    };
  },
  computed: {
    pageTotalQty() {
      return (this.gzDepInventoryList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.gzDepInventoryList || []).reduce((s, r) => s + Number(r.amt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    }
  },
  watch: {
    queryParams: {
      handler() {
        this.getList();
      },
      deep: true
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    this.$nextTick(() => {
      this.syncTableScroll();
      this.updateTableHeight();
      setTimeout(() => this.updateTableHeight(), 80);
    });
    window.addEventListener('resize', this.updateTableHeight);
  },
  updated() {
    this.$nextTick(() => {
      this.syncTableScroll();
      if (this.$refs.table) {
        this.$refs.table.doLayout();
      }
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
    if (this._headerScrollbarCleanup) {
      this._headerScrollbarCleanup();
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
            if (this.$refs.table && this.$refs.table.doLayout) {
              this.$refs.table.doLayout();
            }
          });
        }
      });
    },
    getDetailRowKey(row) {
      return (row && row._rowKey) || '';
    },
    gzDepRowClassName({ row }) {
      const key = this.getDetailRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'gz-dep-row-selected';
      }
      return '';
    },
    handleDetailRowDblclick(row) {
      const table = this.$refs.table;
      if (!table || !row) return;
      const key = this.getDetailRowKey(row);
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || [];
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getDetailRowKey(r) === key)
      ));
      table.toggleRowSelection(row, !selected);
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
    },
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByNum(a, b, getVal) {
      const va = Number(getVal(a));
      const vb = Number(getVal(b));
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortByMaterialCode(a, b) {
      return this.sortByStr(a, b, r => (r.material && r.material.code) || '');
    },
    sortByMaterialName(a, b) {
      return this.sortByStr(a, b, r => (r.material && r.material.name) || '');
    },
    sortBySpeci(a, b) {
      return this.sortByStr(a, b, r => (r.material && r.material.speci) || '');
    },
    sortByModel(a, b) {
      return this.sortByStr(a, b, r => (r.material && r.material.model) || '');
    },
    sortByUnitName(a, b) {
      return this.sortByStr(a, b, r => (r.material && r.material.fdUnit && r.material.fdUnit.unitName) || '');
    },
    sortByQty(a, b) {
      return this.sortByNum(a, b, r => r.qty);
    },
    sortByUnitPrice(a, b) {
      return this.sortByNum(a, b, r => r.unitPrice);
    },
    sortByAmt(a, b) {
      return this.sortByNum(a, b, r => r.amt);
    },
    sortByInHospitalCode(a, b) {
      return this.sortByStr(a, b, r => r.inHospitalCode || '');
    },
    buildListQuery() {
      const params = { ...this.queryParams };
      const kw = params.materialKeyword != null ? String(params.materialKeyword).trim() : '';
      params.materialKeyword = kw || null;
      const code = params.inHospitalCode != null ? String(params.inHospitalCode).trim() : '';
      params.inHospitalCode = code || null;
      const master = params.masterBarcode != null ? String(params.masterBarcode).trim() : '';
      params.masterBarcode = master || null;
      const secondary = params.secondaryBarcode != null ? String(params.secondaryBarcode).trim() : '';
      params.secondaryBarcode = secondary || null;
      return params;
    },
    getList() {
      this.loading = true;
      listGzDepInventory(this.buildListQuery()).then(response => {
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        this.gzDepInventoryList = (response.rows || []).map((row, idx) => {
          if (row && !row._rowKey) {
            row._rowKey = `gz-dep-${pageBase + idx}-${(row.material && row.material.code) || ''}-${row.inHospitalCode || ''}-${row.id || idx}`;
          }
          return row;
        });
        this.total = response.total;
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => {
          this.syncTableScroll();
          this.updateTableHeight();
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      }).catch(() => {
        this.gzDepInventoryList = [];
        this.total = 0;
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      });
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.selectedRowKeys = (selection || []).map(row => this.getDetailRowKey(row));
      this.$emit('selection-change', selection);
    },
    syncTableScroll() {
      const headerWrapper = this.$el?.querySelector('.el-table__header-wrapper');
      const bodyWrapper = this.$el?.querySelector('.el-table__body-wrapper');
      if (!headerWrapper || !bodyWrapper) return;

      const syncScroll = (source, target) => {
        if (source.scrollLeft !== target.scrollLeft) {
          target.scrollLeft = source.scrollLeft;
        }
      };
      const syncBodyToHeader = () => syncScroll(bodyWrapper, headerWrapper);
      const syncHeaderToBody = () => syncScroll(headerWrapper, bodyWrapper);

      if (this._syncBodyToHeader) {
        bodyWrapper.removeEventListener('scroll', this._syncBodyToHeader);
      }
      if (this._syncHeaderToBody) {
        headerWrapper.removeEventListener('scroll', this._syncHeaderToBody);
      }
      this._syncBodyToHeader = syncBodyToHeader;
      this._syncHeaderToBody = syncHeaderToBody;
      bodyWrapper.addEventListener('scroll', syncBodyToHeader, { passive: true });
      headerWrapper.addEventListener('scroll', syncHeaderToBody, { passive: true });
      this._headerScrollbarCleanup = () => {
        if (this._syncBodyToHeader) {
          bodyWrapper?.removeEventListener('scroll', this._syncBodyToHeader);
        }
        if (this._syncHeaderToBody) {
          headerWrapper?.removeEventListener('scroll', this._syncHeaderToBody);
        }
      };
    }
  }
};
</script>

<style scoped>
.gz-dep-table-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}
.table-container {
  margin: 0;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  min-height: 0;
  position: relative;
  flex: 1 1 auto;
}
.table-container ::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
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
  background-clip: padding-box;
  border: 2px solid transparent;
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
}
.table-container ::v-deep .el-table th.ctk-col-left .cell,
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
}
</style>
