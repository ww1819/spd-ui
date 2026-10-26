<template>
    <el-dialog
      title="请先选择科室"
      :visible.sync="refDeptPickOpen"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
      @closed="refPendingDepartmentId = null"
    >
      <p style="margin:0 0 12px;color:#909399;font-size:13px">引用验收单带出明细前，需要先选择出库科室；取消则不增加明细。</p>
      <el-form label-width="70px" size="small">
        <el-form-item label="科室" required>
          <SelectDepartment v-model="refPendingDepartmentId" :disabled="refDeptPickLocked" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="refDeptPickOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRefDeptPick">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

export default {
  name: 'GzOrderAuditDeptDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'OrderAudit')],
  components: { SelectDepartment },
  inheritAttrs: false
}
</script>
