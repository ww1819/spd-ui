<template>
    <el-dialog title="自选科室核销" :visible.sync="selfDeptLowDialog.visible" width="480px" append-to-body @close="resetSelfDeptLowDialog">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="mb8"
        title="请使用「自选科室核销」并选择库存所在科室（看编码，勿点普通「低值」）。同名科室可能编码不同：库存为 487 的「二科」与执行科室对照的其它呼吸危重症科室不是同一科室。"
      />
      <el-form label-width="100px" size="small">
        <el-form-item label="执行科室">
          <span>{{ selfDeptLowDialog.execDeptText || '--' }}</span>
        </el-form-item>
        <el-form-item label="核销科室" required>
          <SelectDepartment
            v-model="selfDeptLowDialog.consumeDepartmentId"
            field-placeholder="编码/名称/简码（请核对该编码与库存一致，如 487）"
            :show-code-in-label="true"
            :finance-pick-mode="true"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="selfDeptLowDialog.visible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="selfDeptLowDialog.submitting" @click="submitSelfDeptLowConsume">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

export default {
  name: 'PatientChargeSelfDeptDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PatientChargeHis')],
  components: { SelectDepartment },
  inheritAttrs: false
}
</script>
