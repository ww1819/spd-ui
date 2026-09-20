<template>
  <div class="gz-retrospect-table-panel">
    <div class="table-container" ref="tablePanel">
      <el-table
        ref="table"
        class="gz-retrospect-main-table"
        v-loading="loading"
        :data="reportList"
        :height="tableHeight"
        border
        stripe
      >
        <el-table-column label="序号" align="center" header-align="center" width="80" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (pageQuery.pageNum - 1) * pageQuery.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="科室" align="left" header-align="center" class-name="ctk-col-left" prop="departmentName" width="140" show-overflow-tooltip resizable />
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortUsageMaterialName" />
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" prop="specification" width="130" min-width="110" show-overflow-tooltip resizable sortable :sort-method="sortUsageSpeci" />
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" prop="model" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortUsageModel" />
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortUsageUnitName" />
        <el-table-column label="消耗数量" align="center" prop="consumeQty" width="120" min-width="110" show-overflow-tooltip resizable sortable :sort-method="sortUsageConsumeQty" />
        <el-table-column label="剩余数量" align="center" prop="remainQty" width="120" min-width="110" show-overflow-tooltip resizable sortable :sort-method="sortUsageRemainQty" />
        <el-table-column label="预计下个月需求" align="center" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.nextMonthDemand"
              size="mini"
              placeholder="请输入"
              clearable
              @input="onRowEdit(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" min-width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.remark"
              size="mini"
              placeholder="请输入"
              clearable
              @input="onRowEdit(scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-container" v-show="total > 0">
        <el-pagination
          background
          :current-page="pageQuery.pageNum"
          :page-size="pageQuery.pageSize"
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
import { listMaterialUsageReport } from "@/api/gz/traceability";
import { exportMaterialUsageReportTable } from "../retrospectExport";
import retrospectSortMixin from "../retrospectSortMixin";

export default {
  name: "UseTraceMaterialUsageReport",
  mixins: [retrospectSortMixin],
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      reportList: [],
      total: 0,
      pageQuery: {
        pageNum: 1,
        pageSize: 10
      },
      rowEditCache: {},
      tableHeight: 400
    };
  },
  watch: {
    queryParams: {
      handler() {
        this.pageQuery.pageNum = 1;
        this.getList();
      },
      deep: true
    }
  },
  created() {
    this.pageQuery.pageNum = this.queryParams.pageNum || 1;
    this.pageQuery.pageSize = this.queryParams.pageSize || 10;
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
    handleSizeChange(val) {
      this.pageQuery.pageSize = val;
      this.pageQuery.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.pageQuery.pageNum = val;
      this.getList();
    },
    rowKey(row) {
      return `${row.departmentId || ''}_${row.materialId || ''}`;
    },
    onRowEdit(row) {
      const key = this.rowKey(row);
      this.rowEditCache[key] = {
        nextMonthDemand: row.nextMonthDemand,
        remark: row.remark
      };
    },
    applyRowEditCache(rows) {
      return (rows || []).map(item => {
        const key = this.rowKey(item);
        const cached = this.rowEditCache[key];
        if (cached) {
          return {
            ...item,
            nextMonthDemand: cached.nextMonthDemand != null ? cached.nextMonthDemand : item.nextMonthDemand,
            remark: cached.remark != null ? cached.remark : item.remark
          };
        }
        return {
          ...item,
          nextMonthDemand: item.nextMonthDemand != null ? item.nextMonthDemand : '',
          remark: item.remark != null ? item.remark : ''
        };
      });
    },
    buildApiQuery() {
      return {
        pageNum: this.pageQuery.pageNum,
        pageSize: this.pageQuery.pageSize,
        materialId: this.queryParams.materialId,
        materialName: this.queryParams.materialName,
        supplierId: this.queryParams.supplierId,
        batchNo: this.queryParams.batchNo,
        materialNo: this.queryParams.materialNo,
        beginDate: this.queryParams.materialDate,
        endDate: this.queryParams.warehouseDate
      };
    },
    async exportTable() {
      this.loading = true;
      try {
        const result = await exportMaterialUsageReportTable(this, this.queryParams, {
          buildApiQuery: () => this.buildApiQuery(),
          applyRowEditCache: (rows) => this.applyRowEditCache(rows)
        });
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
      listMaterialUsageReport(this.buildApiQuery()).then(response => {
        this.reportList = this.applyRowEditCache(response.rows || []);
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.syncTableScroll();
          this.updateTableHeight();
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      }).catch(() => {
        this.reportList = [];
        this.total = 0;
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
</style>
