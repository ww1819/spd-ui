<template>
  <div class="app-container">
    <el-card shadow="never" class="switch-card">
      <div slot="header" class="clearfix">
        <span>租户/平台管理员模式选择</span>
      </div>
      <el-alert
        title="选择“租户管理员”后，将以所选租户 super_01 身份进入；选择“平台管理员”后，将以平台管理员身份操作（不进行租户隔离）。"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />

      <el-form label-width="120px" size="small">
        <el-form-item label="登录模式">
          <el-radio-group v-model="mode">
            <el-radio label="tenant">租户管理员（super_01）</el-radio>
            <el-radio label="platform">平台管理员</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="mode === 'tenant'" label="目标租户">
          <el-select
            v-model="customerId"
            filterable
            clearable
            placeholder="请选择租户"
            style="width: 420px;"
          >
            <el-option
              v-for="item in customerOptions"
              :key="item.customerId"
              :label="`${item.customerCode || '-'} ${item.customerName || ''}`"
              :value="item.customerId"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="switching" @click="handleSwitch">
            {{ mode === 'tenant' ? '切换并进入' : '进入系统' }}
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getCustomerOptions } from '@/api/login'

export default {
  name: 'TenantSwitchPage',
  data() {
    return {
      mode: 'platform',
      customerId: '',
      customerOptions: [],
      switching: false,
      redirect: '/'
    }
  },
  created() {
    const tenant = this.$store && this.$store.state && this.$store.state.user
      ? this.$store.state.user.tenant
      : null
    this.customerId = tenant && tenant.customerId ? tenant.customerId : ''
    this.mode = this.customerId ? 'tenant' : 'platform'
    this.redirect = (this.$route && this.$route.query && this.$route.query.redirect) ? this.$route.query.redirect : '/'
    this.loadOptions()
  },
  methods: {
    async loadOptions() {
      try {
        const res = await getCustomerOptions('hc')
        this.customerOptions = (res && res.data) || []
      } catch (e) {
        this.customerOptions = []
      }
    },
    async handleSwitch() {
      this.switching = true
      try {
        if (this.mode === 'tenant') {
          if (!this.customerId) {
            this.$message.warning('请选择租户')
            return
          }
          await this.$store.dispatch('SwitchTenant', {
            customerId: this.customerId,
            systemType: 'hc'
          })
          this.$message.success('租户切换成功，正在刷新会话...')
          window.location.href = this.redirect || '/'
        } else {
          // 平台管理员模式：清空租户上下文，避免后续请求带租户隔离头
          const userId = (this.$store && this.$store.state && this.$store.state.user)
            ? this.$store.state.user.userId
            : ''
          if (String(userId) !== '1') {
            this.$message.warning('当前会话不是平台管理员，无法切换为平台管理员模式')
            return
          }
          this.$store.commit('SET_TENANT', null)
          this.$store.commit('SET_TENANT_SYNCED_AT', 0)
          this.$message.success('已切换为平台管理员模式')
          this.$router.push({ path: this.redirect || '/' }).catch(() => {})
        }
      } catch (e) {
        this.$message.error((e && e.message) || '租户切换失败')
      } finally {
        this.switching = false
      }
    },
    handleCancel() {
      this.$router.push({ path: this.redirect || '/' }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.switch-card {
  max-width: 680px;
}
</style>

