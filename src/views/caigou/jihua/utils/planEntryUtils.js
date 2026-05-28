/** 采购计划明细：引用申购单、汇总等共用工具 */

export function materialArchiveSupplierId(entry) {
  if (!entry) return null
  if (entry.supplierId != null && entry.supplierId !== '') return entry.supplierId
  const m = entry.material
  if (!m) return null
  if (m.supplierId != null && m.supplierId !== '') return m.supplierId
  if (m.supplier && m.supplier.id != null) return m.supplier.id
  return null
}

function freezeMaterialSnapshot(m) {
  if (!m || typeof m !== 'object') return m
  try {
    return Object.freeze(m)
  } catch (e) {
    return m
  }
}

export function buildPlanEntryMaterialFromPurchase(entry) {
  if (!entry || !entry.material) {
    return entry && entry.material ? freezeMaterialSnapshot({ ...entry.material }) : null
  }
  const m = { ...entry.material }
  const sid = materialArchiveSupplierId(entry)
  if (sid != null && sid !== '') {
    m.supplierId = sid
    if (!m.supplier || m.supplier.id == null) {
      const sname = entry.supplierName
        || (entry.material.supplier && entry.material.supplier.name)
        || ''
      m.supplier = { id: sid, name: sname }
    }
  }
  return freezeMaterialSnapshot(m)
}

export function normalizePurchaseEntry(entry, meta) {
  const entryId = entry.id != null ? String(entry.id) : ''
  const material = entry.material ? { ...entry.material } : null
  const archiveSupplierId = material && (material.supplierId != null && material.supplierId !== ''
    ? material.supplierId
    : (material.supplier && material.supplier.id != null ? material.supplier.id : null))
  if (material && archiveSupplierId != null && archiveSupplierId !== '') {
    material.supplierId = archiveSupplierId
  }
  return {
    ...entry,
    supplierId: archiveSupplierId,
    _departmentName: meta.departmentName,
    _purchaseBillNo: meta.purchaseBillNo,
    _departmentId: meta.departmentId,
    materialCode: entry.materialCode || (entry.material && entry.material.code) || '',
    materialName: entry.materialName || (entry.material && entry.material.name) || '',
    materialSpec: entry.materialSpec || (entry.material && entry.material.speci) || '',
    model: entry.model || (entry.material && entry.material.model) || '',
    unit: entry.unit || (entry.material && entry.material.fdUnit && entry.material.fdUnit.unitName) || '',
    unitPrice: entry.unitPrice || (entry.material && entry.material.price) || 0,
    qty: entry.qty || 0,
    amt: entry.amt || (entry.qty || 0) * (entry.unitPrice || (entry.material && entry.material.price) || 0),
    supplierName: entry.supplierName || (entry.material && entry.material.supplier && entry.material.supplier.name) || '',
    material
  }
}

/** 引用申购明细 → 计划明细行；高值且按产品档案汇总时按 materialId+科室 汇总 */
export function buildPlanRowsFromPurchaseEntries(entriesToAdd, planEntryMode, options = {}) {
  const newRows = []
  const mode = planEntryMode || '1'
  const isGzHigh = options.isGz === '1' || options.isGz === 1
  if (mode === '2') {
    entriesToAdd.forEach(entry => {
      if (!entry.materialId && !(entry.material && entry.material.id)) return
      const mid = entry.materialId || (entry.material && entry.material.id)
      const row = {
        materialId: mid,
        material: buildPlanEntryMaterialFromPurchase(entry),
        applyQty: Number(entry.qty) || 0,
        qty: Number(entry.qty) || 0,
        price: entry.unitPrice || entry.price || (entry.material && entry.material.price) || 0,
        speci: entry.materialSpec || entry.speci || (entry.material && entry.material.speci) || '',
        model: entry.model || (entry.material && entry.material.model) || '',
        remark: entry.remark || '',
        supplierId: materialArchiveSupplierId(entry),
        planSource: '引用申购单',
        depApplyEntryIds: entry.id != null ? [entry.id] : [],
        applyBillNos: entry._purchaseBillNo || '',
        applyDepartmentId: entry._departmentId != null ? entry._departmentId : undefined
      }
      row.amt = (row.qty || 0) * (row.price || 0)
      newRows.push(row)
    })
    assignPlanEntryRowUid(newRows)
    return newRows
  }
  const byKey = {}
  entriesToAdd.forEach(entry => {
    if (!entry.material && !entry.materialId) return
    const mid = entry.materialId || (entry.material && entry.material.id)
    const supplierId = materialArchiveSupplierId(entry)
    const deptId = entry._departmentId != null && entry._departmentId !== '' ? entry._departmentId : ''
    const aggKey = isGzHigh
      ? `${mid}|${deptId}`
      : `${mid}|${supplierId != null ? supplierId : ''}`
    const q = Number(entry.qty) || 0
    const entryId = entry.id
    if (!byKey[aggKey]) {
      byKey[aggKey] = {
        materialId: mid,
        material: buildPlanEntryMaterialFromPurchase(entry),
        applyQty: 0,
        qty: 0,
        price: entry.unitPrice || entry.price || (entry.material && entry.material.price) || 0,
        speci: entry.materialSpec || entry.speci || (entry.material && entry.material.speci) || '',
        model: entry.model || (entry.material && entry.material.model) || '',
        remark: entry.remark || '',
        supplierId,
        planSource: '引用申购单',
        applyDepartmentId: isGzHigh && deptId !== '' ? deptId : undefined,
        depApplyEntryIds: [],
        _billNoSet: new Set()
      }
    }
    byKey[aggKey].applyQty += q
    if (entryId != null) byKey[aggKey].depApplyEntryIds.push(entryId)
    if (entry._purchaseBillNo) {
      byKey[aggKey]._billNoSet.add(entry._purchaseBillNo)
    }
  })
  Object.keys(byKey).forEach((key) => {
    const row = byKey[key]
    row.qty = row.applyQty
    row.amt = (row.qty || 0) * (row.price || 0)
    row.applyBillNos = row._billNoSet && row._billNoSet.size ? [...row._billNoSet].join(',') : ''
    delete row._billNoSet
    newRows.push(row)
  })
  assignPlanEntryRowUid(newRows)
  return newRows
}

