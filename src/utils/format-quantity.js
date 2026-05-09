/**
 * 数量展示：在 fractionDigits 精度下为整数时不带小数；有小数则显示（去掉末尾无意义的 0）。
 * @param {*} value
 * @param {number} [fractionDigits=2] 小数部分最多保留位数
 * @returns {string}
 */
export function formatQuantity(value, fractionDigits = 2) {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const fd = Math.min(20, Math.max(0, Math.floor(Number(fractionDigits)) || 2))
  const rounded = Number(n.toFixed(fd))
  const intR = Math.round(rounded)
  if (Math.abs(rounded - intR) < 1e-9) return String(intR)
  return String(rounded)
}
