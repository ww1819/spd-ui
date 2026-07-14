<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="gzDepInventoryList" @selection-change="handleSelectionChange" border height="60vh" style="width: 100%">
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
      <el-table-column
        v-for="col in hisChargeItemColumnDefs"
        :key="'his-charge-' + col.key"
        :label="col.label"
        :width="col.width"
        align="center"
        show-overflow-tooltip
        resizable
      >
        <template slot-scope="scope">
          <span>{{ col.text(scope.row) }}</span>
        </template>
      </el-table-column>
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
      <!-- 13a. 主条码 -->
      <el-table-column label="主条码" align="center" prop="masterBarcode" width="180" show-overflow-tooltip resizable/>
      <!-- 13b. 辅条码 -->
      <el-table-column label="辅条码" align="center" prop="secondaryBarcode" width="150" show-overflow-tooltip resizable/>
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

    <div class="pagination-wrapper">
      <div class="pagination-summary" v-if="total > 0">
        <span class="summary-label">合计：</span>当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
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
      ids: []
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
        : String(Number(amt).toFixed(2));
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

<style scoped>
::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
</style>
