import { getInventory as getWhInv } from '@/api/warehouse/inventory'
import { getInventory as getDepInv } from '@/api/department/depInventory'

function sameId(a, b) {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return String(a) === String(b)
}

/**
 * 出库(201)/退货(301)：按明细 kc_no 查仓库库存，校验归属仓库、退货时校验供应商
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
      getWhInv(e.kcNo).then(res => ({ row, inv: res.data })).catch(() => ({ row, inv: null }))
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
 * 退库(401)：按明细 kc_no 查科室库存，校验归属仓库、科室
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
      getDepInv(e.kcNo).then(res => ({ row, inv: res.data })).catch(() => ({ row, inv: null }))
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
