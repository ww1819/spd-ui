<template>
    <!-- 批量修改密码 -->
    <el-dialog title="批量修改密码" :visible.sync="batchPasswordOpen" width="440px" append-to-body @close="resetBatchPasswordForm">
      <p style="color:#909399; margin: 0 0 12px; line-height: 1.5;">
        将为本租户下<b>所有普通用户</b>统一设置新密码，<b>不包含</b>平台 admin 账号及机构 super 账号（含 super_01、super 工作组用户）。
      </p>
      <el-form ref="batchPasswordForm" :model="batchPasswordForm" :rules="batchPasswordRules" label-width="88px" size="small">
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="batchPasswordForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
            autocomplete="new-password"
            maxlength="20"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="batchPasswordOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitBatchPassword">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'UserBatchPasswordDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'User')],
  inheritAttrs: false
}
</script>
