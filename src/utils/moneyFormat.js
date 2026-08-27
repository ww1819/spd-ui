/**
 * 租户金额显示格式化：只影响展示/打印/导出，不改入库精度。
 * 默认：先加总再舍入；位数与舍入取登录态 tenant（客户已生效配置）。
 */
import store from '@/store'

const DEFAULT_SCALE = 3
const DEFAULT_MODE = 'HALF_UP'

export function getPriceScale() {
  return normalizeScale(store?.state?.user?.tenant?.priceDecimalPlaces)
}

export function getAmountScale() {
  return normalizeScale(store?.state?.user?.tenant?.amountDecimalPlaces)
}

export function getMoneyRoundMode() {
  const m = store?.state?.user?.tenant?.moneyRoundMode
  return m && String(m).trim() ? String(m).trim().toUpperCase() : DEFAULT_MODE
}

export function normalizeScale(scale) {
  const n = Number(scale)
  if (!Number.isFinite(n)) return DEFAULT_SCALE
  return Math.min(6, Math.max(0, Math.trunc(n)))
}

/** HALF_UP / HALF_EVEN / DOWN */
export function roundMoney(value, scale, mode) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  const s = normalizeScale(scale)
  const factor = Math.pow(10, s)
  const m = (mode || getMoneyRoundMode() || DEFAULT_MODE).toUpperCase()
  const sign = num < 0 ? -1 : 1
  const abs = Math.abs(num) * factor
  let rounded
  if (m === 'DOWN') {
    rounded = Math.floor(abs)
  } else if (m === 'HALF_EVEN') {
    const floor = Math.floor(abs)
    const frac = abs - floor
    if (frac > 0.5) rounded = floor + 1
    else if (frac < 0.5) rounded = floor
    else rounded = floor % 2 === 0 ? floor : floor + 1
  } else {
    rounded = Math.floor(abs + 0.5)
  }
  return sign * (rounded / factor)
}

/** 去掉小数末尾 0：0.020 → 0.02，1.000 → 1 */
export function stripTrailingDecimalZeros(str) {
  if (str == null || str === '') return str
  const s = String(str)
  if (s.indexOf('.') < 0) return s
  return s.replace(/0+$/, '').replace(/\.$/, '')
}

export function formatPrice(value, blank = '-') {
  const v = roundMoney(value, getPriceScale(), getMoneyRoundMode())
  if (v === null) return blank
  return stripTrailingDecimalZeros(v.toFixed(getPriceScale()))
}

export function formatAmount(value, blank = '-') {
  const v = roundMoney(value, getAmountScale(), getMoneyRoundMode())
  if (v === null) return blank
  return stripTrailingDecimalZeros(v.toFixed(getAmountScale()))
}

/** 合计：先加总再按金额位舍入（默认规则；特例页面可自行覆盖） */
export function formatAmountSum(values, blank = '-') {
  const list = Array.isArray(values) ? values : []
  let sum = 0
  let has = false
  list.forEach((x) => {
    const n = Number(x)
    if (Number.isFinite(n)) {
      sum += n
      has = true
    }
  })
  if (!has) return blank
  return formatAmount(sum, blank)
}

/** 入库/表单计算用精度（与库 decimal(18,6) 对齐），不按显示位截断 */
export const STORAGE_MONEY_SCALE = 6

export function toMoneyStorage(value) {
  const v = roundMoney(value, STORAGE_MONEY_SCALE, 'HALF_UP')
  return v === null ? 0 : v
}

/** 数量×单价 → 明细金额（存库精度，不按租户显示位截断） */
export function calcLineAmt(qty, price) {
  const q = Number(qty)
  const p = Number(price)
  if (!Number.isFinite(q) || !Number.isFinite(p)) return 0
  return toMoneyStorage(q * p)
}

export function toMoneyStorageStr(value) {
  return String(toMoneyStorage(value))
}

/** Excel 数值格式：整数位必显，小数位用 # 故不补末尾 0（#,##0.###） */
export function excelNumFmt(scale) {
  const s = normalizeScale(scale)
  return s <= 0 ? '#,##0' : `#,##0.${'#'.repeat(s)}`
}

export function getPriceExcelNumFmt() {
  return excelNumFmt(getPriceScale())
}

export function getAmountExcelNumFmt() {
  return excelNumFmt(getAmountScale())
}

/** 数量 Excel：最多 3 位，# 不补末尾 0 */
export function getQtyExcelNumFmt() {
  return excelNumFmt(3)
}

export default {
  getPriceScale,
  getAmountScale,
  getMoneyRoundMode,
  formatPrice,
  formatAmount,
  formatAmountSum,
  roundMoney,
  toMoneyStorage,
  toMoneyStorageStr,
  calcLineAmt,
  STORAGE_MONEY_SCALE,
  stripTrailingDecimalZeros,
  excelNumFmt,
  getPriceExcelNumFmt,
  getAmountExcelNumFmt,
  getQtyExcelNumFmt
}
