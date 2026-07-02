/**
 * 将手工输入的日期字符串规范为 yyyy-MM-dd。
 * 支持：20260216、2026-2-16、2026/02/16 等常见格式。
 */
export function isValidYmd(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function normalizeCompactDateInput(value, force = false) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return isValidYmd(s) ? s : (force ? '' : s);
  }

  const slashMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (slashMatch) {
    const formatted = `${slashMatch[1]}-${String(slashMatch[2]).padStart(2, '0')}-${String(slashMatch[3]).padStart(2, '0')}`;
    return isValidYmd(formatted) ? formatted : (force ? '' : s);
  }

  const digits = s.replace(/\D/g, '');
  if (digits.length === 8) {
    const formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    return isValidYmd(formatted) ? formatted : (force ? '' : s);
  }

  return force ? '' : s;
}

/** 从 el-date-picker blur 事件参数中读取输入框原始值 */
export function readDatePickerInputValue(pickerOrEvent, fallback = '') {
  if (pickerOrEvent && pickerOrEvent.target && pickerOrEvent.target.tagName === 'INPUT') {
    return pickerOrEvent.target.value;
  }
  if (pickerOrEvent && pickerOrEvent.$el) {
    const input = pickerOrEvent.$el.querySelector('input');
    if (input) return input.value;
  }
  return fallback;
}
