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

// 货币格式化：按租户已生效金额小数位 + 舍入；无租户时默认 3 位 HALF_UP
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
  const fixed = rounded.toFixed(scale)
  const [intPart, floatPart] = Number(fixed).toLocaleString('zh-CN', {
    minimumFractionDigits: scale,
    maximumFractionDigits: scale
  }).split('.')
  if (scale <= 0) {
    return intPart
  }
  return `${intPart}.${floatPart || ''.padEnd(scale, '0')}`
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

export default {
  formatCurrency,
  formatRate,
  filterComma,
  formatAmount,
  formatPrice,
  toMoneyStorage,
  toMoneyStorageStr,
  calcLineAmt
}
