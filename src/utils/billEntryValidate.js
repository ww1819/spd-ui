/**
 * 主从单据保存前：至少一条明细（前端校验，与后端 MasterDetailValidateUtil 一致）
 * @param {Array} entryList 明细列表
 * @param {Vue} vm 组件实例（用于 $modal）
 * @param {string} [message] 提示文案
 * @returns {boolean} 是否通过
 */
export function assertBillHasEntries(entryList, vm, message) {
  const msg = message || '请至少添加一条明细';
  if (!entryList || entryList.length === 0) {
    if (vm && vm.$modal) {
      vm.$modal.msgError(msg);
    }
    return false;
  }
  return true;
}

/**
 * 至少一条已选耗材的明细（materialId 非空）
 */
export function assertBillHasMaterialEntries(entryList, vm, message) {
  const msg = message || '请至少添加一条有效明细（选择耗材）';
  const list = entryList || [];
  const valid = list.filter(e => e && e.materialId != null && e.materialId !== '');
  if (valid.length === 0) {
    if (vm && vm.$modal) {
      vm.$modal.msgError(msg);
    }
    return false;
  }
  return true;
}
