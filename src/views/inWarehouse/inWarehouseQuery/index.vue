<template>
  <div class="app-container inWarehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inWarehouse-query-tabs-compact">
      <el-tab-pane label="入/退货明细表" name="first"></el-tab-pane>
      <el-tab-pane label="入/退货汇总表" name="second"></el-tab-pane>
    </el-tabs>
    <FirstQuery v-if="activeName === 'first'"></FirstQuery>
    <SecondQuery v-if="activeName === 'second'"></SecondQuery>
  </div>
</template>

<script>
import FirstQuery from '@/views/inWarehouse/inWarehouseQuery/firstQuery';
import SecondQuery from '@/views/inWarehouse/inWarehouseQuery/secondQuery';

export default {
  name: "InWarehouseQuery",
  components: {FirstQuery, SecondQuery},
  data() {
    return {
      activeName: 'first',
    };
  },
  activated() {
    document.body.classList.add('inWarehouse-query-fixed');
  },
  deactivated() {
    document.body.classList.remove('inWarehouse-query-fixed');
  },
  mounted() {
    document.body.classList.add('inWarehouse-query-fixed');
  },
  beforeDestroy() {
    document.body.classList.remove('inWarehouse-query-fixed');
  },
};
</script>

<style>
/* 与库存查询页面一致：固定高度、不滚动 */
body.inWarehouse-query-fixed {
  overflow-y: hidden !important;
}
body.inWarehouse-query-fixed .main-container {
  overflow-y: hidden !important;
}
</style>

<style scoped>
/* 与库存查询页面一致：顶部与左右 8px，固定高度避免溢出 */
.app-container.inWarehouse-query-page {
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  height: calc(100vh - 92px) !important;
  overflow-y: hidden !important;
  overflow-x: hidden !important;
}
.inWarehouse-query-tabs-compact {
  margin-top: 0;
}
</style>
