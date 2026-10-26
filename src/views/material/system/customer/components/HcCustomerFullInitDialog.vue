<template>
    <el-dialog title="全库初始化（高危）" :visible.sync="openFullInit" width="520px" append-to-body @close="fullInitTokenInput = ''">
      <el-alert type="error" :closable="false" show-icon title="将清空所有租户与业务数据，仅保留 admin 与平台菜单/字典等。执行前请务必备份数据库。" style="margin-bottom: 12px" />
      <p style="color:#606266;font-size:13px;margin-bottom:8px">请在下方输入确认口令（区分大小写）：</p>
      <el-input v-model="fullInitTokenInput" placeholder="CONFIRM_PURGE_ALL_TENANT_DATA" clearable />
      <div slot="footer" class="dialog-footer">
        <el-button type="danger" class="spd-btn spd-btn--danger" :disabled="fullInitTokenInput !== FULL_INIT_TOKEN" @click="submitFullInit">确认执行</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="openFullInit = false">取 消</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcCustomerFullInitDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomer')],
  inheritAttrs: false
}
</script>
