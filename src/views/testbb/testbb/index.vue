<template>
  <div class="testbb-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="转材使用记录" name="tab1">
        <material-use-record />
      </el-tab-pane>

      <el-tab-pane label="检验项目记录" name="tab2">
        <test-item-record />
      </el-tab-pane>

      <el-tab-pane label="已开瓶记录" name="tab3">
        <opened-bottle-record />
      </el-tab-pane>

      <el-tab-pane label="转材库存" name="tab4">
        <material-inventory />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import MaterialUseRecord from './components/MaterialUseRecord.vue'
import TestItemRecord from './components/TestItemRecord.vue'
import OpenedBottleRecord from './components/OpenedBottleRecord.vue'
import MaterialInventory from './components/MaterialInventory.vue'

export default {
  name: 'Testbb',
  components: {
    MaterialUseRecord,
    TestItemRecord,
    OpenedBottleRecord,
    MaterialInventory
  },
  data() {
    return {
      activeTab: 'tab1'
    }
  }
}
</script>

<style scoped>
.testbb-container {
  padding: 20px;
}
</style> 