<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="gzDepInventoryList" @selection-change="handleSelectionChange" border height="58vh" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <!-- 1. 序号 -->
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <!-- 2. 耗材编码 -->
      <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable/>
      <!-- 3. 耗材名称 -->
      <el-table-column label="耗材名称" align="center" prop="material.name" width="160" show-overflow-tooltip resizable/>
      <!-- 4. 规格 -->
      <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
      <!-- 5. 型号 -->
      <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable/>
      <!-- 6. 单位 -->
      <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 7. 数量 -->
      <el-table-column label="数量" align="center" prop="qty" width="80" show-overflow-tooltip resizable/>
      <!-- 8. 单价 -->
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 9. 金额 -->
      <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 10. 生产日期 -->
      <el-table-column label="生产日期" align="center" prop="materialDate" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 11. 有效期 -->
      <el-table-column label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 12. 批号 -->
      <el-table-column label="批号" align="center" prop="materialNo" width="150" show-overflow-tooltip resizable/>
      <!-- 13. 院内码 -->
      <el-table-column label="院内码" align="center" prop="inHospitalCode" width="180" show-overflow-tooltip resizable/>
      <!-- 14. 科室 -->
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable/>
      <!-- 15. 仓库 -->
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable/>
      <!-- 16. 批次 -->
      <el-table-column label="批次" align="center" prop="batchNo" width="150" show-overflow-tooltip resizable/>
      <!-- 17. 生产厂家 -->
      <el-table-column label="生产厂家" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 18. 供应商 -->
      <el-table-column label="供应商" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 19. 出库单号 -->
      <el-table-column label="出库单号" align="center" prop="shipmentNo" width="180" show-overflow-tooltip resizable/>
      <!-- 20. 制单人 -->
      <el-table-column label="制单人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 21. 制单日期 -->
      <el-table-column label="制单日期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 22. 审核人 -->
      <el-table-column label="审核人" align="center" prop="auditBy" width="120" show-overflow-tooltip resizable/>
      <!-- 23. 审核日期 -->
      <el-table-column label="审核日期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 24. 备注 -->
      <el-table-column label="备注" align="center" prop="remark" width="200" show-overflow-tooltip resizable/>
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
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory";

export default {
  name: "GzDepInventoryDetail",
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
      ids: []
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
    // 同步表头和表体的滚动
    this.$nextTick(() => {
      this.syncTableScroll();
    });
  },
  updated() {
    // 数据更新后重新同步滚动
    this.$nextTick(() => {
      this.syncTableScroll();
      // 强制表格重新布局
      if (this.$refs.table) {
        this.$refs.table.doLayout();
      }
    });
  },
  beforeDestroy() {
    // 清理资源
    if (this._headerScrollbarCleanup) {
      this._headerScrollbarCleanup();
    }
  },
  methods: {
    getList() {
      this.loading = true;
      listGzDepInventory(this.queryParams).then(response => {
        this.gzDepInventoryList = response.rows;
        this.total = response.total;
        this.loading = false;
        // 数据加载完成后，重新同步滚动以确保列对齐
        this.$nextTick(() => {
          this.syncTableScroll();
          // 强制表格重新布局
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      });
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.$emit('selection-change', selection);
    },
    syncTableScroll() {
      const headerWrapper = this.$el?.querySelector('.el-table__header-wrapper');
      const bodyWrapper = this.$el?.querySelector('.el-table__body-wrapper');
      
      if (!headerWrapper || !bodyWrapper) {
        return;
      }
      
      // 双向同步滚动：表体滚动时同步表头，表头滚动时同步表体
      const syncScroll = (source, target) => {
        if (source.scrollLeft !== target.scrollLeft) {
          target.scrollLeft = source.scrollLeft;
        }
      };
      
      // 表体滚动时同步表头
      const syncBodyToHeader = () => {
        syncScroll(bodyWrapper, headerWrapper);
      };
      
      // 表头滚动时同步表体
      const syncHeaderToBody = () => {
        syncScroll(headerWrapper, bodyWrapper);
      };
      
      // 移除旧的事件监听器
      if (this._syncBodyToHeader) {
        bodyWrapper.removeEventListener('scroll', this._syncBodyToHeader);
      }
      if (this._syncHeaderToBody) {
        headerWrapper.removeEventListener('scroll', this._syncHeaderToBody);
      }
      
      // 添加新的事件监听器
      this._syncBodyToHeader = syncBodyToHeader;
      this._syncHeaderToBody = syncHeaderToBody;
      bodyWrapper.addEventListener('scroll', syncBodyToHeader, { passive: true });
      headerWrapper.addEventListener('scroll', syncHeaderToBody, { passive: true });
      
      // 保存清理函数
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

/* 表头不显示滚动条，但可以同步滚动 */
::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

/* 表体可以滚动（水平和垂直），显示滚动条 */
::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: none !important;
}

/* 隐藏表头滚动条 */
::v-deep .el-table__header-wrapper::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

::v-deep .el-table__header-wrapper {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

/* 垂直滚动条样式 */
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

/* 表格头部样式优化 */
::v-deep .el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: 500;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

/* 表格行样式优化 */
::v-deep .el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 分页样式优化 */
::v-deep .pagination-container {
  margin-top: 16px;
  padding: 16px 0;
  background: #fff;
}

/* 确保表头和表体列宽一致，对齐 */
::v-deep .el-table__header,
::v-deep .el-table__body {
  width: 100% !important;
}

::v-deep .el-table__header table,
::v-deep .el-table__body table {
  width: 100% !important;
}

/* 确保表头和表体的列宽完全一致 */
::v-deep .el-table__header th,
::v-deep .el-table__body td {
  box-sizing: border-box;
}

/* 固定列样式 - 只保留左侧固定 */
::v-deep .el-table__fixed-right {
  display: none !important;
}
</style>
