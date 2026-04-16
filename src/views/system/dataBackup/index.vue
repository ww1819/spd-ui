<template>
  <div class="app-container">
    <el-card shadow="never">
      <div slot="header" class="clearfix">
        <span>数据备份配置</span>
      </div>
      <el-form ref="form" :model="form" :rules="rules" label-width="140px" v-loading="loading">
        <el-form-item label="备份目录" prop="backupPath">
          <el-input
            v-model="form.backupPath"
            placeholder="服务器本地目录，如 D:/backup 或 /home/spd/backup（目录不存在会自动创建）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="mysqldump 路径" prop="mysqldumpPath">
          <el-input
            v-model="form.mysqldumpPath"
            placeholder="可选：mysqldump 可执行文件绝对路径（Windows 示例：C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe）"
            maxlength="500"
            show-word-limit
          />
          <div class="tip mt6">为空则使用服务器 PATH 中的 mysqldump。</div>
        </el-form-item>
        <el-form-item label="每日备份时间" prop="backupTime">
          <el-time-select
            v-model="form.backupTime"
            :picker-options="{ start: '00:00', step: '00:15', end: '23:45' }"
            placeholder="选择时间"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="保留天数" prop="retainDays">
          <el-input-number v-model="form.retainDays" :min="0" :max="3650" controls-position="right" />
          <span class="tip">0 表示不自动清理历史 .sql.gz 文件</span>
        </el-form-item>
        <el-form-item label="启用定时备份">
          <template v-if="checkPermi(['system:dataBackup:changeStatus'])">
            <el-switch
              v-model="form.enabled"
              active-value="1"
              inactive-value="0"
              @change="onEnabledChange"
            />
          </template>
          <el-tag v-else type="info">{{ form.enabled === '1' ? '已启用' : '已停用' }}</el-tag>
        </el-form-item>
        <el-form-item label="最近一次备份">
          <span>{{ form.lastBackupTime || '—' }}</span>
          <span class="ml8">{{ statusText(form.lastBackupStatus) }}</span>
        </el-form-item>
        <el-form-item label="结果说明">
          <el-input type="textarea" :rows="2" v-model="form.lastBackupMessage" readonly />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm" v-hasPermi="['system:dataBackup:edit']">保存配置</el-button>
          <el-button type="success" @click="handleRunNow" v-hasPermi="['system:dataBackup:run']">立即备份</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getDataBackup, saveDataBackup, changeDataBackupStatus, runDataBackupNow } from '@/api/system/dataBackup'
import { checkPermi } from '@/utils/permission'

export default {
  name: 'DataBackup',
  data() {
    return {
      loading: false,
      form: {
        id: null,
        backupPath: 'D:/backup',
        mysqldumpPath: '',
        backupTime: '02:00',
        enabled: '0',
        retainDays: 7,
        lastBackupTime: null,
        lastBackupStatus: null,
        lastBackupMessage: null
      },
      rules: {
        backupPath: [{ max: 500, message: '长度不能超过500', trigger: 'blur' }],
        mysqldumpPath: [{ max: 500, message: '长度不能超过500', trigger: 'blur' }],
        retainDays: [{ required: true, message: '请输入保留天数', trigger: 'change' }]
      }
    }
  },
  created() {
    this.load()
  },
  methods: {
    checkPermi,
    statusText(s) {
      if (!s) return ''
      const m = { success: '成功', failed: '失败', skipped: '跳过' }
      return m[s] || s
    },
    load() {
      this.loading = true
      getDataBackup()
        .then(res => {
          this.form = Object.assign(this.form, res.data || {})
        })
        .finally(() => {
          this.loading = false
        })
    },
    onEnabledChange(val) {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存时间与目录')
        this.form.enabled = '0'
        return
      }
      changeDataBackupStatus(val)
        .then(() => {
          this.$modal.msgSuccess('状态已更新')
          this.load()
        })
        .catch(() => {
          this.form.enabled = val === '1' ? '0' : '1'
          this.load()
        })
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const payload = {
          id: this.form.id,
          backupPath: this.form.backupPath,
          mysqldumpPath: this.form.mysqldumpPath,
          backupTime: this.form.backupTime,
          enabled: this.form.enabled,
          retainDays: this.form.retainDays
        }
        saveDataBackup(payload).then(() => {
          this.$modal.msgSuccess('保存成功')
          this.load()
        })
      })
    },
    handleRunNow() {
      this.$modal
        .confirm('确认立即执行一次数据库备份？')
        .then(() => runDataBackupNow())
        .then(() => {
          this.$modal.msgSuccess('已触发，请稍后刷新查看结果')
          setTimeout(() => this.load(), 3000)
        })
        .catch(() => {})
    }
  }
}
</script>

<style scoped>
.tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}
.mt6 {
  margin-top: 6px;
}
.ml8 {
  margin-left: 8px;
}
</style>
