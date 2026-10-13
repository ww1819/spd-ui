<template>
  <div class="app-container out-warehouse-query-page scrap-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="报损明细表" name="detail" />
      <el-tab-pane label="报损汇总表" name="summary" />
    </el-tabs>
    <ScrapDetailQuery v-show="activeName === 'detail'" ref="detailQuery" />
    <ScrapSummaryQuery v-show="activeName === 'summary'" ref="summaryQuery" />
  </div>
</template>

<script>
import ScrapDetailQuery from "@/views/warehouse/scrap/query/scrapDetailQuery.vue";
import ScrapSummaryQuery from "@/views/warehouse/scrap/query/scrapSummaryQuery.vue";

export default {
  name: "WarehouseScrapQuery",
  components: { ScrapDetailQuery, ScrapSummaryQuery },
  data() {
    return {
      activeName: "detail",
      summaryLoaded: false
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
      const name = tab && tab.name;
      if (name === "summary" && this.$refs.summaryQuery) {
        this.$nextTick(() => {
          if (!this.summaryLoaded && typeof this.$refs.summaryQuery.getList === "function") {
            this.$refs.summaryQuery.getList();
            this.summaryLoaded = true;
          }
          if (typeof this.$refs.summaryQuery.updateTableHeight === "function") {
            this.$refs.summaryQuery.updateTableHeight();
            setTimeout(() => this.$refs.summaryQuery.updateTableHeight(), 80);
          }
        });
      }
      if (name === "detail" && this.$refs.detailQuery && typeof this.$refs.detailQuery.updateTableHeight === "function") {
        this.$nextTick(() => {
          this.$refs.detailQuery.updateTableHeight();
          setTimeout(() => this.$refs.detailQuery.updateTableHeight(), 80);
        });
      }
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
body.inventory-query-fixed .out-warehouse-query-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
body.inventory-query-fixed .out-warehouse-query-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
body.inventory-query-fixed .out-warehouse-query-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
body.inventory-query-fixed .out-warehouse-query-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
body.inventory-query-fixed .out-warehouse-query-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}
</style>

<style scoped>
.app-container.out-warehouse-query-page {
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  height: calc(100vh - 92px) !important;
  max-height: calc(100vh - 92px) !important;
  overflow-y: hidden !important;
  overflow-x: hidden !important;
  min-height: 0 !important;
  box-sizing: border-box !important;
}
.inventory-tabs-compact {
  margin-top: 0;
  flex: 0 0 auto;
}
.inventory-tabs-compact >>> .el-tabs__header {
  margin: 0 0 4px !important;
}
.inventory-tabs-compact >>> .el-tabs__nav-wrap {
  margin-bottom: 0;
}
.out-warehouse-query-page >>> .app-container.first-inventory-page,
.out-warehouse-query-page >>> .app-container.list-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}
</style>
