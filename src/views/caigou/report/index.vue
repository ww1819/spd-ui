<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="采购计划明细表" name="planDetail"></el-tab-pane>
      <el-tab-pane label="采购计划汇总表" name="planSummary"></el-tab-pane>
      <el-tab-pane label="采购订单明细表" name="orderDetail"></el-tab-pane>
      <el-tab-pane label="采购订单汇总表" name="orderSummary"></el-tab-pane>
    </el-tabs>
    <PlanDetailReport v-if="activeName === 'planDetail'"></PlanDetailReport>
    <PlanSummaryReport v-if="activeName === 'planSummary'"></PlanSummaryReport>
    <OrderDetailReport v-if="activeName === 'orderDetail'"></OrderDetailReport>
    <OrderSummaryReport v-if="activeName === 'orderSummary'"></OrderSummaryReport>
  </div>
</template>

<script>
import PlanDetailReport from './components/PlanDetailReport.vue';
import PlanSummaryReport from './components/PlanSummaryReport.vue';
import OrderDetailReport from './components/OrderDetailReport.vue';
import OrderSummaryReport from './components/OrderSummaryReport.vue';

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
      activeName: 'planDetail',
    };
  },
};
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  height: calc(100vh - 84px);
  overflow: hidden;
}
</style>

