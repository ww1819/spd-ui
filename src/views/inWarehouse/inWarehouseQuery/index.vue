<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card">
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
  components: {FirstQuery,SecondQuery},
  data() {
    return {
      activeName: 'first',
    };
  },
};
</script>
