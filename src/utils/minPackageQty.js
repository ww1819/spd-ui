/**
 * 最小包装数倍数校验（仅产品档案显式维护的 minPackageQty 等字段；未维护则不校验）
 */

const MIN_PKG_KEYS = ['minPackageQty', 'minPackQty', 'minimumPackageQty', 'min_package_qty']

/** 读取已维护的最小包装数；未维护返回 null（不校验） */
export function resolveMaintainedMinPackageQty(source) {
  const src = source && typeof source === 'object' ? source : {}
  const m = src.material && typeof src.material === 'object' ? src.material : {}
  const pick = (obj) => {
    if (!obj || typeof obj !== 'object') return null
    for (const key of MIN_PKG_KEYS) {
      const v = obj[key]
      if (v == null || String(v).trim() === '') continue
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) return n
    }
    return null
  }
  const fromSrc = pick(src)
  if (fromSrc != null) return fromSrc
  return pick(m)
}

export function isQtyMultipleOfMinPackage(qty, minPkg) {
  if (minPkg == null || minPkg <= 0) return true
  const q = Number(qty)
  if (!Number.isFinite(q) || q <= 0) return true
  const ratio = q / minPkg
  return Math.abs(ratio - Math.round(ratio)) < 1e-9
}

/**
 * @returns {{ valid: boolean, violations: Array }}
 */
export function findMinPackageQtyViolations(entries, options = {}) {
  const list = entries || []
  const getMaterialId = options.getMaterialId || (r => r && r.materialId)
  const getQty = options.getQty || (r => r && r.qty)
  const getLabel = options.getLabel || (r => {
    if (!r) return ''
    return r.materialName
      || (r.material && (r.material.name || r.material.code))
      || r.materialCode
      || ''
  })
  const violations = []
  list.forEach((row, i) => {
    if (!row || getMaterialId(row) == null) return
    const minPkg = resolveMaintainedMinPackageQty(row)
    if (minPkg == null) return
    const qty = getQty(row)
    if (!isQtyMultipleOfMinPackage(qty, minPkg)) {
      violations.push({
        index: i + 1,
        row,
        minPkg,
        qty,
        label: getLabel(row) || `第${i + 1}行`
      })
    }
  })
  return { valid: violations.length === 0, violations }
}

/** 保存前校验；未通过时弹错并返回 false */
export function assertMinPackageQtyOnSave(vm, entries, docLabel = '单据') {
  const { valid, violations } = findMinPackageQtyViolations(entries)
  if (valid) return true
  const lines = violations.slice(0, 5).map(v =>
    `${v.label}：数量 ${v.qty} 须为最小包装数 ${v.minPkg} 的整数倍`
  )
  const more = violations.length > 5 ? `（另有 ${violations.length - 5} 条）` : ''
  vm.$modal.msgError(`${docLabel}保存失败。${lines.join('；')}${more}，请修改数量后保存。`)
  return false
}
