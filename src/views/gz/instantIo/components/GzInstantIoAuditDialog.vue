<template>
    <el-dialog title="即入即出审核" :visible.sync="auditDialogVisible" width="520px" append-to-body @close="resetAuditDialog">
      <p>已选 <strong>{{ selectedCount }}</strong> 条，将按供应商生成入库单(G-RK)与出库单(G-CK)。</p>
      <el-form label-width="100px" size="small">
        <el-form-item label="结算仓库" required>
          <el-select v-model="auditWarehouseId" placeholder="请选择结算仓库" filterable style="width:100%">
            <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="submitting" @click="submitAudit">审核</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzInstantIoAuditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'GzInstantIo')],
  inheritAttrs: false
}
</script>
