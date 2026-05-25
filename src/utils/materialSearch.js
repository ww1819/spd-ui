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
    if (v != null && String(v).trim() !== '') {
      const s = String(v);
      if (s.toLowerCase().includes(k) || s.toUpperCase().includes(kUpper)) {
        return true;
      }
    }
  }
  const nameForPy = item.name || item.code || item.referredName || item.referred_name || '';
  if (/^[a-zA-Z]+$/.test(kw) && nameForPy) {
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
  return false;
}
