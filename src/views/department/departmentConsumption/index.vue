<template>
  <div class="app-container dep-inventory-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact">
      <el-tab-pane label="科室消耗明细报表" name="detail"></el-tab-pane>
      <el-tab-pane label="科室消耗汇总报表" name="summary"></el-tab-pane>
    </el-tabs>
    <DetailReport v-if="activeName === 'detail'" />
    <SummaryReport v-if="activeName === 'summary'" />
  </div>
</template>

<script>
import DetailReport from "./detailReport.vue";
import SummaryReport from "./summaryReport.vue";

export default {
  name: "DepartmentConsumptionReport",
  components: { DetailReport, SummaryReport },
  data() {
    return {
      activeName: "detail"
    };
  },
  activated() {
    document.body.classList.add("inventory-query-fixed");
  },
  deactivated() {
    document.body.classList.remove("inventory-query-fixed");
  },
  mounted() {
    document.body.classList.add("inventory-query-fixed");
  },
  beforeDestroy() {
    document.body.classList.remove("inventory-query-fixed");
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
.app-container.dep-inventory-query-page {
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  height: calc(100vh - 92px) !important;
  overflow-y: hidden !important;
  overflow-x: hidden !important;
}
.inventory-tabs-compact {
  margin-top: 0;
}
</style>
