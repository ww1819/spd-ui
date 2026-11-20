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
 * 输入过程中允许末尾孤立小数点（如 "400."），便于继续输入小数位。
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

/**
 * 失焦/提交前规范化小数：去掉末尾孤立小数点（"400." → 400）。
 * Jackson 无法把 "400." 反序列化为 BigDecimal，必须在提交前消除。
 * @param {*} raw
 * @returns {number|string|null|undefined} 可解析则返回 number；空返回 ''；原样 null/undefined 透传
 */
export function finalizeDecimalInput(raw) {
  if (raw === null || raw === undefined) return raw
  if (raw === '') return ''
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : raw
  }
  let s = String(raw).trim().replace(/。/g, '.')
  if (!s) return ''
  if (s.endsWith('.')) s = s.slice(0, -1)
  if (!s || s === '-' || s === '+') return ''
  const n = Number(s)
  if (!Number.isFinite(n)) return String(raw).trim()
  return n
}

/** 仅匹配「数字 + 末尾孤立小数点」类非法串，避免误伤普通文本 */
const INCOMPLETE_DECIMAL_RE = /^[+-]?\d+\.$/

/**
 * 递归规范化请求体中的不完整小数串（如 "400." → 400）。
 * 用于 axios 提交兜底，防止各单据 qty/单价/金额漏修页面再次触发 BigDecimal 反序列化失败。
 * @param {*} data
 * @param {number} [depth=0]
 * @returns {*} 原地修改并返回同一引用（基本类型则返回规范化后的值）
 */
export function deepFinalizeIncompleteDecimals(data, depth = 0) {
  if (data == null || depth > 12) return data
  if (typeof data === 'string') {
    const t = data.trim()
    if (INCOMPLETE_DECIMAL_RE.test(t)) {
      return finalizeDecimalInput(t)
    }
    return data
  }
  if (typeof data !== 'object') return data
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = deepFinalizeIncompleteDecimals(data[i], depth + 1)
    }
    return data
  }
  Object.keys(data).forEach((key) => {
    data[key] = deepFinalizeIncompleteDecimals(data[key], depth + 1)
  })
  return data
}

/** 单价/金额录入允许的最大小数位（与库 decimal 存储精度对齐） */
export const PRICE_INPUT_SCALE = 6

function setRowField(vm, row, key, value) {
  if (typeof vm !== 'undefined' && vm && typeof vm.$set === 'function') {
    vm.$set(row, key, value)
  } else {
    row[key] = value
  }
}

function setFormField(vm, obj, key, value) {
  if (!obj) return
  if (typeof vm !== 'undefined' && vm && typeof vm.$set === 'function') {
    vm.$set(obj, key, value)
  } else {
    obj[key] = value
  }
}

/**
 * 明细行数量录入中过滤（挂 Vue.prototype，各弹窗可直接 @input="onQtyInput(scope.row)"）。
 * @param {Object} row
 * @param {string} [field='qty']
 */
export function onQtyInput(row, field = 'qty') {
  if (!row) return
  const key = field || 'qty'
  const cleaned = sanitizeDecimalInput(row[key])
  const prev = row[key] == null ? '' : String(row[key])
  if (cleaned !== prev) {
    setRowField(this, row, key, cleaned)
  }
  if (typeof this !== 'undefined' && this && typeof this.qtyChange === 'function') {
    this.qtyChange(row)
  }
}

/**
 * 明细行数量失焦规范化（挂 Vue.prototype）。
 * @param {Object} row
 * @param {string} [field='qty']
 */
export function onQtyBlur(row, field = 'qty') {
  if (!row) return
  const key = field || 'qty'
  const finalized = finalizeDecimalInput(row[key])
  if (finalized !== row[key]) {
    setRowField(this, row, key, finalized)
  }
  if (typeof this !== 'undefined' && this && typeof this.qtyChange === 'function') {
    this.qtyChange(row)
  } else if (typeof this !== 'undefined' && this && typeof this.stockQtyChange === 'function') {
    this.stockQtyChange(row)
  }
}

/**
 * 明细行单价录入过滤。默认字段 unitPrice；新品申请等用 price 时传第二参。
 * @param {Object} row
 * @param {string} [field='unitPrice']
 */
export function onPriceInput(row, field = 'unitPrice') {
  if (!row) return
  const key = field || 'unitPrice'
  const cleaned = sanitizeDecimalInput(row[key], PRICE_INPUT_SCALE)
  const prev = row[key] == null ? '' : String(row[key])
  if (cleaned !== prev) {
    setRowField(this, row, key, cleaned)
  }
  if (typeof this !== 'undefined' && this && typeof this.priceChange === 'function') {
    this.priceChange(row)
  } else if (typeof this !== 'undefined' && this && typeof this.priceChangePending === 'function') {
    this.priceChangePending(row)
  }
}

/**
 * 明细行单价失焦规范化（去掉 "0.3." / "12." 等）。
 * @param {Object} row
 * @param {string} [field='unitPrice']
 */
export function onPriceBlur(row, field = 'unitPrice') {
  if (!row) return
  const key = field || 'unitPrice'
  const finalized = finalizeDecimalInput(row[key])
  if (finalized !== row[key]) {
    setRowField(this, row, key, finalized)
  }
  if (typeof this !== 'undefined' && this && typeof this.priceChange === 'function') {
    this.priceChange(row)
  } else if (typeof this !== 'undefined' && this && typeof this.priceChangePending === 'function') {
    this.priceChangePending(row)
  }
}

/**
 * 表单级金额/单价录入（如 form.invoiceAmount、form.price）。
 * @param {Object} form
 * @param {string} field
 */
export function onFormDecimalInput(form, field) {
  if (!form || !field) return
  const cleaned = sanitizeDecimalInput(form[field], PRICE_INPUT_SCALE)
  const prev = form[field] == null ? '' : String(form[field])
  if (cleaned !== prev) {
    setFormField(this, form, field, cleaned)
  }
}

/**
 * 表单级金额/单价失焦规范化。
 * @param {Object} form
 * @param {string} field
 */
export function onFormDecimalBlur(form, field) {
  if (!form || !field) return
  const finalized = finalizeDecimalInput(form[field])
  if (finalized !== form[field]) {
    setFormField(this, form, field, finalized)
  }
}
