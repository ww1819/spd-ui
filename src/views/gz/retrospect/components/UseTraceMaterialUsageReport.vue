<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="reportList" border height="60vh" style="width: 100%">
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (pageQuery.pageNum - 1) * pageQuery.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="departmentName" width="140" show-overflow-tooltip resizable />
      <el-table-column label="耗材名称" align="center" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortUsageMaterialName" />
      <el-table-column label="规格" align="center" prop="specification" width="130" min-width="110" show-overflow-tooltip resizable sortable :sort-method="sortUsageSpeci" />
      <el-table-column label="型号" align="center" prop="model" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortUsageModel" />
      <el-table-column label="单位" align="center" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortUsageUnitName" />
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

    <div class="pagination-wrapper">
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="pageQuery.pageNum"
        :limit.sync="pageQuery.pageSize"
        @pagination="getList"
      />
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
      rowEditCache: {}
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
  methods: {
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
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      }).catch(() => {
        this.reportList = [];
        this.total = 0;
        this.loading = false;
      });
    }
  }
};
</script>

<style scoped>
::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
::v-deep .el-table th .cell {
  white-space: nowrap;
  padding-left: 8px;
  padding-right: 8px;
}
</style>
