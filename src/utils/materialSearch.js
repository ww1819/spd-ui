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

/**
 * 耗材名称：名称/简码/通用名/品牌 + 拼音首字母（不含编码、规格、型号）
 */
export function matchMaterialNameKeyword(item, rawKeyword) {
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
    item.referredName,
    item.referred_name,
    item.useName,
    item.use_name,
    item.brand,
  ];
  for (let i = 0; i < fields.length; i += 1) {
    const v = fields[i];
    if (fieldContainsKeyword(v, k, kUpper)) {
      return true;
    }
  }
  if (/^[a-zA-Z]+$/.test(kw)) {
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
    const nameForPy = item.name || item.referredName || item.referred_name || '';
    if (nameForPy) {
      const initials = getMaterialPinyinInitials(nameForPy);
      if (initials.includes(kUpper)) {
        return true;
      }
    }
  }
  return false;
}

/** 耗材编码：模糊匹配（大小写不敏感） */
export function matchMaterialCodeKeyword(item, rawKeyword) {
  if (!item) {
    return false;
  }
  const kw = normalizeMaterialSearchKeyword(rawKeyword);
  if (!kw) {
    return true;
  }
  const code = item.code;
  if (code == null || String(code).trim() === '') {
    return false;
  }
  const k = kw.toLowerCase();
  const kUpper = kw.toUpperCase();
  const s = String(code);
  if (s.toLowerCase().includes(k) || s.toUpperCase().includes(kUpper)) {
    return true;
  }
  if (/^[a-zA-Z]+$/.test(kw)) {
    const codeAlpha = extractAlphaUpper(code);
    if (codeAlpha && codeAlpha.includes(kUpper)) {
      return true;
    }
  }
  return false;
}

/** 规格检索：文本模糊 + 拼音首字母（大小写不敏感） */
export function matchSpecKeyword(spec, rawKeyword) {
  const kw = normalizeMaterialSearchKeyword(rawKeyword);
  if (!kw) {
    return true;
  }
  if (spec == null || String(spec).trim() === '') {
    return false;
  }
  const text = String(spec);
  const k = kw.toLowerCase();
  const kUpper = kw.toUpperCase();
  if (text.toLowerCase().includes(k) || text.toUpperCase().includes(kUpper)) {
    return true;
  }
  if (/^[a-zA-Z]+$/.test(kw)) {
    const initials = getMaterialPinyinInitials(text);
    if (initials.includes(kUpper)) {
      return true;
    }
  }
  return false;
}

/** 型号检索：与规格一致，文本模糊 + 拼音首字母（大小写不敏感） */
export function matchModelKeyword(model, rawKeyword) {
  return matchSpecKeyword(model, rawKeyword);
}

/**
 * 将耗材名称关键词转为后端 name / nameSearch 参数（与产品档案列表一致）
 * - 含中文：name + nameSearch（拼音首字母简码）
 * - 纯字母：仅 nameSearch（按 referred_name 模糊，支持首/尾字母大小写不敏感）
 * - 其他：仅 name 文本模糊
 */
export function deriveMaterialNameSearchParams(keyword) {
  const nameValue = normalizeMaterialSearchKeyword(keyword);
  if (!nameValue) {
    return { name: undefined, nameSearch: undefined };
  }
  const hasChinese = /[\u4e00-\u9fa5]/.test(nameValue);
  const isLetterOnly = /^[A-Za-z]+$/.test(nameValue);
  if (hasChinese) {
    const pinyinCode = getMaterialPinyinInitials(nameValue);
    return {
      name: nameValue,
      nameSearch: pinyinCode || undefined
    };
  }
  if (isLetterOnly) {
    return {
      name: undefined,
      nameSearch: nameValue.toUpperCase()
    };
  }
  return {
    name: nameValue,
    nameSearch: undefined
  };
}
