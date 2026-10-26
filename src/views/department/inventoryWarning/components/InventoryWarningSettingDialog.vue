<template>
    <el-dialog title="预警设置" :visible.sync="warningDialogVisible" width="500px" :close-on-click-modal="false">
      <el-form :model="warningForm" :rules="warningRules" ref="warningForm" label-width="120px">
        <el-form-item label="产品编码">
          <el-input v-model="warningForm.materialCode" disabled />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="warningForm.materialName" disabled />
        </el-form-item>
        <el-form-item label="数量少于预警" prop="minQtyWarning">
          <el-input-number v-model="warningForm.minQtyWarning" :min="0" :step="0.001" style="width: 100%" />
        </el-form-item>
        <el-form-item label="数量多余预警" prop="maxQtyWarning">
          <el-input-number v-model="warningForm.maxQtyWarning" :min="0" :step="0.001" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="warningDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitWarningForm">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'InventoryWarningSettingDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InventoryWarning')],
  inheritAttrs: false
}
</script>
