<template>
  <div class="app-container out-warehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="出/退库明细表" name="first"></el-tab-pane>
      <el-tab-pane label="出/退库汇总表" name="second"></el-tab-pane>
      <el-tab-pane label="出/退库汇总(供应商)" name="thirdSupplier"></el-tab-pane>
      <el-tab-pane label="出/退库汇总(科室)" name="fourthDepartment"></el-tab-pane>
      <el-tab-pane label="采购汇总报表" name="purchaseSummary"></el-tab-pane>
      <el-tab-pane label="耗材使用排名" name="materialUsageRank"></el-tab-pane>
    </el-tabs>
    <!-- 使用 v-show 替代 v-if，切换时只切换显示不销毁组件，避免重复创建和请求 -->
    <FirstOutQuery v-show="activeName === 'first'" ref="firstQuery"/>
    <SecondOutQuery v-show="activeName === 'second'" ref="secondQuery"/>
    <ThirdSupplierOutQuery v-show="activeName === 'thirdSupplier'" ref="thirdSupplierQuery"/>
    <FourthDepartmentOutQuery v-show="activeName === 'fourthDepartment'" ref="fourthDepartmentQuery"/>
    <PurchaseSummaryReport v-show="activeName === 'purchaseSummary'" ref="purchaseSummaryReport" :inline="true" />
    <MaterialUsageRankReport v-show="activeName === 'materialUsageRank'" ref="materialUsageRankReport" :inline="true" />
  </div>
</template>

<script>

import FirstOutQuery from "@/views/outWarehouse/outWarehouseQuery/firstOutQuery";
import SecondOutQuery from "@/views/outWarehouse/outWarehouseQuery/secondOutQuery";
import ThirdSupplierOutQuery from "@/views/outWarehouse/outWarehouseQuery/thirdSupplierOutQuery";
import FourthDepartmentOutQuery from "@/views/outWarehouse/outWarehouseQuery/fourthDepartmentOutQuery";
import PurchaseSummaryReport from "@/views/shared/PurchaseSummaryReport";
import MaterialUsageRankReport from "@/views/shared/MaterialUsageRankReport";


export default {
  name: "OutWarehouseQuery",
  components: {FirstOutQuery, SecondOutQuery, ThirdSupplierOutQuery, FourthDepartmentOutQuery, PurchaseSummaryReport, MaterialUsageRankReport},
  data() {
    return {
      activeName: 'first',
    };
  },
  activated() {
    document.body.classList.add('inventory-query-fixed');
  },
  deactivated() {
    document.body.classList.remove('inventory-query-fixed');
  },
  mounted() {
    document.body.classList.add('inventory-query-fixed');
  },
  beforeDestroy() {
    document.body.classList.remove('inventory-query-fixed');
  },
  methods: {
    /** 切换到汇总表时再加载数据，避免首屏同时请求明细+汇总 */
    handleTabClick(tab) {
      if (tab.name === 'second' && this.$refs.secondQuery) {
        this.$nextTick(() => {
          if (typeof this.$refs.secondQuery.getList === 'function') {
            this.$refs.secondQuery.getList();
          }
          if (typeof this.$refs.secondQuery.updateTableHeight === 'function') {
            this.$refs.secondQuery.updateTableHeight();
            setTimeout(() => this.$refs.secondQuery.updateTableHeight(), 80);
          }
        });
      }
      if (tab.name === 'thirdSupplier' && this.$refs.thirdSupplierQuery) {
        this.$nextTick(() => {
          if (typeof this.$refs.thirdSupplierQuery.getList === 'function') {
            this.$refs.thirdSupplierQuery.getList();
          }
          if (typeof this.$refs.thirdSupplierQuery.updateTableHeight === 'function') {
            this.$refs.thirdSupplierQuery.updateTableHeight();
            setTimeout(() => this.$refs.thirdSupplierQuery.updateTableHeight(), 80);
          }
        });
      }
      if (tab.name === 'fourthDepartment' && this.$refs.fourthDepartmentQuery) {
        this.$nextTick(() => {
          if (typeof this.$refs.fourthDepartmentQuery.getList === 'function') {
            this.$refs.fourthDepartmentQuery.getList();
          }
          if (typeof this.$refs.fourthDepartmentQuery.updateTableHeight === 'function') {
            this.$refs.fourthDepartmentQuery.updateTableHeight();
            setTimeout(() => this.$refs.fourthDepartmentQuery.updateTableHeight(), 80);
          }
        });
      }
      if (tab.name === 'purchaseSummary' && this.$refs.purchaseSummaryReport && typeof this.$refs.purchaseSummaryReport.loadReport === 'function') {
        this.$nextTick(() => this.$refs.purchaseSummaryReport.loadReport());
      }
      if (tab.name === 'materialUsageRank' && this.$refs.materialUsageRankReport) {
        this.$nextTick(() => {
          if (typeof this.$refs.materialUsageRankReport.loadReport === 'function') {
            this.$refs.materialUsageRankReport.loadReport();
          }
          if (typeof this.$refs.materialUsageRankReport.updateTableHeight === 'function') {
            this.$refs.materialUsageRankReport.updateTableHeight();
            setTimeout(() => this.$refs.materialUsageRankReport.updateTableHeight(), 80);
          }
        });
      }
    },
  },
};
</script>

