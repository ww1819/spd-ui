<template>
  <div class="app-container">
    <el-card shadow="never" v-loading="loading">
      <div slot="header" class="clearfix">
        <span>HIS 计费自动处理</span>
      </div>

      <el-alert
        v-if="tenantRestricted"
        class="mb16"
        type="warning"
        show-icon
        :closable="false"
        title="当前租户未开通计费自动处理配置，仅衡水三院租户可使用。"
      />
      <el-alert
        v-else
        class="mb16"
        type="info"
        show-icon
        :closable="false"
        title="在患者收费查询执行住院/门诊计费抓取后，按以下开关自动处理本批次镜像数据；单行失败仅记日志，不影响其它行。"
      />

      <el-form ref="form" :model="form" label-width="200px" :disabled="tenantRestricted || !canEdit">
        <el-form-item label="自动处理收费（低值消耗）">
          <el-switch
            v-model="form.lvAutoConsumeEnabled"
            active-value="1"
            inactive-value="0"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-tip">
            抓取完成后，对本批次「待处理」且非退费的低值计费行，自动生成并审核科室批量消耗。
          </div>
        </el-form-item>
        <el-form-item label="自动处理退费（库存返还）">
          <el-switch
            v-model="form.billingAutoRefundEnabled"
            active-value="1"
            inactive-value="0"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-tip">
            抓取完成后，对本批次带「退费关联 ID」的计费行，按原收费明细自动反消耗并回补科室库存（低值/高值均支持）。
          </div>
        </el-form-item>
        <el-form-item v-if="canEdit">
          <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
          <el-button @click="load">刷新</el-button>
        </el-form-item>
        <el-form-item v-else>
          <el-tag type="info">无修改权限，仅可查看</el-tag>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getTenantBillingSetting, saveTenantBillingSetting } from '@/api/department/patientCharge'
import { checkPermi } from '@/utils/permission'

export default {
  name: 'HisBillingAutoSetting',
  data() {
    return {
      loading: false,
      saving: false,
      tenantRestricted: false,
      form: {
        lvAutoConsumeEnabled: '0',
        billingAutoRefundEnabled: '0'
      }
    }
  },
  computed: {
    canEdit() {
      return checkPermi(['department:patientCharge:billingTenantSetting'])
    }
  },
  created() {
    this.load()
  },
  methods: {
    load() {
      this.loading = true
      this.tenantRestricted = false
      getTenantBillingSetting()
        .then(res => {
          const d = res.data || {}
          this.form.lvAutoConsumeEnabled = d.lvAutoConsumeEnabled === '1' ? '1' : '0'
          this.form.billingAutoRefundEnabled = d.billingAutoRefundEnabled === '1' ? '1' : '0'
        })
        .catch(err => {
          const msg = (err && err.message) || ''
          if (msg.indexOf('衡水三院') >= 0 || msg.indexOf('仅') >= 0) {
            this.tenantRestricted = true
          }
        })
        .finally(() => {
          this.loading = false
        })
    },
    submitForm() {
      if (!this.canEdit) {
        return
      }
      this.saving = true
      saveTenantBillingSetting({
        lvAutoConsumeEnabled: this.form.lvAutoConsumeEnabled,
        billingAutoRefundEnabled: this.form.billingAutoRefundEnabled
      })
        .then(() => {
          this.$modal.msgSuccess('保存成功')
          this.load()
        })
        .finally(() => {
          this.saving = false
        })
    }
  }
}
</script>

<style scoped>
.mb16 {
  margin-bottom: 16px;
}
.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  max-width: 560px;
}
</style>