export function purchasePlanRefLabel(status) {
  const s = status == null || status === '' ? 0 : Number(status)
  const map = { 0: '未引用', 1: '部分引用', 2: '全部引用', 3: '计划驳回' }
  return map[s] != null ? map[s] : '--'
}

export function purchasePlanRefTagType(status) {
  const s = status == null || status === '' ? 0 : Number(status)
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[s] || 'info'
}

export function outboundRefLabel(status) {
  const s = status == null || status === '' ? 0 : Number(status)
  const map = { 0: '未引用', 1: '部分引用', 2: '全部引用' }
  return map[s] != null ? map[s] : '--'
}

export function outboundRefTagType(status) {
  const s = status == null || status === '' ? 0 : Number(status)
  const map = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[s] || 'info'
}

/** 让出主线程，避免长任务卡死 UI */
export function yieldToMain() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(resolve, 0))
    } else {
      setTimeout(resolve, 0)
    }
  })
}

/** 为计划明细行生成稳定 row-key（避免无 id 时冲突） */
export function assignPlanEntryRowUid(rows) {
  ;(rows || []).forEach((row, i) => {
    if (row && (row._entryUid == null || row._entryUid === '')) {
      row._entryUid = `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 9)}`
    }
  })
  return rows
}

/** 分批合并数组，仅在内存中构建，最后一次性返回，减少 Vue 重复渲染 */
export async function concatListInChunks(baseList, appendList, chunkSize = 200) {
  const base = baseList || []
  const extra = appendList || []
  if (!extra.length) return base
  if (base.length + extra.length <= chunkSize) {
    return base.concat(extra)
  }
  const merged = base.slice()
  for (let i = 0; i < extra.length; i += chunkSize) {
    merged.push(...extra.slice(i, i + chunkSize))
    if (i + chunkSize < extra.length) {
      await yieldToMain()
    }
  }
  return merged
}

/** 按批拉取库存映射并合并（materialIds 去重） */
export async function fetchStockQtyMapBatched(warehouseId, materialIds, fetchFn, batchSize = 120) {
  const map = {}
  if (!warehouseId || !materialIds || !materialIds.length) return map
  const uniq = [...new Set(materialIds.filter((id) => id != null))]
  for (let i = 0; i < uniq.length; i += batchSize) {
    const batch = uniq.slice(i, i + batchSize)
    const res = await fetchFn(warehouseId, batch.join(','))
    const part = (res && res.data) ? res.data : {}
    Object.keys(part).forEach((k) => { map[k] = part[k] })
    if (i + batchSize < uniq.length) {
      await yieldToMain()
    }
  }
  return map
}

/** 保存计划时精简明细 payload，去掉 material 等大对象，加快请求与入库 */
export function buildLeanPlanEntryPayload(rows) {
  return (rows || [])
    .filter((row) => row && row.materialId != null)
    .map((row) => {
      const lean = {
        id: row.id != null ? row.id : undefined,
        materialId: row.materialId,
        supplierId: row.supplierId != null && row.supplierId !== '' ? row.supplierId : null,
        qty: row.qty,
        applyQty: row.applyQty != null ? row.applyQty : undefined,
        price: row.price,
        amt: row.amt,
        speci: row.speci || (row.material && row.material.speci) || undefined,
        model: row.model || (row.material && row.material.model) || undefined,
        remark: row.remark || undefined,
        applyDepartmentId: row.applyDepartmentId != null ? row.applyDepartmentId : undefined,
        planSource: row.planSource || undefined,
        applyBillNos: row.applyBillNos || undefined
      }
      if (row.depApplyEntryIds && row.depApplyEntryIds.length) {
        lean.depApplyEntryIds = row.depApplyEntryIds
      }
      if (row.basApplyEntryIds && row.basApplyEntryIds.length) {
        lean.basApplyEntryIds = row.basApplyEntryIds
      }
      return lean
    })
}

/** 后端批量引用接口返回的申购明细 → 前端归一化结构 */
export function mapReferenceApplyEntriesFromApi(rawList) {
  return (rawList || []).map((entry) => normalizePurchaseEntry(entry, {
    departmentName: entry.applyDepartmentName || '引用申购单',
    purchaseBillNo: entry.purchaseBillNo || '',
    departmentId: entry.applyDepartmentId != null ? entry.applyDepartmentId : undefined
  }))
}

/** 申购单号过多时压缩展示，避免表头字段过长 */
export function formatReferenceBillNo(billNos, maxShow = 30) {
  const list = (billNos || []).filter(Boolean)
  if (!list.length) return ''
  if (list.length <= maxShow) return list.join(', ')
  return `${list.slice(0, maxShow).join(', ')} 等共${list.length}张`
}

/** 限制并发请求 */
export async function runPool(tasks, concurrency = 5) {
  if (!tasks || !tasks.length) return []
  const results = new Array(tasks.length)
  let index = 0
  const worker = async () => {
    while (index < tasks.length) {
      const cur = index++
      results[cur] = await tasks[cur]()
    }
  }
  const n = Math.min(concurrency, tasks.length)
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}
