/* eslint-disable no-param-reassign */
import {
  formatAmount,
  formatPrice,
  getAmountScale,
  getMoneyRoundMode,
  roundMoney,
  toMoneyStorage,
  toMoneyStorageStr,
  calcLineAmt
} from '@/utils/moneyFormat'
import { formatQuantity } from '@/utils/format-quantity'

// 货币格式化：最多按租户金额小数位，末尾 0 不补齐（0.02 不显示 0.020）
const formatCurrency = (value, blankValue = '-') => {
  if (value === null || value === undefined || value === '') {
    return blankValue
  }
  try {
    value = Number(value)
  } catch (e) {
    return blankValue
  }
  if (!Number.isFinite(value)) {
    return blankValue
  }
  const scale = getAmountScale()
  const rounded = roundMoney(value, scale, getMoneyRoundMode())
  if (rounded === null) {
    return blankValue
  }
  const sign = rounded < 0 ? '-' : ''
  const abs = Math.abs(rounded)
  const [intRaw, fracRaw = ''] = abs.toFixed(scale).split('.')
  const intPart = Number(intRaw).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
  if (scale <= 0) {
    return sign + intPart
  }
  const frac = fracRaw.replace(/0+$/, '')
  return frac ? `${sign}${intPart}.${frac}` : sign + intPart
}

// 比率仍默认两位（非金额字段）
const formatRate = (value, blankValue = '-') => {
  if (!value && value !== 0) {
    return blankValue
  }
  try {
    value = Number(value)
  } catch (e) {
    return blankValue
  }
  const rate = value.toFixed(2)
  let [int, float] = rate.split('.')
  if (!float || float.length < 2) {
    float = (float || '').padEnd(2, '0')
  }
  return `${int}.${float}%`
}

const filterComma = (number, blankValue = '-') =>
  (number || number === 0 ? String(number).replace(/(?=(\B\d{3})+$)/g, ',') : blankValue)

const formatQty = (value, blankValue = '-') => {
  const s = formatQuantity(value)
  return s === '' ? blankValue : s
}

const formatSignedQty = (value, blankValue = '-') => {
  const n = Number(value)
  if (!Number.isFinite(n)) return blankValue
  const s = formatQty(n, blankValue)
  if (s === blankValue) return s
  return n > 0 ? `+${s}` : s
}

/** 表格合计：按列名区分数量 / 单价 / 金额，最多 3 位且不补末尾 0 */
const formatSumByProp = (value, prop, blankValue) => {
  const p = String(prop || '').toLowerCase()
  if (p.includes('rate') || p.includes('percent') || p.includes('ratio')) {
    return formatRate(value, blankValue)
  }
  if (p.includes('price')) {
    return formatPrice(value, blankValue === undefined ? '-' : blankValue)
  }
  if (p.includes('qty') || p.includes('quantity')) {
    return formatQty(value, blankValue)
  }
  return formatAmount(value, blankValue === undefined ? '-' : blankValue)
}

export default {
  formatCurrency,
  formatRate,
  filterComma,
  formatAmount,
  formatPrice,
  formatQty,
  formatQuantity,
  formatSignedQty,
  formatSumByProp,
  toMoneyStorage,
  toMoneyStorageStr,
  calcLineAmt
}
