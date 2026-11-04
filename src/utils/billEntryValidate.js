import { toMoneyStorage } from '@/utils/moneyFormat';

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
        // 存库精度 6 位，不按租户显示位截断
        e.amt = toMoneyStorage(defaultQty * price);
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

/** 仓库入库必填开关：未配置时默认开启（兼容旧数据） */
export function resolveInboundRequireFlag(val, defaultOn = true) {
  if (val === undefined || val === null || val === '') {
    return !!defaultOn;
  }
  if (val === true || val === 1 || val === '1') {
    return true;
  }
  if (val === false || val === 0 || val === '0') {
    return false;
  }
  return !!defaultOn;
}

/**
 * 低值入库明细：按仓库配置校验批号/生产日期/有效期必填
 * @param {Array} entryList 明细列表
 * @param {Vue} vm 组件实例
 * @param {string} [actionLabel] 操作名，如「保存」「审核」
 * @param {Object} [requireOpts] { requireBatchNo, requireProduceDate, requireExpiryDate }
 */
export function assertInboundBillEntriesHaveBatchAndExpiry(entryList, vm, actionLabel, requireOpts) {
  const action = actionLabel || '保存';
  const opts = requireOpts || {};
  const requireBatchNo = resolveInboundRequireFlag(opts.requireBatchNo, true);
  const requireProduceDate = resolveInboundRequireFlag(opts.requireProduceDate, true);
  const requireExpiryDate = resolveInboundRequireFlag(opts.requireExpiryDate, true);
  if (!requireBatchNo && !requireProduceDate && !requireExpiryDate) {
    return true;
  }
  const list = entryList || [];
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e || !isEntryNotDeleted(e)) {
      continue;
    }
    if (e.materialId == null || e.materialId === '') {
      continue;
    }
    const missing = [];
    if (requireBatchNo && isBlankText(e.batchNumber)) {
      missing.push('批号');
    }
    if (requireProduceDate && isBlankText(e.beginTime)) {
      missing.push('生产日期');
    }
    if (requireExpiryDate && isBlankText(e.endTime)) {
      missing.push('有效期');
    }
    if (!missing.length) {
      continue;
    }
    const name = resolveEntryMaterialName(e);
    const rowLabel = formatChineseRowNo(i + 1);
    if (vm && vm.$modal) {
      vm.$modal.msgError(`入库明细${rowLabel}【${name}】${missing.join('、')}为空，请维护后再${action}！`);
    }
    return false;
  }
  return true;
}

/** 从仓库对象解析入库必填开关 */
export function resolveInboundRequireOptsFromWarehouse(warehouse) {
  const w = warehouse || {};
  return {
    requireBatchNo: resolveInboundRequireFlag(w.requireBatchNo, true),
    requireProduceDate: resolveInboundRequireFlag(w.requireProduceDate, true),
    requireExpiryDate: resolveInboundRequireFlag(w.requireExpiryDate, true),
    inboundExpiryWarnDays: resolveInboundExpiryWarnDays(w.inboundExpiryWarnDays)
  };
}

/** 入库有效期临近提示天数：未配置默认 60；非法值回退 60；≤0 表示不提示 */
export function resolveInboundExpiryWarnDays(val) {
  if (val === undefined || val === null || val === '') {
    return 60;
  }
  const n = Number(val);
  if (!Number.isFinite(n)) {
    return 60;
  }
  return Math.floor(n);
}

/**
 * 收集「有效期剩余天数 < warnDays」的提示行（跳过空有效期、长期 2099）
 * @returns {string[]}
 */
export function collectInboundNearExpiryWarnLines(entryList, warnDays) {
  const days = Number(warnDays);
  if (!Number.isFinite(days) || days <= 0) {
    return [];
  }
  const list = entryList || [];
  const today = todayLocalDateOnly();
  const msDay = 24 * 60 * 60 * 1000;
  const lines = [];
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e || !isEntryNotDeleted(e)) {
      continue;
    }
    if (e.materialId == null || e.materialId === '') {
      continue;
    }
    const endKey = normalizeInboundDateKey(e.endTime);
    if (!endKey || endKey.startsWith('2099-01-01')) {
      continue;
    }
    const endDate = parseYmdDateOnly(endKey);
    if (!endDate) {
      continue;
    }
    const remain = Math.floor((endDate.getTime() - today.getTime()) / msDay);
    if (remain < days) {
      const name = resolveEntryMaterialName(e);
      const rowLabel = formatChineseRowNo(i + 1);
      lines.push(`${rowLabel}【${name}】的有效期小于${days}天`);
    }
  }
  return lines;
}

/**
 * 有效期临近确认：有提示则弹窗，确认按钮文案为「继续」；无提示直接通过
 * @returns {Promise<boolean>}
 */
export function confirmInboundNearExpiryWarn(vm, entryList, warnDays) {
  const lines = collectInboundNearExpiryWarnLines(entryList, warnDays);
  if (!lines.length) {
    return Promise.resolve(true);
  }
  const content = lines.join('\n') + '\n是否继续？';
  const confirmFn = vm && (vm.$confirm || (vm.$modal && vm.$modal.confirm));
  if (!confirmFn) {
    return Promise.resolve(true);
  }
  // Element MessageBox：优先 $confirm 以便自定义「继续」
  if (typeof vm.$confirm === 'function') {
    return vm.$confirm(content, '系统提示', {
      confirmButtonText: '继续',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true
    }).then(() => true).catch(() => false);
  }
  return vm.$modal.confirm(content).then(() => true).catch(() => false);
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

function normalizeInboundDateKey(val) {
  if (val == null || String(val).trim() === '') {
    return '';
  }
  return String(val).trim().slice(0, 10);
}

function normalizeInboundBatchKey(val) {
  if (val == null) {
    return '';
  }
  return String(val).trim();
}

/**
 * 低值入库明细：同一产品在同一入库单内，批号+生产日期+有效期不可完全相同
 * （三者有任一不同则允许）
 */
export function assertInboundBillEntriesUniqueBatchExpiry(entryList, vm) {
  const list = entryList || [];
  const seen = Object.create(null);
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e || !isEntryNotDeleted(e)) {
      continue;
    }
    if (e.materialId == null || e.materialId === '') {
      continue;
    }
    const materialKey = String(e.materialId);
    const batchKey = normalizeInboundBatchKey(e.batchNumber);
    const beginKey = normalizeInboundDateKey(e.beginTime);
    const endKey = normalizeInboundDateKey(e.endTime);
    const dupKey = `${materialKey}|${batchKey}|${beginKey}|${endKey}`;
    if (Object.prototype.hasOwnProperty.call(seen, dupKey)) {
      const firstIdx = seen[dupKey];
      const first = list[firstIdx];
      const name1 = resolveEntryMaterialName(first);
      const name2 = resolveEntryMaterialName(e);
      const row1 = formatChineseRowNo(firstIdx + 1);
      const row2 = formatChineseRowNo(i + 1);
      if (vm && vm.$modal) {
        vm.$modal.msgError(`入库明细${row1}【${name1}】与${row2}【${name2}】生产日期、有效期、批号完全一致，请核对！`);
      }
      return false;
    }
    seen[dupKey] = i;
  }
  return true;
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
