<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="科室消耗明细报表" name="detail">
        <DetailReport />
      </el-tab-pane>
      <el-tab-pane label="科室消耗汇总报表" name="summary">
        <SummaryReport />
      </el-tab-pane>
    </el-tabs>
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