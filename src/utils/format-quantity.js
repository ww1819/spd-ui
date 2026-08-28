/** 数量/单价/金额展示最多小数位；末尾 0 不补齐（0.02 显示 0.02，0.002 显示 0.002） */
export const QTY_DISPLAY_SCALE = 3

export function stripTrailingDecimalZeros(str) {
  if (str == null || str === '') return str
  const s = String(str)
  if (s.indexOf('.') < 0) return s
  return s.replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * 数量展示：最多 fractionDigits 位小数，去掉末尾 0；整数不带小数点。
 * @param {*} value
 * @param {number} [fractionDigits=3]
 * @returns {string}
 */
export function formatQuantity(value, fractionDigits = QTY_DISPLAY_SCALE) {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const rawFd = Number(fractionDigits)
  const fd = Number.isFinite(rawFd) ? Math.min(20, Math.max(0, Math.floor(rawFd))) : QTY_DISPLAY_SCALE
  if (fd === 0) return String(Math.round(n))
  return stripTrailingDecimalZeros(n.toFixed(fd))
}

/**
 * 录入过滤：只保留数字和小数点，小数最多 maxDecimals 位（默认 3）。
 * @param {*} raw
 * @param {number} [maxDecimals=3]
 * @returns {string}
 */
export function sanitizeDecimalInput(raw, maxDecimals = QTY_DISPLAY_SCALE) {
  if (raw === null || raw === undefined || raw === '') return ''
  let s = String(raw).replace(/[^\d.]/g, '')
  const firstDot = s.indexOf('.')
  if (firstDot >= 0) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
    const [intPart, frac = ''] = s.split('.')
    const max = Number.isFinite(Number(maxDecimals)) ? Math.max(0, Math.floor(Number(maxDecimals))) : QTY_DISPLAY_SCALE
    s = intPart + '.' + frac.slice(0, max)
  }
  return s
}
