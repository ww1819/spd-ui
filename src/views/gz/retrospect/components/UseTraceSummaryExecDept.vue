<template>
  <div class="gz-retrospect-table-panel">
    <div class="table-container" ref="tablePanel">
      <el-table
        ref="table"
        class="gz-retrospect-main-table"
        v-loading="loading"
        :data="summaryList"
        :height="tableHeight"
        :row-key="getSummaryRowKey"
        :row-class-name="gzRetrospectRowClassName"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleSummaryRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="col-serial-center" />
        <el-table-column label="序号" align="center" header-align="center" width="80" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="执行科室" align="left" header-align="center" class-name="ctk-col-left" prop="execDeptName" width="160" show-overflow-tooltip resizable/>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" prop="material.code" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortTraceMaterialCode"/>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="material.name" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortTraceMaterialName"/>
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" width="130" min-width="110" show-overflow-tooltip resizable sortable :sort-method="sortTraceSpeci">
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortTraceModel">
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="quantity" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortSummaryQuantity"/>
        <el-table-column label="金额" align="center" prop="amount" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortSummaryAmount">
          <template slot-scope="scope">
            <span v-if="scope.row.amount != null && scope.row.amount !== ''">{{ scope.row.amount | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="生产厂家" align="left" header-align="center" class-name="ctk-col-left" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商" align="left" header-align="center" class-name="ctk-col-left" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.supplierName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证号" align="left" header-align="center" class-name="ctk-col-left" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证有效期" align="left" header-align="center" class-name="ctk-col-left" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="集采" align="center" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span
              class="material-yn-btn"
              :class="isMaterialYesValue(scope.row.material && scope.row.material.isProcure) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
            >{{ isMaterialYesValue(scope.row.material && scope.row.material.isProcure) ? '是' : '否' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
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
import { listTraceSummaryExecDept } from "@/api/gz/traceability";
import { exportTraceSummaryExecDeptTable } from "../retrospectExport";
import retrospectSortMixin from "../retrospectSortMixin";

export default {
  name: "UseTraceSummaryExecDept",
  mixins: [retrospectSortMixin],
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      summaryList: [],
      total: 0,
      selectedRowKeys: [],
      tableHeight: 400
    };
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
    getSummaryRowKey(row) {
      return (row && row._rowKey) || '';
    },
    gzRetrospectRowClassName({ row }) {
      const key = this.getSummaryRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'gz-retrospect-row-selected';
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
    isMaterialYesValue(val) {
      if (val === null || val === undefined || val === '') return false;
      const s = String(val).trim();
      return s === '1' || s === 'true' || s === '是';
    },
    buildSummaryQuery() {
      const trimLeading = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const s = String(val).replace(/^\s+/, '');
        return s === '' ? null : s;
      };
      const p = this.queryParams;
      const q = {
        pageNum: p.pageNum || 1,
        pageSize: p.pageSize || 10,
        orderStatus: p.orderStatus != null ? p.orderStatus : 2,
        inHospitalCode: trimLeading(p.inHospitalCode),
        materialKeyword: trimLeading(p.materialKeyword),
        materialSpeci: trimLeading(p.materialSpeci),
        factoryId: p.factoryId || null,
        warehouseId: p.warehouseId || null,
        materialNo: trimLeading(p.materialNo),
        chargeCodeKeyword: trimLeading(p.chargeCodeKeyword),
        hospitalNumber: trimLeading(p.hospitalNumber),
        patientName: trimLeading(p.patientName),
        udiKeyword: trimLeading(p.udiKeyword),
        sunshineCodeKeyword: trimLeading(p.sunshineCodeKeyword),
        medicalNoKeyword: trimLeading(p.medicalNoKeyword),
        isBilling: p.isBilling || null,
        isProcure: p.isProcure || null,
        isMonitor: p.isMonitor || null,
        supplierId: p.supplierId || null,
        supplierKeyword: (!p.supplierId && p.supplierKeyword) ? trimLeading(p.supplierKeyword) : null
      };
      if (p.startDate) q.startDate = p.startDate;
      if (p.endDate) q.endDate = p.endDate;
      return q;
    },
    async exportTable() {
      this.loading = true;
      try {
        const result = await exportTraceSummaryExecDeptTable(this, this.queryParams);
        this.$modal.msgSuccess(`导出成功，共 ${result.rowCount} 条`);
      } catch (e) {
        const msg = (e && e.message) ? e.message : '导出失败，请稍后重试';
        this.$modal.msgError(msg);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    getList() {
      this.loading = true;
      listTraceSummaryExecDept(this.buildSummaryQuery()).then(response => {
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        this.summaryList = (response.rows || []).map((row, idx) => {
          if (row && !row._rowKey) {
            row._rowKey = `gz-retrospect-exec-${pageBase + idx}-${row.execDeptName || ''}-${(row.material && row.material.code) || ''}-${row.id || idx}`;
          }
          return row;
        });
        this.total = response.total || 0;
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
.gz-retrospect-table-panel {
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

.material-yn-btn {
  display: inline-block;
  min-width: 36px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  color: #fff;
  cursor: default;
  user-select: none;
  box-sizing: border-box;
}
.material-yn-btn--yes {
  background-color: #409EFF;
}
.material-yn-btn--no {
  background-color: #909399;
}
</style>
