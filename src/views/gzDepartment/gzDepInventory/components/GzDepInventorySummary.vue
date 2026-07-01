<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="summaryList" border height="60vh" style="width: 100%">
      <el-table-column type="index" label="序号" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
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
      <el-table-column label="规格" align="center" prop="materialSpeci" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="totalQty" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="金额" align="center" prop="totalAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmt">{{ scope.row.totalAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable/>
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
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory";
import hisChargeItemTableColumnsMixin from "@/mixins/hisChargeItemTableColumns";

export default {
  name: "GzDepInventorySummary",
  mixins: [hisChargeItemTableColumnsMixin],
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      hisChargeFlatRow: true,
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
      params.pageNum = 1;
      params.pageSize = 10000;
      return params;
    },
    getList() {
      this.loading = true;
      // 先获取所有明细数据，然后在前端进行汇总
      listGzDepInventory(this.buildListQuery()).then(response => {
        const detailList = response.rows || [];
        // 按耗材、科室进行汇总
        const summaryMap = {};
        
        detailList.forEach(item => {
          const material = item.material || {};
          const materialId = item.materialId || material.id;
          const materialName = material.name || '';
          const materialCode = material.code || material.id || '';
          const materialSpeci = material.speci || '';
          const departmentName = (item.department && item.department.name) || '';
          const unitName = material.unitName || '';
          
          const key = `${materialId}_${departmentName}`;
          
          if (!summaryMap[key]) {
            summaryMap[key] = {
              materialId: materialId,
              materialCode: materialCode,
              materialName: materialName,
              materialSpeci: materialSpeci,
              unitName: unitName,
              unitPrice: item.unitPrice || 0,
              totalQty: 0,
              totalAmt: 0,
              departmentName: departmentName,
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
  }
};
</script>

<style scoped>
::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
</style>
