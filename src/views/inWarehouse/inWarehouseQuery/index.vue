<template>
  <div class="app-container inWarehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inWarehouse-query-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="入/退货明细表" name="first"></el-tab-pane>
      <el-tab-pane label="入/退货汇总表" name="second"></el-tab-pane>
      <el-tab-pane label="采购汇总报表" name="purchaseSummary"></el-tab-pane>
    </el-tabs>
    <!-- 使用 v-show 替代 v-if，切换时只切换显示不销毁组件，避免重复创建和请求 -->
    <FirstQuery v-show="activeName === 'first'" ref="firstQuery"/>
    <SecondQuery v-show="activeName === 'second'" ref="secondQuery"/>
    <PurchaseSummaryReport v-show="activeName === 'purchaseSummary'" ref="purchaseSummaryReport" :inline="true" />
  </div>
</template>

<script>
import FirstQuery from '@/views/inWarehouse/inWarehouseQuery/firstQuery';
import SecondQuery from '@/views/inWarehouse/inWarehouseQuery/secondQuery';
import PurchaseSummaryReport from '@/views/shared/PurchaseSummaryReport';

export default {
  name: "InWarehouseQuery",
  components: {FirstQuery, SecondQuery, PurchaseSummaryReport},
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
      if (tab.name === 'first' && this.$refs.firstQuery) {
        this.$nextTick(() => {
          if (typeof this.$refs.firstQuery.updateTableHeight === 'function') {
            this.$refs.firstQuery.updateTableHeight();
            setTimeout(() => this.$refs.firstQuery.updateTableHeight(), 80);
          }
        });
      }
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
      if (tab.name === 'purchaseSummary' && this.$refs.purchaseSummaryReport && typeof this.$refs.purchaseSummaryReport.loadReport === 'function') {
        this.$nextTick(() => this.$refs.purchaseSummaryReport.loadReport());
      }
    },
  },
};
</script>

<style>
/* 入/退货查询页：隐藏右侧滚动条、固定页面不滚动（与出/退库共用 inventory-query-fixed） */
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}
</style>

<style scoped>
/* 入/退货查询页：顶部收紧、左右 8px；flex 留给子页翻页完整高度 */
.app-container.inWarehouse-query-page {
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
.inWarehouse-query-tabs-compact {
  flex: 0 0 auto;
  margin-top: 0;
  margin-bottom: 0;
}
.inWarehouse-query-tabs-compact >>> .el-tabs__header {
  margin: 0 0 4px !important;
}
.inWarehouse-query-tabs-compact >>> .el-tabs__nav-wrap {
  margin-bottom: 0;
}
.inWarehouse-query-tabs-compact >>> .el-tabs__content {
  display: none;
}
/* 子查询页吃掉页签下方剩余高度，避免再套一层 100vh 把翻页裁切 */
.inWarehouse-query-page >>> .app-container.first-inventory-page,
.inWarehouse-query-page >>> .app-container.list-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}
/* 兜底：任何 display:!important 不得盖掉 v-show 隐藏 */
.inWarehouse-query-page >>> .app-container.first-inventory-page[style*="display: none"],
.inWarehouse-query-page >>> .app-container.list-page[style*="display: none"] {
  display: none !important;
}
</style>
