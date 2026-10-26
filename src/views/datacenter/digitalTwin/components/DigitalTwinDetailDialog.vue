<template>
    <el-dialog
      :title="detailTitle"
      :visible.sync="detailOpen"
      width="880px"
      :append-to-body="!isFullscreen"
      :modal-append-to-body="!isFullscreen"
      custom-class="twin-dialog"
      @close="onDetailClose"
    >
      <el-table :data="detailRows" size="mini" max-height="420" v-loading="detailLoading">
        <el-table-column label="编码" prop="materialCode" width="110" show-overflow-tooltip />
        <el-table-column label="产品名称" prop="materialName" min-width="140" show-overflow-tooltip />
        <el-table-column label="规格" prop="materialSpeci" width="100" show-overflow-tooltip />
        <el-table-column label="批次" prop="batchNo" width="100" show-overflow-tooltip />
        <el-table-column label="数量" prop="qty" width="80" align="right" />
        <el-table-column label="效期" width="110">
          <template slot-scope="scope">
            <span :class="{ danger: scope.row.daysRemaining != null && scope.row.daysRemaining < 0 }">
              {{ scope.row.expiryDate || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="剩余天" prop="daysRemaining" width="80" align="center" />
        <el-table-column label="厂家" prop="factoryName" width="120" show-overflow-tooltip />
      </el-table>
      <div v-if="!detailRows.length && !detailLoading" class="empty-tip" style="padding: 24px">该货位暂无库存</div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DigitalTwinDetailDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DigitalTwin')],
  inheritAttrs: false
}
</script>

<style scoped>
.empty-tip { color: #6f93b3; font-size: 12px; text-align: center; padding: 16px 0; }
</style>
