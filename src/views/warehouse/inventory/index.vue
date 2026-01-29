<template>
  <div class="app-container inventory-query-page">

    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact">
      <el-tab-pane label="库存明细查询" name="first"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="second"></el-tab-pane>
      <el-tab-pane label="进销存明细表" name="third"></el-tab-pane>
      <el-tab-pane label="库存预警" name="alert"></el-tab-pane>
      <el-tab-pane label="有效期预警表" name="expiry"></el-tab-pane>
<!--      <el-tab-pane label="历史库存明细" name="fourth"></el-tab-pane>-->
    </el-tabs>
    <FirstInventory v-if="activeName === 'first'"></FirstInventory>
    <SecondInventory v-if="activeName === 'second'"></SecondInventory>
    <ThirdInventory v-if="activeName === 'third'"></ThirdInventory>
    <InventoryAlert v-if="activeName === 'alert'"></InventoryAlert>
    <ExpiryAlert v-if="activeName === 'expiry'"></ExpiryAlert>
    <FourthInventory v-if="activeName === 'fourth'"></FourthInventory>

  </div>
</template>

<script>
import FirstInventory from "@/views/warehouse/inventory/firstInventory.vue";
import SecondInventory from "@/views/warehouse/inventory/secondInventory.vue";
import ThirdInventory from "@/views/warehouse/inventory/thirdInventory.vue";
import InventoryAlert from "@/views/warehouse/inventory/inventoryAlert.vue";
import ExpiryAlert from "@/views/warehouse/inventory/expiryAlert.vue";
import FourthInventory from "@/views/warehouse/inventory/fourthInventory.vue";

export default {
  name: "Inventory",
  components: { FirstInventory, SecondInventory, ThirdInventory, InventoryAlert, ExpiryAlert, FourthInventory },
  data() {
    return {
      activeName: 'first',
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
};
</script>

<style>
/* 库存查询页：隐藏右侧滚动条、固定页面不滚动 */
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}
</style>

<style scoped>
/* 库存查询页：顶部与左右保持 8px，搜索框与明细框整体增宽；固定高度避免溢出 */
.app-container.inventory-query-page {
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  height: calc(100vh - 92px) !important;
  overflow-y: hidden !important;
  overflow-x: hidden !important;
}
/* 标签切换栏上移一点，与顶部间距 8px 由容器 padding-top 控制 */
.inventory-tabs-compact {
  margin-top: 0;
}
</style>
