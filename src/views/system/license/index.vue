<template>
  <div class="app-container">
    <el-card shadow="never">
      <div slot="header">
        <span>离线授权</span>
      </div>
      <el-alert
        title="新版注册码仅一行，按厂商说明填写即可。旧版实例 ID 注册码仍可在本页导入（需权限）。登录页底部版本行连击 4 次可匿名导入。"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="实例 ID（数据库绑定）">
          <span style="word-break: break-all;">{{ status.instanceId || '-' }}</span>
          <el-button type="text" size="mini" style="margin-left: 8px;" @click="copyId">复制</el-button>
        </el-descriptions-item>
        <el-descriptions-item label="授权状态">
          <el-tag v-if="status.valid" type="success">有效</el-tag>
          <el-tag v-else-if="status.activated" type="danger">已过期</el-tag>
          <el-tag v-else type="warning">未激活</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="到期时间">
          {{ status.expireTime || '—' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">导入注册码</el-divider>
      <el-input
        v-model="licenseCode"
        type="textarea"
        :rows="4"
        placeholder="粘贴厂商提供的整行注册码"
        style="margin-bottom: 12px;"
      />
      <el-button
        v-hasPermi="['system:license:activate']"
        type="primary"
        :loading="submitting"
        @click="handleActivate"
      >激活 / 续期</el-button>
    </el-card>
  </div>
</template>

<script>
import { getLicenseStatus, activateLicense } from '@/api/system/license'

export default {
  name: 'SystemLicensePage',
  data() {
    return {
      status: {
        instanceId: '',
        expireTime: null,
        activated: false,
        valid: false
      },
      licenseCode: '',
      submitting: false
    }
  },
  created() {
    this.loadStatus()
  },
  methods: {
    tenantCustomerId() {
      const t = this.$store && this.$store.getters && this.$store.getters.tenant
      return t && t.customerId ? t.customerId : undefined
    },
    async loadStatus() {
      try {
        const res = await getLicenseStatus()
        this.status = res.data || this.status
      } catch (e) {
        this.$modal.msgError((e && e.message) || '获取授权状态失败')
      }
    },
    copyId() {
      const t = this.status.instanceId
      if (!t) return
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(() => {
          this.$modal.msgSuccess('已复制到剪贴板')
        }).catch(() => this.fallbackCopy(t))
      } else {
        this.fallbackCopy(t)
      }
    },
    fallbackCopy(text) {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$modal.msgSuccess('已复制到剪贴板')
      } catch (e) {
        this.$modal.msgError('复制失败，请手动选择复制')
      }
      document.body.removeChild(ta)
    },
    async handleActivate() {
      if (!this.licenseCode || !this.licenseCode.trim()) {
        this.$modal.msgWarning('请输入注册码')
        return
      }
      this.submitting = true
      try {
        await activateLicense(this.licenseCode.trim(), this.tenantCustomerId())
        this.$modal.msgSuccess('激活成功')
        this.licenseCode = ''
        await this.loadStatus()
      } catch (e) {
        this.$modal.msgError((e && e.message) || '激活失败')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>
