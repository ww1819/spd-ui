<template>
  <div class="app-container yj-statement-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact">
      <el-tab-pane label="进销存明细表" name="first"></el-tab-pane>
      <el-tab-pane label="月结存明细表" name="second"></el-tab-pane>
      <el-tab-pane label="月结存汇总报表" name="third"></el-tab-pane>
      <el-tab-pane label="进销存汇总表" name="forth"></el-tab-pane>
      <el-tab-pane label="进销存产品汇总表" name="fifth"></el-tab-pane>
    </el-tabs>
    <PurInventoryTable v-if="activeName === 'first'" key="yj-first" />
    <MonthlyDetailTable v-if="activeName === 'second'" key="yj-second" />
    <MonthlySummaryTable v-if="activeName === 'third'" key="yj-third" />
    <WarehousePsiReport v-if="activeName === 'forth'" key="yj-forth" />
    <WarehousePsiReportByMaterial v-if="activeName === 'fifth'" key="yj-fifth" />
  </div>
</template>

<script>
import PurInventoryTable from "@/views/yj/statement/components/PurInventoryTable.vue";
import MonthlyDetailTable from "@/views/yj/statement/components/MonthlyDetailTable.vue";
import MonthlySummaryTable from "@/views/yj/statement/components/MonthlySummaryTable.vue";
import WarehousePsiReport from "@/views/yj/statement/components/WarehousePsiReport.vue";
import WarehousePsiReportByMaterial from "@/views/yj/statement/components/WarehousePsiReportByMaterial.vue";

export default {
  name: "Statement",
  components: {
    PurInventoryTable,
    MonthlyDetailTable,
    MonthlySummaryTable,
    WarehousePsiReport,
    WarehousePsiReportByMaterial
  },
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
  }
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
.app-container.yj-statement-page {
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
.yj-statement-page >>> .app-container.first-inventory-page,
.yj-statement-page >>> .app-container.list-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  margin-top: 0 !important;
}
</style>
