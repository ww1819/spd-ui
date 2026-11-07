/**
 * 单据修改前守卫：对方已审时拦截打开编辑，避免带着 billStatus=1 保存打回未审。
 * @param {Object} data 单据详情
 * @param {Object} vm Vue 实例（需有 $modal）
 * @param {Object} [opts]
 * @param {string} [opts.statusField='billStatus'] 状态字段
 * @param {any} [opts.auditedValue=2] 已审状态值
 * @param {string} [opts.auditDateField='auditDate'] 审核时间字段
 * @param {string} [opts.docLabel='该单据'] 提示中的单据称呼
 * @returns {boolean} true=可继续编辑
 */
export function assertBillEditableBeforeEdit(data, vm, opts = {}) {
  if (!data) {
    return true
  }
  const statusField = opts.statusField || 'billStatus'
  const auditedValue = opts.auditedValue != null ? opts.auditedValue : 2
  const auditDateField = opts.auditDateField || 'auditDate'
  const docLabel = opts.docLabel || '该单据'
  const status = data[statusField]
  const audited = status == auditedValue || String(status) === String(auditedValue)
  const hasAuditDate = !!data[auditDateField]
  if (audited || hasAuditDate) {
    if (vm && vm.$modal && typeof vm.$modal.msgWarning === 'function') {
      vm.$modal.msgWarning(docLabel + '已审核，不能修改；请刷新后查看。如需调整请走退库/退货/冲回流程')
    }
    return false
  }
  return true
}
