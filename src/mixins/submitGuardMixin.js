/**
 * 保存 / 审核按钮防重复点击：提交中置 loading，并互斥锁定。
 * 弹窗经 hostProxyMixin 代理宿主 data/computed 后可直接绑定 :loading="saveSubmitting"。
 */
export default {
  data() {
    return {
      saveSubmitting: false,
      auditSubmitting: false
    }
  },
  computed: {
    submitBusy() {
      return !!(this.saveSubmitting || this.auditSubmitting)
    }
  },
  methods: {
    /** @param {() => any} executor 实际请求（可返回 Promise）；忙碌时 reject，避免误走成功回调 */
    runSaveSubmit(executor) {
      if (this.saveSubmitting || this.auditSubmitting) {
        return Promise.reject(new Error('submit_busy'))
      }
      this.saveSubmitting = true
      return Promise.resolve()
        .then(() => executor())
        .finally(() => {
          this.saveSubmitting = false
        })
    },
    /** @param {() => any} executor 实际请求（可返回 Promise）；忙碌时 reject，避免误走成功回调 */
    runAuditSubmit(executor) {
      if (this.saveSubmitting || this.auditSubmitting) {
        return Promise.reject(new Error('submit_busy'))
      }
      this.auditSubmitting = true
      return Promise.resolve()
        .then(() => executor())
        .finally(() => {
          this.auditSubmitting = false
        })
    }
  }
}
