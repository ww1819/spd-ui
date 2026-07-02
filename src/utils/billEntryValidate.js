/** 明细行未逻辑删除（delFlag 为空、0 或非 1） */
export function isEntryNotDeleted(row) {
  if (!row) {
    return false;
  }
  const df = row.delFlag;
  if (df == null || df === '') {
    return true;
  }
  if (typeof df === 'string') {
    return df.trim() !== '1';
  }
  return Number(df) !== 1;
}

/**
 * 审核前：至少一条未删除明细
 */
export function assertBillHasActiveEntriesForAudit(entryList, vm, docLabel) {
  const label = docLabel || '单据';
  const active = (entryList || []).filter(isEntryNotDeleted);
  if (active.length === 0) {
    if (vm && vm.$modal) {
      vm.$modal.msgError(`${label}无有效明细，不允许审核`);
    }
    return false;
  }
  return true;
}

/** @deprecated 请使用 assertBillHasActiveEntriesForAudit */
export function assertBillEntriesForAudit(entryList, vm, docLabel) {
  return assertBillHasActiveEntriesForAudit(entryList, vm, docLabel);
}

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

/** 中文行号：第一行、第二行…第十行，超出则用第N行 */
export function formatChineseRowNo(rowNo) {
  const map = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const n = Number(rowNo);
  if (Number.isFinite(n) && n >= 1 && n <= 10) {
    return `第${map[n - 1]}行`;
  }
  return `第${rowNo}行`;
}

export function resolveEntryMaterialCode(entry) {
  if (!entry) return '--';
  if (entry.material && entry.material.code) return entry.material.code;
  if (entry.materialCode) return entry.materialCode;
  return entry.materialId != null && entry.materialId !== '' ? String(entry.materialId) : '--';
}

export function resolveEntryMaterialName(entry) {
  if (!entry) return '--';
  if (entry.material && entry.material.name) return entry.material.name;
  if (entry.materialName) return entry.materialName;
  return '--';
}

/** 数量≤0 时的明细提示文案 */
export function buildZeroQtyErrorMessage(rowNo, entry) {
  const rowLabel = formatChineseRowNo(rowNo);
  const code = resolveEntryMaterialCode(entry);
  const name = resolveEntryMaterialName(entry);
  const batchNo = entry && entry.batchNo != null && String(entry.batchNo).trim() !== ''
    ? String(entry.batchNo).trim()
    : '--';
  return `数量不能为0！${rowLabel}产品${code}（${name}）批次为${batchNo}。`;
}

/**
 * 已选耗材行数量须大于 0；遇首条无效行即提示并返回 false
 */
function isBlankText(val) {
  return val == null || String(val).trim() === '';
}

/**
 * 低值入库明细：批号、有效期均不能为空（空白字符串视为空）
 * @param {Array} entryList 明细列表
 * @param {Vue} vm 组件实例
 * @param {string} [actionLabel] 操作名，如「保存」「审核」
 */
export function assertInboundBillEntriesHaveBatchAndExpiry(entryList, vm, actionLabel) {
  const action = actionLabel || '保存';
  const list = entryList || [];
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e || !isEntryNotDeleted(e)) {
      continue;
    }
    if (e.materialId == null || e.materialId === '') {
      continue;
    }
    const name = resolveEntryMaterialName(e);
    const lineLabel = name !== '--' ? name : formatChineseRowNo(i + 1);
    if (isBlankText(e.batchNumber) || isBlankText(e.endTime)) {
      if (vm && vm.$modal) {
        vm.$modal.msgError(`明细【${lineLabel}】批号或有效期为空，请维护批号和效期后再${action}`);
      }
      return false;
    }
  }
  return true;
}

function parseYmdDateOnly(str) {
  if (str == null || String(str).trim() === '') {
    return null;
  }
  const s = String(str).trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31) {
    return null;
  }
  return new Date(y, mo - 1, d);
}

function todayLocalDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * 低值入库明细：有效期不能小于当前日期；生产日期不能大于当前日期
 */
export function assertInboundBillEntryDatesValid(entryList, vm) {
  const list = entryList || [];
  const today = todayLocalDateOnly();
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e || !isEntryNotDeleted(e)) {
      continue;
    }
    if (e.materialId == null || e.materialId === '') {
      continue;
    }
    const endDate = parseYmdDateOnly(e.endTime);
    if (endDate && endDate.getTime() < today.getTime()) {
      if (vm && vm.$modal) {
        vm.$modal.msgError('有效期不能小于当前日期');
      }
      return false;
    }
    const beginDate = parseYmdDateOnly(e.beginTime);
    if (beginDate && beginDate.getTime() > today.getTime()) {
      if (vm && vm.$modal) {
        vm.$modal.msgError('生产日期不能大于当前日期！');
      }
      return false;
    }
  }
  return true;
}

export function assertBillMaterialLinesQtyNotZero(entryList, vm) {
  const list = entryList || [];
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e || e.materialId == null || e.materialId === '') {
      continue;
    }
    const n = Number(e.qty);
    if (e.qty == null || e.qty === '' || !Number.isFinite(n) || n <= 0) {
      if (vm && vm.$modal) {
        vm.$modal.msgError(buildZeroQtyErrorMessage(i + 1, e));
      }
      return false;
    }
  }
  return true;
}
