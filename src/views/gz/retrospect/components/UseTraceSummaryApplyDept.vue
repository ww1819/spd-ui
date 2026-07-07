<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="summaryList" border height="60vh" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="开单科室" align="center" prop="applyDeptName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="耗材编码" align="center" prop="material.code" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortTraceMaterialCode"/>
      <el-table-column label="耗材名称" align="center" prop="material.name" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortTraceMaterialName"/>
      <el-table-column label="规格" align="center" width="130" min-width="110" show-overflow-tooltip resizable sortable :sort-method="sortTraceSpeci">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="型号" align="center" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortTraceModel">
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
      <el-table-column label="生产厂家" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.factoryName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.supplierName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证有效期" align="center" width="160" show-overflow-tooltip resizable>
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

    <div class="pagination-wrapper">
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script>
import { listTraceSummaryApplyDept } from "@/api/gz/traceability";
import { exportTraceSummaryApplyDeptTable } from "../retrospectExport";
import retrospectSortMixin from "../retrospectSortMixin";

export default {
  name: "UseTraceSummaryApplyDept",
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
      total: 0
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
    });
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
    if (this._headerScrollbarCleanup) {
      this._headerScrollbarCleanup();
    }
  },
  methods: {
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
        this.summaryList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.syncTableScroll();
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      }).catch(() => {
        this.summaryList = [];
        this.total = 0;
        this.loading = false;
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
::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
::v-deep .el-table th .cell {
  white-space: nowrap;
  padding-left: 8px;
  padding-right: 8px;
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
