<template>
  <div class="app-container dep-inventory-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact">
      <el-tab-pane label="领用明细表" name="detail"></el-tab-pane>
      <el-tab-pane label="领用汇总表" name="summary"></el-tab-pane>
      <el-tab-pane label="领用排名" name="ranking"></el-tab-pane>
    </el-tabs>
    <ConsumeDetailTable v-if="activeName === 'detail'" />
    <ConsumeSummaryTable v-if="activeName === 'summary'" />
    <ConsumeRankingTable v-if="activeName === 'ranking'" />
  </div>
</template>

<script>
import ConsumeDetailTable from "@/views/department/consumeDetail/components/ConsumeDetailTable.vue";
import ConsumeSummaryTable from "@/views/department/consumeDetail/components/ConsumeSummaryTable.vue";
import ConsumeRankingTable from "@/views/department/consumeDetail/components/ConsumeRankingTable.vue";

export default {
  name: "ConsumeDetail",
  components: { ConsumeDetailTable, ConsumeSummaryTable, ConsumeRankingTable },
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
