<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="科室消耗明细报表" name="detail"></el-tab-pane>
      <el-tab-pane label="科室消耗汇总报表" name="summary"></el-tab-pane>
    </el-tabs>
    <DetailReport v-if="activeName === 'detail'"></DetailReport>
    <SummaryReport v-if="activeName === 'summary'"></SummaryReport>

  </div>
</template>

<script>
import DetailReport from './detailReport.vue'
import SummaryReport from './summaryReport.vue'

export default {
  name: "DepartmentConsumptionReport",
  components: {DetailReport, SummaryReport},
  data() {
    return {
      activeName: 'detail',
    };
  },
};
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}
</style>