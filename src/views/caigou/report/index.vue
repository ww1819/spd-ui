<template>
  <div class="app-container dep-inventory-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact">
      <el-tab-pane label="采购计划明细表" name="planDetail"></el-tab-pane>
      <el-tab-pane label="采购计划汇总表" name="planSummary"></el-tab-pane>
      <el-tab-pane label="采购订单明细表" name="orderDetail"></el-tab-pane>
      <el-tab-pane label="采购订单汇总表" name="orderSummary"></el-tab-pane>
    </el-tabs>
    <PlanDetailReport v-if="activeName === 'planDetail'" />
    <PlanSummaryReport v-if="activeName === 'planSummary'" />
    <OrderDetailReport v-if="activeName === 'orderDetail'" />
    <OrderSummaryReport v-if="activeName === 'orderSummary'" />
  </div>
</template>

<script>
import PlanDetailReport from "./components/PlanDetailReport.vue";
import PlanSummaryReport from "./components/PlanSummaryReport.vue";
import OrderDetailReport from "./components/OrderDetailReport.vue";
import OrderSummaryReport from "./components/OrderSummaryReport.vue";

export default {
  name: "PurchaseReport",
  components: {
    PlanDetailReport,
    PlanSummaryReport,
    OrderDetailReport,
    OrderSummaryReport
  },
  data() {
    return {
      activeName: "planDetail"
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
