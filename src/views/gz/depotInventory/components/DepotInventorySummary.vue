<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="summaryList" border height="60vh" style="width: 100%">
      <el-table-column type="index" label="序号" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="140" show-overflow-tooltip resizable sortable :sort-method="sortSummaryMaterialCode"/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="180" show-overflow-tooltip resizable sortable :sort-method="sortSummaryMaterialName"/>
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
      <el-table-column label="规格" align="center" prop="materialSpeci" width="130" show-overflow-tooltip resizable sortable :sort-method="sortSummarySpeci"/>
      <el-table-column label="型号" align="center" prop="materialModel" width="130" show-overflow-tooltip resizable sortable :sort-method="sortSummaryModel"/>
      <el-table-column label="单位" align="center" prop="unitName" width="100" show-overflow-tooltip resizable sortable :sort-method="sortSummaryUnitName"/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="130" show-overflow-tooltip resizable sortable :sort-method="sortSummaryUnitPrice">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
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
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="厂家" align="center" prop="factoryName" width="120" show-overflow-tooltip resizable/>
    </el-table>


    <div class="pagination-wrapper">
      <div class="pagination-summary" v-if="total > 0">
        <span class="summary-label">合计：</span>总数量: {{ calculateTotalQty }}，总金额: {{ calculateTotalAmt }}
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
      total: 0
    };
  },
  computed: {
    calculateTotalQty() {
      const totalQty = this.summaryList.reduce((sum, item) => {
        const qty = Number(item.totalQty) || 0;
        return sum + qty;
      }, 0);
      return totalQty.toFixed(2);
    },
    calculateTotalAmt() {
      const totalAmt = this.summaryList.reduce((sum, item) => {
        const amt = Number(item.totalAmt) || 0;
        return sum + amt;
      }, 0);
      return '￥' + totalAmt.toFixed(2);
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
  methods: {
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
        // 按耗材、仓库、供应商进行汇总
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
        
        // 转换为数组
        this.summaryList = Object.values(summaryMap);
        this.total = this.summaryList.length;
        this.loading = false;
        // 数据加载完成后，重新同步滚动以确保列对齐
        this.$nextTick(() => {
          this.syncTableScroll();
          // 强制表格重新布局
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
  }
};
</script>

<style scoped>
::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
</style>
