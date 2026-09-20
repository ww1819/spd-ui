<template>
  <div class="app-container out-warehouse-query-page">

    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact">
      <el-tab-pane label="库存明细查询" name="first"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="second"></el-tab-pane>
      <el-tab-pane label="进销存明细表" name="third"></el-tab-pane>
      <el-tab-pane label="库存预警" name="alert"></el-tab-pane>
      <el-tab-pane label="有效期预警表" name="expiry"></el-tab-pane>
      <el-tab-pane label="库存分布分析表" name="distribution"></el-tab-pane>
      <!-- 运维对账用，暂不对客户开放：历史库存明细 -->
      <!-- <el-tab-pane label="历史库存明细" name="fourth"></el-tab-pane> -->
    </el-tabs>
    <FirstInventory v-if="activeName === 'first'"></FirstInventory>
    <SecondInventory v-if="activeName === 'second'"></SecondInventory>
    <ThirdInventory v-if="activeName === 'third'"></ThirdInventory>
    <InventoryAlert v-if="activeName === 'alert'"></InventoryAlert>
    <ExpiryAlert v-if="activeName === 'expiry'"></ExpiryAlert>
    <InventoryDistribution v-if="activeName === 'distribution'"></InventoryDistribution>
    <!-- <FourthInventory v-if="activeName === 'fourth'"></FourthInventory> -->

  </div>
</template>

<script>
import FirstInventory from "@/views/warehouse/inventory/firstInventory.vue";
import SecondInventory from "@/views/warehouse/inventory/secondInventory.vue";
import ThirdInventory from "@/views/warehouse/inventory/thirdInventory.vue";
import InventoryAlert from "@/views/warehouse/inventory/inventoryAlert.vue";
import ExpiryAlert from "@/views/warehouse/inventory/expiryAlert.vue";
import InventoryDistribution from "@/views/warehouse/inventory/inventoryDistribution.vue";
import FourthInventory from "@/views/warehouse/inventory/fourthInventory.vue";

export default {
  name: "Inventory",
  components: { FirstInventory, SecondInventory, ThirdInventory, InventoryAlert, ExpiryAlert, InventoryDistribution, FourthInventory },
  data() {
    return {
      activeName: 'first',
    };
  },
  created() {
    this.applyInventoryTabFromRoute(this.$route);
  },
  watch: {
    $route(to) {
      this.applyInventoryTabFromRoute(to);
    }
  },
  methods: {
    /** 支持从消息提醒等场景深链：?tab=expiry | ?tab=alert */
    applyInventoryTabFromRoute(route) {
      const q = (route && route.query) || {};
      const tab = q.tab || q.activeTab;
      if (tab === 'expiry') {
        this.activeName = 'expiry';
      } else if (tab === 'alert') {
        this.activeName = 'alert';
      }
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
/* 库存查询页：隐藏右侧滚动条、固定页面不滚动 */
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}

/* 仅加粗库存明细表底部横向滚动条 */
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
body.inventory-query-fixed .out-warehouse-query-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
}
body.inventory-query-fixed .out-warehouse-query-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}
</style>

<style scoped>
/* 库存查询页：与出/退库查询一致，顶部与左右 8px，flex 留给子页完整高度 */
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
/* 子页（明细/汇总等）占满剩余高度 */
.out-warehouse-query-page >>> .app-container.first-inventory-page,
.out-warehouse-query-page >>> .app-container.list-page {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}
</style>
