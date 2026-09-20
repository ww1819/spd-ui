<template>
  <div class="app-container dep-inventory-query-page">
    <el-tabs v-model="activeTab" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
      <el-tab-pane label="科室进销存明细查询" name="inout"></el-tab-pane>
      <el-tab-pane label="科室库存预警" name="alert"></el-tab-pane>
      <el-tab-pane label="科室库存近效期预警" name="nearExpiry"></el-tab-pane>
    </el-tabs>
    <!-- 使用 v-if 而非 v-show：隐藏时 display:none 会导致 el-table 测宽为 0，切回后横向滚动条异常；销毁重建可稳定恢复布局 -->
    <InventoryDetail v-if="activeTab === 'detail'" key="dep-inv-detail" list-variant="detail" ref="detailQuery" />
    <InventoryDetail v-if="activeTab === 'alert'" key="dep-inv-alert" list-variant="alert" ref="alertQuery" />
    <InventoryDetail v-if="activeTab === 'nearExpiry'" key="dep-inv-near-expiry" list-variant="nearExpiry" ref="nearExpiryQuery" />
    <InventorySummary v-if="activeTab === 'summary'" ref="summaryQuery" />
    <DepartmentInOutDetail v-if="activeTab === 'inout'" ref="inoutQuery" />
  </div>
</template>

<script>
import InventoryDetail from './components/InventoryDetail';
import InventorySummary from './components/InventorySummary';
import DepartmentInOutDetail from './components/DepartmentInOutDetail';

export default {
  name: "Inventory",
  components: {
    InventoryDetail,
    InventorySummary,
    DepartmentInOutDetail
  },
  data() {
    return {
      activeTab: 'detail'
    };
  },
  created() {
    this.applyDepInventoryTabFromRoute(this.$route);
  },
  watch: {
    $route(to) {
      this.applyDepInventoryTabFromRoute(to);
    }
  },
  methods: {
    /** 消息提醒等深链：?tab=nearExpiry | alert | detail | summary | inout */
    applyDepInventoryTabFromRoute(route) {
      const q = (route && route.query) || {};
      const tab = q.tab || q.activeTab;
      if (tab === 'nearExpiry') this.activeTab = 'nearExpiry';
      else if (tab === 'alert') this.activeTab = 'alert';
      else if (tab === 'summary') this.activeTab = 'summary';
      else if (tab === 'inout') this.activeTab = 'inout';
      else if (tab === 'detail') this.activeTab = 'detail';
    },
    handleTabClick(tab) {
      const refMap = {
        detail: 'detailQuery',
        summary: 'summaryQuery',
        inout: 'inoutQuery',
        alert: 'alertQuery',
        nearExpiry: 'nearExpiryQuery'
      };
      const refName = refMap[tab.name];
      const comp = refName && this.$refs[refName];
      if (!comp) return;
      this.$nextTick(() => {
        if (typeof comp.updateTableHeight === 'function') {
          comp.updateTableHeight();
          setTimeout(() => comp.updateTableHeight(), 80);
        }
      });
    }
  },
  activated() {
    document.body.classList.add('inventory-query-fixed');
  },
  deactivated() {
    document.body.classList.remove('inventory-query-fixed');
  },
  mounted() {
    document.body.classList.add('inventory-query-fixed');
  },
  beforeDestroy() {
    document.body.classList.remove('inventory-query-fixed');
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