<style>
/* 出/退库查询页：隐藏右侧滚动条、固定页面不滚动 */
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}
</style>

<style scoped>
/* 出/退库查询页：顶部收紧、左右 8px；flex 留给子页翻页完整高度 */
.app-container.out-warehouse-query-page {
  display: flex !important;
  flex-direction: column !important;
  padding-top: 4px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 4px !important;
  height: calc(100vh - 92px) !important;
  max-height: calc(100vh - 92px) !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  min-height: 0 !important;
}
/* 子页签与下方搜索区紧贴，减少留白 */
.inventory-tabs-compact {
  flex: 0 0 auto;
  margin-top: 0;
  margin-bottom: 0;
}
.inventory-tabs-compact >>> .el-tabs__header {
  margin: 0 0 4px !important;
}
.inventory-tabs-compact >>> .el-tabs__nav-wrap {
  margin-bottom: 0;
}
/* 子查询页吃掉页签下方剩余高度，避免再套一层 100vh 把翻页裁切 */
.out-warehouse-query-page >>> .app-container.first-inventory-page,
.out-warehouse-query-page >>> .app-container.list-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}
/* 兜底：任何 display:!important 不得盖掉 v-show 隐藏 */
.out-warehouse-query-page >>> .app-container.first-inventory-page[style*="display: none"],
.out-warehouse-query-page >>> .app-container.list-page[style*="display: none"] {
  display: none !important;
}
</style>

<style>
/* 出/退库查询明细表横向滚动条：与耗材产品维护一致 */
body.inventory-query-fixed .out-warehouse-query-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar,
body.inventory-query-fixed .out-warehouse-query-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar,
body.inventory-query-fixed .out-warehouse-query-page .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
body.inventory-query-fixed .out-warehouse-query-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
body.inventory-query-fixed .out-warehouse-query-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
body.inventory-query-fixed .out-warehouse-query-page .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
body.inventory-query-fixed .out-warehouse-query-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
body.inventory-query-fixed .out-warehouse-query-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
body.inventory-query-fixed .out-warehouse-query-page .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
body.inventory-query-fixed .out-warehouse-query-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
body.inventory-query-fixed .out-warehouse-query-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
body.inventory-query-fixed .out-warehouse-query-page .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}
body.inventory-query-fixed .out-warehouse-query-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
body.inventory-query-fixed .out-warehouse-query-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
body.inventory-query-fixed .out-warehouse-query-page .ctk-usage-rank-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}
</style>
