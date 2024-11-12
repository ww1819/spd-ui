<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="出/退库明细表" name="first"></el-tab-pane>
      <el-tab-pane label="出/退库汇总表" name="second"></el-tab-pane>
    </el-tabs>
    <FirstOutQuery v-if="activeName === 'first'"></FirstOutQuery>
    <SecondOutQuery v-if="activeName === 'second'"></SecondOutQuery>
  </div>
</template>

<script>

import FirstOutQuery from "@/views/outWarehouse/outWarehouseQuery/firstOutQuery";
import SecondOutQuery from "@/views/outWarehouse/outWarehouseQuery/secondOutQuery";


export default {
  name: "OutWarehouseQuery",
  components: {FirstOutQuery,SecondOutQuery},
  data() {
    return {
      activeName: 'first',
    };
  },
};
</script>
