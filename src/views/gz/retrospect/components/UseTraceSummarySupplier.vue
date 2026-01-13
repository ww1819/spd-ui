<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="summaryList" border height="58vh" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="material.name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="型号" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="quantity" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="金额" align="center" prop="amount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amount">{{ scope.row.amount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listDepotInventory } from "@/api/gz/depotInventory";

export default {
  name: "UseTraceSummarySupplier",
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
    getList() {
      this.loading = true;
      // TODO: 替换为实际的供应商汇总API
      listDepotInventory(this.queryParams).then(response => {
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

<style lang="scss" scoped>
.table-container {
  margin-top: 0px;
  overflow: visible;
  width: 100%;
  position: relative;
  
  ::v-deep .el-table {
    width: 100%;
    border-radius: 8px;
    overflow: visible;
  }
}

::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: none !important;
}

::v-deep .el-table__header-wrapper::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

::v-deep .el-table__header-wrapper {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background-color: #c0c4cc;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

::v-deep .el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: 500;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

::v-deep .pagination-container {
  margin-top: 16px;
  padding: 16px 0;
  background: #fff;
}

::v-deep .el-table__header,
::v-deep .el-table__body {
  width: 100% !important;
}

::v-deep .el-table__header table,
::v-deep .el-table__body table {
  width: 100% !important;
}

::v-deep .el-table__header th,
::v-deep .el-table__body td {
  box-sizing: border-box;
}
</style>
