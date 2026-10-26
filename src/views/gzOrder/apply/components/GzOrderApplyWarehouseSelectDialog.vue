<template>
    <!-- 仓库选择弹窗 -->
    <el-dialog
      title="请选择仓库"
      :visible.sync="warehouseSelectDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-select v-model="selectedWarehouseId" placeholder="请选择仓库" style="width: 100%">
        <el-option
          v-for="warehouse in availableWarehouses"
          :key="warehouse.id"
          :label="warehouse.name"
          :value="warehouse.id"
        />
      </el-select>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="cancelWarehouseSelect">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="handleWarehouseSelect(selectedWarehouseId)">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzOrderApplyWarehouseSelectDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.gzOrderEntryList !== undefined)],
  inheritAttrs: false
}
</script>
