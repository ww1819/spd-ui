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
 * 是否像扫码枪快速输入（多字符、短间隔连续键入；手输 1～2 个字符不视为扫码）。
 * @param {number} charCount 本次连击字符数（keydown 缓冲长度）
 */
export function isRapidScannerBurst(firstKeyAt, lastKeyAt, charCount) {
  if (!firstKeyAt || !lastKeyAt) {
    return false
  }
  const count = charCount != null ? Number(charCount) : 0
  if (!count || count < 3) {
    return false
  }
  const span = lastKeyAt - firstKeyAt
  if (span < 0 || span > 500) {
    return false
  }
  if (count === 1) {
    return false
  }
  if (span === 0 && count < 8) {
    return false
  }
  const avgInterval = count > 1 ? span / (count - 1) : span
  return avgInterval <= 120
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
