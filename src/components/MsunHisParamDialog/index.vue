<template>
  <el-dialog :title="title" :visible.sync="innerVisible" width="560px" append-to-body @close="handleClose">
    <p v-if="description" class="dialog-desc">{{ description }}</p>
    <el-form ref="formRef" :model="form" label-width="140px" size="small">
      <el-form-item
        v-for="field in fields"
        :key="field.key"
        :label="field.label"
        :prop="field.key"
        :rules="field.required ? [{ required: true, message: '必填', trigger: 'blur' }] : []"
      >
        <el-select v-if="field.options" v-model="form[field.key]" clearable placeholder="选填" style="width: 100%">
          <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-date-picker
          v-else-if="field.type === 'datetime'"
          v-model="form[field.key]"
          type="datetime"
          value-format="yyyy-MM-dd HH:mm:ss"
          placeholder="选择日期时间"
          style="width: 100%"
        />
        <el-input v-else v-model="form[field.key]" clearable :placeholder="field.hint || ''" />
        <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
      </el-form-item>
      <el-empty v-if="!fields || !fields.length" description="无需填写参数，直接确认即可" :image-size="48" />
    </el-form>
    <div slot="footer">
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">确认</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'MsunHisParamDialog',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '众阳 HIS 调用参数' },
    description: { type: String, default: '' },
    fields: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  data() {
    return {
      form: {}
    }
  },
  computed: {
    innerVisible: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    }
  },
  watch: {
    visible(val) {
      if (val) this.initForm()
    }
  },
  methods: {
    initForm() {
      const form = {}
      ;(this.fields || []).forEach(f => {
        form[f.key] = f.defaultValue != null ? f.defaultValue : ''
      })
      this.form = form
      this.$nextTick(() => {
        if (this.$refs.formRef) this.$refs.formRef.clearValidate()
      })
    },
    buildParams() {
      const params = {}
      Object.keys(this.form).forEach(k => {
        const v = this.form[k]
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          params[k] = v
        }
      })
      return params
    },
    submit() {
      const run = () => this.$emit('confirm', this.buildParams())
      if (!this.fields || !this.fields.length) {
        run()
        return
      }
      this.$refs.formRef.validate(valid => {
        if (valid) run()
      })
    },
    handleClose() {
      this.form = {}
    }
  }
}
</script>

<style scoped>
.dialog-desc { margin: 0 0 12px; font-size: 13px; color: #606266; }
.field-hint { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
