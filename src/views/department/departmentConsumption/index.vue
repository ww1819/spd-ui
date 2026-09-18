<template>
  <div class="app-container dep-inventory-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="科室消耗明细报表" name="detail"></el-tab-pane>
      <el-tab-pane label="科室消耗汇总报表" name="summary"></el-tab-pane>
    </el-tabs>
    <DetailReport v-if="activeName === 'detail'" key="dept-consume-detail" ref="detailReport" />
    <SummaryReport v-if="activeName === 'summary'" key="dept-consume-summary" ref="summaryReport" />
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
  methods: {
    handleTabClick(tab) {
      const refMap = {
        detail: "detailReport",
        summary: "summaryReport"
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
.dep-inventory-query-page >>> .app-container.first-inventory-page,
.dep-inventory-query-page >>> .app-container.list-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}
.dep-inventory-query-page >>> .app-container.first-inventory-page[style*="display: none"],
.dep-inventory-query-page >>> .app-container.list-page[style*="display: none"] {
  display: none !important;
}
</style>
