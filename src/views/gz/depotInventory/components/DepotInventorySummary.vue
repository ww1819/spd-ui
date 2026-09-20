<template>
  <div class="gz-depot-table-panel">
    <div class="table-container" ref="tablePanel">
      <el-table
        ref="table"
        class="gz-depot-main-table"
        v-loading="loading"
        :data="summaryList"
        :height="tableHeight"
        :row-key="getSummaryRowKey"
        :row-class-name="gzDepotRowClassName"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleSummaryRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="col-serial-center" />
        <el-table-column type="index" label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortSummaryMaterialCode"/>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortSummaryMaterialName"/>
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
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" prop="materialSpeci" width="130" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortSummarySpeci"/>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" prop="materialModel" width="130" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortSummaryModel"/>
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortSummaryUnitName"/>
        <el-table-column label="单价" align="center" prop="unitPrice" width="130" show-overflow-tooltip resizable sortable :sort-method="sortSummaryUnitPrice">
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="totalQty" width="100" show-overflow-tooltip resizable sortable :sort-method="sortSummaryTotalQty"/>
        <el-table-column label="金额" align="center" prop="totalAmt" width="130" show-overflow-tooltip resizable sortable :sort-method="sortSummaryTotalAmt">
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmt">{{ scope.row.totalAmt | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库" align="left" header-align="center" class-name="ctk-col-left" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="供应商" align="left" header-align="center" class-name="ctk-col-left" prop="supplierName" width="160" show-overflow-tooltip resizable/>
        <el-table-column label="厂家" align="left" header-align="center" class-name="ctk-col-left" prop="factoryName" width="120" show-overflow-tooltip resizable/>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary" v-if="total > 0">
        <span class="summary-label">合计：</span>总数量: {{ calculateTotalQty }}，总金额: {{ calculateTotalAmt }}
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
import { listDepotInventory } from "@/api/gz/depotInventory";
import hisChargeItemTableColumnsMixin from "@/mixins/hisChargeItemTableColumns";
import depotInventorySortMixin from "../depotInventorySortMixin";
import { buildDepotInventoryQueryParams } from "../depotInventoryQuery";

export default {
  name: "DepotInventorySummary",
  mixins: [hisChargeItemTableColumnsMixin, depotInventorySortMixin],
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      hisChargeFlatRow: true,
      hisChargeColumnLabelOverrides: {
        code: '收费编码',
        name: '收费名称',
        speci: '收费规格',
        unit: '收费单位',
        price: '收费单价',
      },
      loading: true,
      summaryList: [],
      total: 0,
      selectedRowKeys: [],
      tableHeight: 400
    };
  },
  computed: {
    calculateTotalQty() {
      const totalQty = this.summaryList.reduce((sum, item) => {
        const qty = Number(item.totalQty) || 0;
        return sum + qty;
      }, 0);
      return this.formatQty(totalQty);
    },
    calculateTotalAmt() {
      const totalAmt = this.summaryList.reduce((sum, item) => {
        const amt = Number(item.totalAmt) || 0;
        return sum + amt;
      }, 0);
      return '¥' + this.formatAmount(totalAmt);
    }
  },
  watch: {
    queryParams: {
      handler(val, oldVal) {
        // 仅查询条件变化时重载；翻页字段变化不触发（汇总为前端聚合全量）
        if (!oldVal) {
          this.getList();
          return;
        }
        const ignore = ['pageNum', 'pageSize'];
        const keys = Object.keys(val || {});
        const changed = keys.some(k => {
          if (ignore.includes(k)) return false;
          return val[k] !== oldVal[k];
        });
        if (changed) this.getList();
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
    getSummaryRowKey(row) {
      return (row && row._rowKey) || '';
    },
    gzDepotRowClassName({ row }) {
      const key = this.getSummaryRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'gz-depot-row-selected';
      }
      return '';
    },
    handleSelectionChange(selection) {
      this.selectedRowKeys = (selection || []).map(row => this.getSummaryRowKey(row));
    },
    handleSummaryRowDblclick(row) {
      const table = this.$refs.table;
      if (!table || !row) return;
      const key = this.getSummaryRowKey(row);
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || [];
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getSummaryRowKey(r) === key)
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
    buildListParams() {
      return buildDepotInventoryQueryParams(this.queryParams, {
        pageNum: 1,
        pageSize: 10000,
      });
    },
    getList() {
      this.loading = true;
      listDepotInventory(this.buildListParams()).then(response => {
        const detailList = response.rows || [];
        const summaryMap = {};

        detailList.forEach(item => {
          const material = item.material || {};
          const materialId = item.materialId || material.id;
          const materialName = material.name || '';
          const materialCode = material.code || material.id || '';
          const materialSpeci = material.speci || '';
          const materialModel = material.model || '';
          const warehouseName = (item.warehouse && item.warehouse.name) || '';
          const supplierName = (item.supplier && item.supplier.name) || '';
          const factoryName = (material.fdFactory && material.fdFactory.factoryName) || '';
          const unitName = material.unitName || '';

          const key = `${materialId}_${warehouseName}_${supplierName}`;

          if (!summaryMap[key]) {
            summaryMap[key] = {
              materialId: materialId,
              materialCode: materialCode,
              materialName: materialName,
              materialSpeci: materialSpeci,
              materialModel: materialModel,
              unitName: unitName,
              unitPrice: item.unitPrice || 0,
              totalQty: 0,
              totalAmt: 0,
              warehouseName: warehouseName,
              supplierName: supplierName,
              factoryName: factoryName,
              hisChargeItemCode: material.hisChargeItemCode || material.hisChargeItemId || '',
              hisChargeItemName: material.hisChargeItemName || '',
              hisChargeItemSpeci: material.hisChargeItemSpeci || '',
              hisChargeItemUnit: material.hisChargeItemUnit || '',
              hisChargeItemPrice: material.hisChargeItemPrice,
            };
          }

          summaryMap[key].totalQty += Number(item.qty) || 0;
          summaryMap[key].totalAmt += Number(item.amt) || 0;
        });

        this.summaryList = Object.values(summaryMap).map((row, idx) => {
          row._rowKey = `gz-depot-sum-${idx}-${row.materialCode || ''}-${row.warehouseName || ''}-${row.supplierName || ''}`;
          return row;
        });
        this.total = this.summaryList.length;
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
        this.summaryList = [];
        this.total = 0;
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      });
    },
    syncTableScroll() {
      const headerWrapper = this.$el?.querySelector('.el-table__header-wrapper');
      const bodyWrapper = this.$el?.querySelector('.el-table__body-wrapper');

      if (!headerWrapper || !bodyWrapper) {
        return;
      }

      const syncScroll = (source, target) => {
        if (source.scrollLeft !== target.scrollLeft) {
          target.scrollLeft = source.scrollLeft;
        }
      };

      const syncBodyToHeader = () => {
        syncScroll(bodyWrapper, headerWrapper);
      };

      const syncHeaderToBody = () => {
        syncScroll(headerWrapper, bodyWrapper);
      };

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
.gz-depot-table-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.table-container {
  margin-top: 0;
  margin-bottom: 0;
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
  word-break: normal;
}
.table-container ::v-deep .el-table th.ctk-col-left .cell,
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
}
</style>
