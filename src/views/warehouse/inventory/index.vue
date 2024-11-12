<template>
  <div class="app-container">

    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="库存明细查询" name="first"></el-tab-pane>
      <el-tab-pane label="库存汇总查询" name="second"></el-tab-pane>
<!--      <el-tab-pane label="进销存明细表" name="third"></el-tab-pane>-->
<!--      <el-tab-pane label="历史库存明细" name="fourth"></el-tab-pane>-->
    </el-tabs>
    <FirstInventory v-if="activeName === 'first'"></FirstInventory>
    <SecondInventory v-if="activeName === 'second'"></SecondInventory>
    <ThirdInventory v-if="activeName === 'third'"></ThirdInventory>
    <FourthInventory v-if="activeName === 'fourth'"></FourthInventory>

  </div>
</template>

<script>
import FirstInventory from "@/views/warehouse/inventory/firstInventory.vue";
import SecondInventory from "@/views/warehouse/inventory/secondInventory.vue";
import ThirdInventory from "@/views/warehouse/inventory/thirdInventory.vue";
import FourthInventory from "@/views/warehouse/inventory/fourthInventory.vue";


export default {
  name: "Inventory",
  components: {FirstInventory,SecondInventory,ThirdInventory,FourthInventory},
  data() {
    return {
      activeName: 'first',
    };
  },
};
</script>
