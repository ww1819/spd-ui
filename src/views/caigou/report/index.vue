<template>
  <div class="app-container purchase-report-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="采购计划明细表" name="planDetail"></el-tab-pane>
      <el-tab-pane label="采购计划汇总表" name="planSummary"></el-tab-pane>
      <el-tab-pane label="采购订单明细表" name="orderDetail"></el-tab-pane>
      <el-tab-pane label="采购订单汇总表" name="orderSummary"></el-tab-pane>
    </el-tabs>
    <PlanDetailReport v-if="activeName === 'planDetail'" ref="planDetail" />
    <PlanSummaryReport v-if="activeName === 'planSummary'" ref="planSummary" />
    <OrderDetailReport v-if="activeName === 'orderDetail'" ref="orderDetail" />
    <OrderSummaryReport v-if="activeName === 'orderSummary'" ref="orderSummary" />
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
  },
  methods: {
    handleTabClick(tab) {
      const refMap = {
        planDetail: "planDetail",
        planSummary: "planSummary",
        orderDetail: "orderDetail",
        orderSummary: "orderSummary"
      };
      const refName = refMap[tab.name];
      const comp = refName && this.$refs[refName];
      if (!comp) return;
      this.$nextTick(() => {
        if (typeof comp.updateTableHeight === "function") {
          comp.updateTableHeight();
          setTimeout(() => comp.updateTableHeight(), 80);
        }
      });
    }
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
.app-container.purchase-report-query-page {
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
.purchase-report-query-page >>> .app-container.first-inventory-page,
.purchase-report-query-page >>> .app-container.list-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}
.purchase-report-query-page >>> .app-container.first-inventory-page[style*="display: none"],
.purchase-report-query-page >>> .app-container.list-page[style*="display: none"] {
  display: none !important;
}
</style>
