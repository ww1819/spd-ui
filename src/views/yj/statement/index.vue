<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="进销存明细表" name="first"></el-tab-pane>
      <el-tab-pane label="月结存明细表" name="second"></el-tab-pane>
      <el-tab-pane label="月结存汇总报表" name="third"></el-tab-pane>
      <el-tab-pane label="进销存汇总表" name="forth"></el-tab-pane>
      <el-tab-pane label="进销存产品汇总表" name="fifth"></el-tab-pane>
    </el-tabs>
    <PurInventoryTable v-if="activeName === 'first'"></PurInventoryTable>
    <MonthlyDetailTable v-if="activeName === 'second'"></MonthlyDetailTable>
    <MonthlySummaryTable v-if="activeName === 'third'"></MonthlySummaryTable>
    <WarehousePsiReport v-if="activeName === 'forth'"></WarehousePsiReport>
    <WarehousePsiReportByMaterial v-if="activeName === 'fifth'"></WarehousePsiReportByMaterial>
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
};
</script>

<style scoped>
.app-container {
  margin-top: -10px;
}
</style>
