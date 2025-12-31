<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="库存明细查询" name="detail">
        <InventoryDetail />
      </el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="summary">
        <InventorySummary />
      </el-tab-pane>
      <el-tab-pane label="科室进销存明细查询" name="inout">
        <DepartmentInOutDetail />
      </el-tab-pane>
    </el-tabs>
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
  }
};
</script>
