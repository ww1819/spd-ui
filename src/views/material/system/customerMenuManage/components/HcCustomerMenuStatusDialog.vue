<template>
    <el-dialog :title="statusDialogTitle" :visible.sync="openStatus" width="480px" append-to-body>
      <el-form ref="statusForm" :model="statusForm" :rules="statusRules" label-width="80px">
        <el-form-item label="功能名称"><el-input v-model="statusForm.menuName" disabled /></el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="statusForm.reason" type="textarea" :placeholder="statusForm.status === '1' ? '请输入停用原因' : '请输入启用原因'" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitStatusForm">确 定</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="openStatus = false">取 消</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcCustomerMenuStatusDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomerMenuManage')],
  inheritAttrs: false
}
</script>
