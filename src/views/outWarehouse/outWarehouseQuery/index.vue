<template>
  <div class="app-container out-warehouse-query-page">
    <el-tabs v-model="activeName" type="card" class="inventory-tabs-compact" @tab-click="handleTabClick">
      <el-tab-pane label="出/退库明细表" name="first"></el-tab-pane>
      <el-tab-pane label="出/退库汇总表" name="second"></el-tab-pane>
      <el-tab-pane label="出/退库汇总(供应商)" name="thirdSupplier"></el-tab-pane>
    </el-tabs>
    <!-- 使用 v-show 替代 v-if，切换时只切换显示不销毁组件，避免重复创建和请求 -->
    <FirstOutQuery v-show="activeName === 'first'" ref="firstQuery"/>
    <SecondOutQuery v-show="activeName === 'second'" ref="secondQuery"/>
    <ThirdSupplierOutQuery v-show="activeName === 'thirdSupplier'" ref="thirdSupplierQuery"/>
  </div>
</template>

<script>

import FirstOutQuery from "@/views/outWarehouse/outWarehouseQuery/firstOutQuery";
import SecondOutQuery from "@/views/outWarehouse/outWarehouseQuery/secondOutQuery";
import ThirdSupplierOutQuery from "@/views/outWarehouse/outWarehouseQuery/thirdSupplierOutQuery";


export default {
  name: "OutWarehouseQuery",
  components: {FirstOutQuery, SecondOutQuery, ThirdSupplierOutQuery},
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
  methods: {
    /** 切换到汇总表时再加载数据，避免首屏同时请求明细+汇总 */
    handleTabClick(tab) {
      if (tab.name === 'second' && this.$refs.secondQuery && typeof this.$refs.secondQuery.getList === 'function') {
        this.$nextTick(() => this.$refs.secondQuery.getList());
      }
      if (tab.name === 'thirdSupplier' && this.$refs.thirdSupplierQuery && typeof this.$refs.thirdSupplierQuery.getList === 'function') {
        this.$nextTick(() => this.$refs.thirdSupplierQuery.getList());
      }
    },
  },
};
</script>

<style>
/* 出/退库查询页：隐藏右侧滚动条、固定页面不滚动 */
body.inventory-query-fixed {
  overflow-y: hidden !important;
}
body.inventory-query-fixed .main-container {
  overflow-y: hidden !important;
}
</style>

<style scoped>
/* 出/退库查询页：顶部与左右保持 8px，搜索框与明细框整体增宽；固定高度避免溢出 */
.app-container.out-warehouse-query-page {
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
