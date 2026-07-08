import { pinyin } from 'pinyin-pro';

/** 与后端 MaterialSearchKeywordUtils 一致：trim、全角转半角、折叠空白 */
export function normalizeMaterialSearchKeyword(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  let s = String(raw).trim();
  if (!s) {
    return '';
  }
  s = s
    .replace(/\u3000/g, ' ')
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
  s = s.replace(/\s+/g, ' ');
  return s.trim();
}

export function getMaterialPinyinInitials(str) {
  try {
    return pinyin(str || '', {
      pattern: 'first',
      toneType: 'none',
      type: 'array',
    })
      .join('')
      .toUpperCase();
  } catch (e) {
    return '';
  }
}

function extractAlphaUpper(str) {
  return String(str || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
}

function fieldContainsKeyword(value, k, kUpper) {
  if (value == null || String(value).trim() === '') {
    return false;
  }
  const s = String(value);
  return s.toLowerCase().includes(k) || s.toUpperCase().includes(kUpper);
}

/**
 * 判断产品档案行是否匹配关键词（名称/编码/简码/规格/型号/品牌/通用名 + 拼音首字母）。
 */
export function matchMaterialKeyword(item, rawKeyword) {
  if (!item) {
    return false;
  }
  const kw = normalizeMaterialSearchKeyword(rawKeyword);
  if (!kw) {
    return true;
  }
  const k = kw.toLowerCase();
  const kUpper = kw.toUpperCase();
  const fields = [
    item.name,
    item.code,
    item.referredName,
    item.referred_name,
    item.useName,
    item.use_name,
    item.speci,
    item.model,
    item.brand,
  ];
  for (let i = 0; i < fields.length; i += 1) {
    const v = fields[i];
    if (fieldContainsKeyword(v, k, kUpper)) {
      return true;
    }
  }
  if (/^[a-zA-Z]+$/.test(kw)) {
    const codeAlpha = extractAlphaUpper(item.code);
    if (codeAlpha && codeAlpha.includes(kUpper)) {
      return true;
    }
    const referred = item.referredName || item.referred_name;
    if (referred) {
      const refUpper = String(referred).toUpperCase();
      if (refUpper.includes(kUpper)) {
        return true;
      }
      const refInitials = getMaterialPinyinInitials(referred);
      if (refInitials.includes(kUpper)) {
        return true;
      }
    }
    const nameForPy = item.name || item.code || item.referredName || item.referred_name || '';
    if (nameForPy) {
      const initials = getMaterialPinyinInitials(nameForPy);
      if (initials.includes(kUpper)) {
        return true;
      }
      const allInitials = getMaterialPinyinInitials(
        [item.name, item.code, item.referredName, item.referred_name, item.speci].filter(Boolean).join('')
      );
      if (allInitials.includes(kUpper)) {
        return true;
      }
    }
  }
  return false;
}
