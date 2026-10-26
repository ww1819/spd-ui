<template>
    <el-dialog
      title="选择出库科室"
      :visible.sync="rkOutDeptDialogVisible"
      append-to-body
      width="420px"
      :close-on-click-modal="false"
      @close="handleRkOutDeptDialogClose"
    >
      <p v-if="rkOutDeptMissingHint" style="margin: 0 0 12px; color: #606266; font-size: 13px;">
        所选入库单未填写申请科室，请指定本次出库的科室（确定后加载明细；取消则不引用）。
      </p>
      <el-form label-width="80px" size="small">
        <el-form-item label="出库科室" required>
          <SelectDepartment ref="rkOutDeptSelect" v-model="rkOutDeptTempId" @change="handleRkOutDeptChange" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancelRkOutDeptPick">取 消</el-button>
        <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="confirmRkOutDept">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

export default {
  name: 'OutWarehouseApplyDeptDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.rkOutDeptDialogVisible !== undefined)],
  components: { SelectDepartment },
  inheritAttrs: false
}
</script>
