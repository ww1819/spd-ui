<template>
  <div class="gz-depot-table-panel">
    <div class="table-container" ref="tablePanel">
      <el-table
        ref="table"
        class="gz-depot-main-table"
        v-loading="loading"
        :data="depotInventoryList"
        :height="tableHeight"
        :row-key="getDetailRowKey"
        :row-class-name="gzDepotRowClassName"
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
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" prop="material.code" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortDepotMaterialCode"/>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="material.name" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortDepotMaterialName"/>
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" width="130" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortDepotSpeci">
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" width="130" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortDepotModel">
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortDepotUnitName">
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable sortable :sort-method="sortDepotQty"/>
        <el-table-column label="单价" align="center" prop="unitPrice" width="130" show-overflow-tooltip resizable sortable :sort-method="sortDepotUnitPrice">
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="amt" width="130" show-overflow-tooltip resizable sortable :sort-method="sortDepotAmt">
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
        <el-table-column label="批号" align="left" header-align="center" class-name="ctk-col-left" prop="materialNo" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="院内码" align="left" header-align="center" class-name="ctk-col-left" prop="inHospitalCode" width="180" show-overflow-tooltip resizable/>
        <el-table-column label="批次号" align="left" header-align="center" class-name="ctk-col-left" prop="batchNo" width="150" show-overflow-tooltip resizable/>
        <el-table-column label="注册证号" align="left" header-align="center" class-name="ctk-col-left" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
        <el-table-column label="注册证有效期" align="left" header-align="center" class-name="ctk-col-left" prop="material.periodDate" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库" align="left" header-align="center" class-name="ctk-col-left" prop="warehouse.name" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="供应商" align="left" header-align="center" class-name="ctk-col-left" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
        <el-table-column label="UDI码" align="left" header-align="center" class-name="ctk-col-left" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.udiNo) || scope.row.masterBarcode || scope.row.secondaryBarcode || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库房分类" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="财务分类" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="阳光平台编码" align="left" header-align="center" class-name="ctk-col-left" width="150" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.countryNo) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库单号" align="left" header-align="center" class-name="ctk-col-left" prop="orderNo" width="180" show-overflow-tooltip resizable/>
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
        <el-table-column label="制单人" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.order && scope.row.order.createBy) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单日期" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.order && scope.row.order.orderDate">{{ parseTime(scope.row.order.orderDate, '{y}-{m}-{d}') }}</span>
            <span v-else-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="审核人" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.order && scope.row.order.updateBy) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核日期" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.order && scope.row.order.auditDate">{{ parseTime(scope.row.order.auditDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="医保编码" align="left" header-align="center" class-name="ctk-col-left" prop="material.medicalNo" width="150" show-overflow-tooltip resizable/>
        <el-table-column label="备注" align="left" header-align="center" class-name="ctk-col-left" width="150" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.order && scope.row.order.remark) || '--' }}</span>
          </template>
        </el-table-column>
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
import { listDepotInventory } from "@/api/gz/depotInventory";
import hisChargeItemTableColumnsMixin from "@/mixins/hisChargeItemTableColumns";
import depotInventorySortMixin from "../depotInventorySortMixin";
import { buildDepotInventoryQueryParams } from "../depotInventoryQuery";

export default {
  name: "DepotInventoryDetail",
  mixins: [hisChargeItemTableColumnsMixin, depotInventorySortMixin],
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      hisChargeColumnLabelOverrides: {
        code: '收费编码',
        name: '收费名称',
        speci: '收费规格',
        unit: '收费单位',
        price: '收费单价',
      },
      loading: true,
      depotInventoryList: [],
      total: 0,
      ids: [],
      selectedRowKeys: [],
      tableHeight: 400
    };
  },
  computed: {
    pageTotalQty() {
      return this.depotInventoryList.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.depotInventoryList || []).reduce((s, r) => s + Number(r.amt || 0), 0);
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
    gzDepotRowClassName({ row }) {
      const key = this.getDetailRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'gz-depot-row-selected';
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
    buildListParams() {
      return buildDepotInventoryQueryParams(this.queryParams);
    },
    getList() {
      this.loading = true;
      listDepotInventory(this.buildListParams()).then(response => {
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        this.depotInventoryList = (response.rows || []).map((row, idx) => {
          if (row && !row._rowKey) {
            row._rowKey = `gz-depot-${pageBase + idx}-${(row.material && row.material.code) || ''}-${row.batchNo || ''}-${row.id || idx}`;
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
        this.depotInventoryList = [];
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
