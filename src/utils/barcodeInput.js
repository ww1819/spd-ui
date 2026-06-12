import { toHalfWidth } from './udi'

/**
 * 扫码/手输院内码规范化：全角转半角、去零宽字符，避免中文输入法下扫码匹配失败。
 */
export function normalizeBarcodeInput(raw) {
  if (raw == null || raw === '') {
    return ''
  }
  return toHalfWidth(String(raw))
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

/** 中文输入法 IME 中间态按键 */
export function isImeProcessKey(e) {
  return !!(e && (e.keyCode === 229 || e.key === 'Process'))
}

/** 扫码枪/键盘回车 */
export function isScannerEnterKey(e) {
  return !!(e && (e.key === 'Enter' || e.keyCode === 13))
}

/**
 * 是否像扫码枪快速输入（短时间内连续键入，用于扫码后自动提交）。
 */
export function isRapidScannerBurst(firstKeyAt, lastKeyAt) {
  if (!firstKeyAt || !lastKeyAt) {
    return false
  }
  const span = lastKeyAt - firstKeyAt
  return span >= 0 && span <= 500
}

/** 从 keydown 事件追加可打印字符（绕过部分 IME 对 v-model 的干扰） */
export function appendKeyToBarcodeBuffer(buffer, e) {
  if (!e || e.ctrlKey || e.altKey || e.metaKey) {
    return buffer || ''
  }
  if (isImeProcessKey(e) || isScannerEnterKey(e)) {
    return buffer || ''
  }
  if (e.key && e.key.length === 1) {
    return (buffer || '') + e.key
  }
  return buffer || ''
}
