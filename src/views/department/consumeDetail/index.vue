<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="领用明细表" name="detail"></el-tab-pane>
      <el-tab-pane label="领用汇总表" name="summary"></el-tab-pane>
      <el-tab-pane label="领用排名" name="ranking"></el-tab-pane>
    </el-tabs>
    <ConsumeDetailTable v-if="activeName === 'detail'"></ConsumeDetailTable>
    <ConsumeSummaryTable v-if="activeName === 'summary'"></ConsumeSummaryTable>
    <ConsumeRankingTable v-if="activeName === 'ranking'"></ConsumeRankingTable>
  </div>
</template>

<script>
import ConsumeDetailTable from "@/views/department/consumeDetail/components/ConsumeDetailTable.vue";
import ConsumeSummaryTable from "@/views/department/consumeDetail/components/ConsumeSummaryTable.vue";
import ConsumeRankingTable from "@/views/department/consumeDetail/components/ConsumeRankingTable.vue";

export default {
  name: "ConsumeDetail",
  components: {ConsumeDetailTable, ConsumeSummaryTable, ConsumeRankingTable},
  data() {
    return {
      activeName: 'detail',
    };
  },
};
</script>
