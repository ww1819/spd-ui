/**
 * 全角转半角（数字/字母/符号/空格）
 */
export function toHalfWidth(input) {
  if (input === null || input === undefined) {
    return '';
  }
  return String(input)
    .replace(/\u3000/g, ' ')
    .replace(/[\uFF01-\uFF5E]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
}

/**
 * 扫码/粘贴 UDI：去除中英文括号，便于存储与检索。
 * @param {string} val
 * @returns {string|undefined|null}
 */
export function sanitizeUdiNo(val) {
  if (val == null || val === '') {
    return val;
  }
  return String(val)
    .replace(/[\uFF08\uFF09（）]/g, '')
    .replace(/[()]/g, '')
    .trim();
}

function formatGs1DateYyMmDd(dateStr) {
  if (!dateStr || dateStr.length < 6) return '';
  const year = '20' + dateStr.substring(0, 2);
  const month = dateStr.substring(2, 4);
  const day = dateStr.substring(4, 6);
  return `${year}-${month}-${day}`;
}

const VARIABLE_AIS = ['11', '17', '10', '21'];

function findNextAiIndex(s, from) {
  for (let i = from; i < s.length - 1; i++) {
    const ai = s.substring(i, i + 2);
    if (VARIABLE_AIS.includes(ai)) {
      return i;
    }
  }
  return s.length;
}

/**
 * 解析 GS1 UDI（输入应先经 toHalfWidth + sanitizeUdiNo，无括号紧凑格式）。
 * @returns {object|null} 与备货验收 parseUDIString 结构一致
 */
export function parseGs1UdiScan(raw) {
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  const s = sanitizeUdiNo(toHalfWidth(raw).trim());
  if (!s) {
    return null;
  }

  const result = {
    udiCode: '',
    udiCodeForQuery: '',
    secondaryBarcode: '',
    productionDate: '',
    expiryDate: '',
    batchNo: '',
    serialNo: ''
  };

  if (s.startsWith('01') && s.length >= 16) {
    const gtin = s.substring(2, 16);
    result.udiCodeForQuery = gtin;
    result.udiCode = gtin;
    let i = 16;
    while (i < s.length) {
      const ai = s.substring(i, i + 2);
      if (ai === '11' && i + 8 <= s.length) {
        const d = s.substring(i + 2, i + 8);
        result.productionDate = formatGs1DateYyMmDd(d);
        i += 8;
      } else if (ai === '17' && i + 8 <= s.length) {
        const d = s.substring(i + 2, i + 8);
        result.expiryDate = formatGs1DateYyMmDd(d);
        i += 8;
      } else if (ai === '10') {
        const next = findNextAiIndex(s, i + 2);
        result.batchNo = s.substring(i + 2, next);
        i = next;
      } else if (ai === '21') {
        result.serialNo = s.substring(i + 2);
        i = s.length;
      } else {
        break;
      }
    }
    const idx11 = s.indexOf('11', 16);
    if (idx11 >= 16) {
      result.secondaryBarcode = s.substring(idx11);
    }
    return result;
  }

  const numericMatch = s.match(/^(\d+)/);
  if (numericMatch) {
    result.udiCodeForQuery = numericMatch[1];
    result.udiCode = numericMatch[1];
    const rest = s.substring(numericMatch[1].length);
    if (rest) {
      result.secondaryBarcode = rest;
    }
    return result;
  }

  return null;
}

/**
 * 规范化 UDI 扫码框内容（半角 + 去括号）
 */
export function normalizeUdiScanInput(val) {
  return sanitizeUdiNo(toHalfWidth(val));
}

/**
 * 构建产品字典 UDI 查询候选（优先完整扫码串，兼容 GS1 解析出的 GTIN 等格式）
 * @param {string} rawInput 扫码框原始值
 * @param {ReturnType<typeof parseGs1UdiScan>|null} parsed
 * @returns {string[]}
 */
export function buildUdiQueryVariants(rawInput, parsed) {
  const variants = [];
  const full = normalizeUdiScanInput(rawInput);
  if (full) {
    variants.push(full);
  }
  if (!parsed) {
    return [...new Set(variants)];
  }
  const q = parsed.udiCodeForQuery;
  if (q) {
    variants.push(q);
    if (/^\d+$/.test(q)) {
      const prefixed01 = `01${q}`;
      variants.push(prefixed01);
      variants.push(`(01)${q}`);
      const withoutLeadingZeros = q.replace(/^0+/, '');
      if (withoutLeadingZeros && withoutLeadingZeros !== q) {
        variants.push(withoutLeadingZeros);
        variants.push(`01${withoutLeadingZeros}`);
        variants.push(`(01)${withoutLeadingZeros}`);
      }
      const padded14 = q.padStart(14, '0');
      if (padded14 !== q) {
        variants.push(padded14);
        variants.push(`01${padded14}`);
        variants.push(`(01)${padded14}`);
      }
      if (withoutLeadingZeros && withoutLeadingZeros !== q) {
        const padded14NoLeading = withoutLeadingZeros.padStart(14, '0');
        if (padded14NoLeading !== padded14 && padded14NoLeading !== q) {
          variants.push(padded14NoLeading);
          variants.push(`01${padded14NoLeading}`);
          variants.push(`(01)${padded14NoLeading}`);
        }
      }
      const padded13 = q.padStart(13, '0');
      if (padded13 !== q && padded13 !== padded14) {
        variants.push(padded13);
        variants.push(`01${padded13}`);
        variants.push(`(01)${padded13}`);
      }
    }
  }
  if (parsed.udiCode && parsed.udiCode !== q) {
    variants.push(parsed.udiCode);
  }
  return [...new Set(variants.filter(v => v != null && String(v).trim() !== ''))];
}
