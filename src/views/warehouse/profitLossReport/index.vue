<template>
  <div class="app-container profit-loss-report-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="盈亏明细表" name="first"></el-tab-pane>
      <el-tab-pane label="盈亏明细汇总表" name="second"></el-tab-pane>
    </el-tabs>
    <FirstProfitLossReport v-if="activeName === 'first'" ref="firstReport"></FirstProfitLossReport>
    <SecondProfitLossReport v-if="activeName === 'second'" ref="secondReport"></SecondProfitLossReport>
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
  methods: {
    handleTabClick(tab) {
      const refName = tab.name === 'first' ? 'firstReport' : tab.name === 'second' ? 'secondReport' : null;
      const comp = refName && this.$refs[refName];
      if (!comp) return;
      this.$nextTick(() => {
        if (typeof comp.updateTableHeight === 'function') {
          comp.updateTableHeight();
          setTimeout(() => comp.updateTableHeight(), 80);
        }
      });
    },
  },
};
</script>

<style>
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}
</style>

<style scoped>
.app-container.profit-loss-report-page {
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
.profit-loss-report-page >>> .app-container.first-inventory-page,
.profit-loss-report-page >>> .app-container.list-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}
.profit-loss-report-page >>> .app-container.first-inventory-page[style*="display: none"],
.profit-loss-report-page >>> .app-container.list-page[style*="display: none"] {
  display: none !important;
}
</style>
