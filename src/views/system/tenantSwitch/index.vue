<template>
  <div class="app-container">
    <el-card shadow="never" class="switch-card">
      <div slot="header" class="clearfix">
        <span>租户/平台管理员模式选择</span>
      </div>
      <el-alert
        title="查看耗材/库房等业务菜单请选「机构管理员」并选择三院等租户；「平台管理员」仅适合系统管理（参数/用户等），业务列表需要租户上下文。"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />

      <el-form label-width="120px" size="small">
        <el-form-item label="登录模式">
          <el-radio-group v-model="mode">
            <el-radio label="tenant">机构管理员（super_01）</el-radio>
            <el-radio label="platform">平台管理员</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="目标租户">
          <el-select
            v-model="customerId"
            filterable
            clearable
            placeholder="请选择租户（如衡水市第三人民医院）"
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
import Cookies from 'js-cookie'

export default {
  name: 'TenantSwitchPage',
  data() {
    return {
      mode: 'tenant',
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
    this.customerId = (tenant && tenant.customerId) || Cookies.get('customerId') || ''
    this.mode = 'tenant'
    this.redirect = (this.$route && this.$route.query && this.$route.query.redirect) ? this.$route.query.redirect : '/'
    this.loadOptions()
  },
  methods: {
    async loadOptions() {
      try {
        const res = await getCustomerOptions('hc')
        this.customerOptions = (res && res.data) || []
        if (!this.customerId && this.customerOptions.length) {
          const def = this.customerOptions.find(o => o.customerId === 'hengsui-third-001')
          this.customerId = (def && def.customerId) || this.customerOptions[0].customerId
        }
      } catch (e) {
        this.customerOptions = []
      }
    },
    async handleSwitch() {
      this.switching = true
      try {
        if (!this.customerId) {
          this.$message.warning('请选择目标租户')
          return
        }
        if (this.mode === 'tenant') {
          await this.$store.dispatch('SwitchTenant', {
            customerId: this.customerId,
            systemType: 'hc'
          })
          this.$message.success('租户切换成功，正在刷新会话...')
          window.location.href = this.redirect || '/'
        } else {
          // 平台管理员模式：保留所选机构作为工作台租户（业务页依赖 X-Tenant-Id）
          const userId = (this.$store && this.$store.state && this.$store.state.user)
            ? this.$store.state.user.userId
            : ''
          if (String(userId) !== '1') {
            this.$message.warning('当前会话不是平台管理员，无法切换为平台管理员模式')
            return
          }
          const opt = (this.customerOptions || []).find(o => o.customerId === this.customerId) || {}
          this.$store.commit('SET_TENANT', {
            customerId: this.customerId,
            customerCode: opt.customerCode,
            customerName: opt.customerName
          })
          this.$store.commit('SET_TENANT_SYNCED_AT', Date.now())
          Cookies.set('customerId', this.customerId, { expires: 30 })
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

