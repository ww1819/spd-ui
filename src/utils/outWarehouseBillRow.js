/**
 * 出库单明细复制：草稿行去掉主键与只读统计字段，保留库房申请/库存/配送等与引用统计相关的字段。
 * docRefList 与明细按下标对齐（与后端 saveRefsAfterStkBillInsert 一致）。
 */

export function cloneStkOutEntryForDuplicate(src) {
  if (!src || typeof src !== 'object') {
    return {};
  }
  const raw = JSON.parse(JSON.stringify(src));
  delete raw.id;
  delete raw.parenId;
  delete raw.billNo;
  delete raw.index;
  const strip = [
    'srcRefedQty',
    'srcRefableQty',
    'srcOutboundAuditedRefQty',
    'srcOutboundPendingRefQty',
    'srcOutboundRefableQty',
    'srcReturnAuditedRefQty',
    'srcReturnPendingRefQty',
    'srcReturnRefableQty',
    'linkedStkQty'
  ];
  strip.forEach((k) => {
    delete raw[k];
  });
  /** 复制后清空批次与库存行，由用户重新「选批次」 */
  raw.batchNo = '';
  raw.batchNumber = '';
  raw.beginTime = '';
  raw.endTime = '';
  raw.stkInventoryId = null;
  raw.kcNo = null;
  raw.depInventoryId = null;
  raw.supplierId = null;
  raw.supplerId = null;
  return raw;
}

/**
 * 同一库房申请明细行(whApplyEntryId)在本单明细中的数量合计，用于前端与「可引用」粗校验。
 * @returns {Map<string, number>}
 */
export function sumQtyByWhApplyEntryId(entries) {
  const map = new Map();
  if (!Array.isArray(entries)) {
    return map;
  }
  entries.forEach((e) => {
    if (!e || e.whApplyEntryId == null || String(e.whApplyEntryId).trim() === '') {
      return;
    }
    const k = String(e.whApplyEntryId);
    const q = Number(e.qty);
    const n = Number.isFinite(q) ? q : 0;
    map.set(k, (map.get(k) || 0) + n);
  });
  return map;
}

/**
 * 各 whApplyEntryId 在本单中展示过的最大 srcRefableQty（多行拆分时通常相同）。
 * @returns {Map<string, number>}
 */
export function maxSrcRefableQtyByWhApplyEntryId(entries) {
  const map = new Map();
  if (!Array.isArray(entries)) {
    return map;
  }
  entries.forEach((e) => {
    if (!e || e.whApplyEntryId == null || String(e.whApplyEntryId).trim() === '') {
      return;
    }
    const k = String(e.whApplyEntryId);
    const v = e.srcRefableQty != null && e.srcRefableQty !== '' ? Number(e.srcRefableQty) : NaN;
    if (!Number.isFinite(v)) {
      return;
    }
    const cur = map.get(k);
    if (cur == null || v > cur) {
      map.set(k, v);
    }
  });
  return map;
}

/** 复制 hc_doc_bill_ref 模板行：去掉目标侧主键，保留 refType/src* 等源单关联 */
export function cloneDocRefRowForDuplicate(r) {
  if (!r || !r.refType) {
    return { refType: null };
  }
  const c = { ...r };
  delete c.id;
  delete c.tgtBillId;
  delete c.tgtBillNo;
  delete c.tgtEntryId;
  delete c.tgtBillKind;
  delete c.refQty;
  delete c.refAmt;
  return c;
}
