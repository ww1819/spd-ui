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

/**
 * 已选耗材行：数量为空、无效或≤0 时默认置为 defaultQty（通常 1），并尽量重算金额
 */
export function normalizeBillMaterialLineQtyDefaultOne(entryList, defaultQty = 1) {
  (entryList || []).forEach(e => {
    if (!e || e.materialId == null || e.materialId === '') {
      return;
    }
    const n = Number(e.qty);
    if (e.qty == null || e.qty === '' || !Number.isFinite(n) || n <= 0) {
      e.qty = defaultQty;
      const price = Number(e.unitPrice);
      if (Number.isFinite(price) && price > 0) {
        e.amt = (defaultQty * price).toFixed(2);
      }
    }
  });
  return entryList;
}

/**
 * 审核前：每条明细产品档案(materialId)与数量均必填且数量>0（不自动补默认数量）
 */
export function assertBillEntriesReadyForAudit(entryList, vm, docLabel) {
  const label = docLabel || '单据';
  const list = entryList || [];
  if (!list.length) {
    if (vm && vm.$modal) {
      vm.$modal.msgError(`${label}无明细，不允许审核`);
    }
    return false;
  }
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e) {
      if (vm && vm.$modal) {
        vm.$modal.msgError(`${label}第${i + 1}行明细数据异常，不允许审核`);
      }
      return false;
    }
    const lineLabel = e.materialName || e.materialCode || `第${i + 1}行`;
    if (e.materialId == null || e.materialId === '') {
      if (vm && vm.$modal) {
        vm.$modal.msgError(`明细【${lineLabel}】产品档案不能为空，不允许审核`);
      }
      return false;
    }
    const n = Number(e.qty);
    if (e.qty == null || e.qty === '' || !Number.isFinite(n) || n <= 0) {
      if (vm && vm.$modal) {
        vm.$modal.msgError(`明细【${lineLabel}】申购数量不能为空且必须大于0，不允许审核`);
      }
      return false;
    }
  }
  return true;
}

/**
 * 已选耗材的明细行：数量必填且大于 0
 */
export function assertBillMaterialLinesHavePositiveQty(entryList, vm, docLabel) {
  const label = docLabel || '明细';
  const list = entryList || [];
  const invalid = list.filter(e => {
    if (!e || e.materialId == null || e.materialId === '') {
      return false;
    }
    const n = Number(e.qty);
    return e.qty == null || e.qty === '' || !Number.isFinite(n) || n <= 0;
  });
  if (invalid.length > 0) {
    if (vm && vm.$modal) {
      vm.$modal.msgError(`存在${label}数量为空或无效，请填写有效数量后再保存。`);
    }
    return false;
  }
  return true;
}
