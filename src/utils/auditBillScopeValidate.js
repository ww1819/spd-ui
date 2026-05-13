import { listInventoryPick as listWhInvPick } from '@/api/warehouse/inventory'
import { listInventoryPick as listDepInvPick } from '@/api/department/depInventory'

function firstRowFromTableRes(res) {
  const rows = (res && (res.rows || res.data)) || []
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

function sameId(a, b) {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return String(a) === String(b)
}

/**
 * 出库(201)/退货(301)：按明细 kc_no（仓库库存明细主键）查仓库库存，校验归属仓库、退货时校验供应商。
 * 使用 /warehouse/inventory/pick/list（仅需登录），避免无 warehouse:inventory:query 时 403 被误判为「库存不存在」。
 */
export async function collectCkThScopeErrors(form, entryList, billType) {
  const wh = form.warehouseId
  const sup = form.supplerId
  const list = entryList || []
  const checkSupplier = Number(billType) === 301
  const errors = []
  if (wh == null || wh === '') {
    errors.push('请先维护单据仓库后再保存或审核')
    return errors
  }
  const tasks = []
  for (let i = 0; i < list.length; i++) {
    const e = list[i]
    if (!e || !e.kcNo) continue
    const row = i + 1
    tasks.push(
      listWhInvPick({ id: e.kcNo, pageNum: 1, pageSize: 1 })
        .then(res => ({ row, inv: firstRowFromTableRes(res) }))
        .catch(() => ({ row, inv: null }))
    )
  }
  const results = await Promise.all(tasks)
  for (const { row, inv } of results) {
    if (!inv) {
      errors.push(`第${row}行：仓库库存明细不存在或无法查询`)
      continue
    }
    if (!sameId(inv.warehouseId, wh)) {
      errors.push(`第${row}行：仓库库存归属仓库与单据仓库不一致`)
    }
    if (checkSupplier && sup != null && inv.supplierId != null && !sameId(inv.supplierId, sup)) {
      errors.push(`第${row}行：仓库库存供应商与单据供应商不一致`)
    }
  }
  return errors
}

/**
 * 退库(401)：按明细 kc_no（科室库存明细主键）查科室库存，校验归属仓库、科室。
 * 使用 /department/inventory/pick/list（仅需登录），避免无 department:depInventory:query 时 403 误判。
 */
export async function collectTkScopeErrors(form, entryList) {
  const wh = form.warehouseId
  const dep = form.departmentId
  const list = entryList || []
  const errors = []
  if (wh == null || wh === '') {
    errors.push('请先维护单据仓库后再保存或审核')
    return errors
  }
  if (dep == null || dep === '') {
    errors.push('请先维护单据科室后再保存或审核')
    return errors
  }
  const tasks = []
  for (let i = 0; i < list.length; i++) {
    const e = list[i]
    if (!e || !e.kcNo) continue
    const row = i + 1
    tasks.push(
      listDepInvPick({ id: e.kcNo, pageNum: 1, pageSize: 1 })
        .then(res => ({ row, inv: firstRowFromTableRes(res) }))
        .catch(() => ({ row, inv: null }))
    )
  }
  const results = await Promise.all(tasks)
  for (const { row, inv } of results) {
    if (!inv) {
      errors.push(`第${row}行：科室库存明细不存在或无法查询`)
      continue
    }
    if (!sameId(inv.warehouseId, wh)) {
      errors.push(`第${row}行：科室库存归属仓库与单据仓库不一致`)
    }
    if (dep != null && inv.departmentId != null && !sameId(inv.departmentId, dep)) {
      errors.push(`第${row}行：科室库存归属科室与单据科室不一致`)
    }
  }
  return errors
}
