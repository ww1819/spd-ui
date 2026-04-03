<template>
  <div class="app-container dep-inventory-query-page">
    <el-tabs v-model="activeTab" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
      <el-tab-pane label="科室进销存明细查询" name="inout"></el-tab-pane>
    </el-tabs>
    <!-- 与出/退库查询页一致：内容在 el-tabs 外，保证与 firstOutQuery 相同的顶部间距与表格高度 -->
    <InventoryDetail v-show="activeTab === 'detail'" ref="detailQuery" />
    <InventorySummary v-show="activeTab === 'summary'" ref="summaryQuery" />
    <DepartmentInOutDetail v-show="activeTab === 'inout'" ref="inoutQuery" />
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
  },
  methods: {
    /** 切换到非默认 Tab 时再拉数，与出退库汇总表懒加载一致，避免首屏多请求 */
    handleTabClick(tab) {
      if (tab.name === 'summary' && this.$refs.summaryQuery && typeof this.$refs.summaryQuery.getList === 'function') {
        this.$nextTick(() => this.$refs.summaryQuery.getList());
      }
      if (tab.name === 'inout' && this.$refs.inoutQuery && typeof this.$refs.inoutQuery.getList === 'function') {
        this.$nextTick(() => this.$refs.inoutQuery.getList());
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
