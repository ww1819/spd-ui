<template>
  <div class="app-container profit-loss-report-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact">
      <el-tab-pane label="盈亏明细表" name="first"></el-tab-pane>
      <el-tab-pane label="盈亏明细汇总表" name="second"></el-tab-pane>
    </el-tabs>
    <FirstProfitLossReport v-if="activeName === 'first'"></FirstProfitLossReport>
    <SecondProfitLossReport v-if="activeName === 'second'"></SecondProfitLossReport>
  </div>
</template>

<script>
import FirstProfitLossReport from "@/views/warehouse/profitLossReport/firstProfitLossReport.vue";
import SecondProfitLossReport from "@/views/warehouse/profitLossReport/secondProfitLossReport.vue";

export default {
  name: "ProfitLossReport",
  components: { FirstProfitLossReport, SecondProfitLossReport },
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
};
</script>

<style>
/* 盈亏报表页：隐藏右侧滚动条、固定页面不滚动 */
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}
</style>

<style scoped>
/* 盈亏报表页：顶部与左右保持 8px，搜索框与明细框整体增宽；固定高度避免溢出 */
.app-container.profit-loss-report-page {
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  height: calc(100vh - 92px) !important;
  overflow-y: hidden !important;
  overflow-x: hidden !important;
}
/* 标签切换栏上移一点，与顶部间距 8px 由容器 padding-top 控制 */
.inventory-tabs-compact {
  margin-top: 0;
}
</style>
