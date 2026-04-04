<template>
  <div class="app-container dep-inventory-query-page">
    <el-tabs v-model="activeTab" type="card" class="inventory-tabs-compact">
      <el-tab-pane label="库存明细查询" name="detail"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary"></el-tab-pane>
      <el-tab-pane label="科室进销存明细查询" name="inout"></el-tab-pane>
    </el-tabs>
    <!-- 使用 v-if 而非 v-show：隐藏时 display:none 会导致 el-table 测宽为 0，切回后横向滚动条异常；销毁重建可稳定恢复布局 -->
    <InventoryDetail v-if="activeTab === 'detail'" ref="detailQuery" />
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
