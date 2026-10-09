<template>
  <div class="gz-retrospect-table-panel">
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
        ref="table"
        class="gz-retrospect-main-table"
        :key="'gz-trace-apply-table-' + tableColumnEpoch"
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
        <template v-for="item in tableColumnItems">
          <el-table-column
            v-if="Number(item.col.key) === 0"
            :key="'tc-' + tableColumnEpoch + '-0'"
            label="开单科室"
            prop="applyDeptName"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 1"
            :key="'tc-' + tableColumnEpoch + '-1'"
            label="产品编码"
            prop="material.code"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceMaterialCode"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 2"
            :key="'tc-' + tableColumnEpoch + '-2'"
            label="产品名称"
            prop="material.name"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceMaterialName"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 3"
            :key="'tc-' + tableColumnEpoch + '-3'"
            label="规格"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceSpeci"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 4"
            :key="'tc-' + tableColumnEpoch + '-4'"
            label="型号"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceModel"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 5"
            :key="'tc-' + tableColumnEpoch + '-5'"
            label="数量"
            prop="quantity"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :sort-method="sortSummaryQuantity"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          />
          <el-table-column
            v-else-if="Number(item.col.key) === 6"
            :key="'tc-' + tableColumnEpoch + '-6'"
            label="金额"
            prop="amount"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :sort-method="sortSummaryAmount"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.amount != null && scope.row.amount !== ''">{{ scope.row.amount | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 7"
            :key="'tc-' + tableColumnEpoch + '-7'"
            label="生产厂家"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.factoryName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 8"
            :key="'tc-' + tableColumnEpoch + '-8'"
            label="供应商"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.supplierName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 9"
            :key="'tc-' + tableColumnEpoch + '-9'"
            label="注册证号"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 10"
            :key="'tc-' + tableColumnEpoch + '-10'"
            label="注册证有效期"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 11"
            :key="'tc-' + tableColumnEpoch + '-11'"
            label="集采"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span
                class="material-yn-btn"
                :class="isMaterialYesValue(scope.row.material && scope.row.material.isProcure) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
              >{{ isMaterialYesValue(scope.row.material && scope.row.material.isProcure) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额:
        {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额:
        {{ pageTotalAmtFormatted }}
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
import { listTraceSummaryApplyDept } from "@/api/gz/traceability";
import { exportTraceSummaryApplyDeptTable } from "../retrospectExport";
import retrospectSortMixin from "../retrospectSortMixin";
import TableColumnSettingDialog from "@/components/TableColumnSettingDialog";
import { createTableColumnSettingsMixin } from "@/mixins/tableColumnSettings";

function createDefaultApplyDeptColumns() {
  return [
    { key: 0, label: "开单科室", visible: true, width: 160, align: "left", sortable: false },
    { key: 1, label: "产品编码", visible: true, width: 145, align: "left", sortable: true },
    { key: 2, label: "产品名称", visible: true, width: 185, align: "left", sortable: true },
    { key: 3, label: "规格", visible: true, width: 130, align: "left", sortable: true },
    { key: 4, label: "型号", visible: true, width: 110, align: "left", sortable: true },
    { key: 5, label: "数量", visible: true, width: 110, align: "center", sortable: true },
    { key: 6, label: "金额", visible: true, width: 130, align: "center", sortable: true },
    { key: 7, label: "生产厂家", visible: true, width: 160, align: "left", sortable: false },
    { key: 8, label: "供应商", visible: true, width: 160, align: "left", sortable: false },
    { key: 9, label: "注册证号", visible: true, width: 180, align: "left", sortable: false },
    { key: 10, label: "注册证有效期", visible: true, width: 160, align: "left", sortable: false },
    { key: 11, label: "集采", visible: true, width: 80, align: "center", sortable: false }
  ];
}

export default {
  name: "UseTraceSummaryApplyDept",
  mixins: [
    retrospectSortMixin,
    createTableColumnSettingsMixin({
      createDefaultColumns: createDefaultApplyDeptColumns,
      configKey: "gz_retrospect_summary_apply_dept_columns",
      tableRef: "table"
    })
  ],
  components: { TableColumnSettingDialog },
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
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      selectedRowKeys: [],
      tableHeight: 400
    };
  },
  computed: {
    pageTotalQty() {
      return (this.summaryList || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.summaryList || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(amt);
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
    this.loadUserColumnConfig().finally(() => {
      this.getList();
    });
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
    colClassName(col) {
      return (col && (col.align || 'left') === 'left') ? 'ctk-col-left' : '';
    },
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
        const result = await exportTraceSummaryApplyDeptTable(this, this.queryParams);
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
      listTraceSummaryApplyDept(this.buildSummaryQuery()).then(response => {
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        this.summaryList = (response.rows || []).map((row, idx) => {
          if (row && !row._rowKey) {
            row._rowKey = `gz-retrospect-apply-${pageBase + idx}-${row.applyDeptName || ''}-${(row.material && row.material.code) || ''}-${row.id || idx}`;
          }
          return row;
        });
        this.total = response.total || 0;
        this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
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
        this.totalInfo = { totalQty: 0, totalAmt: 0 };
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
