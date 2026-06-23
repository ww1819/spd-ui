import { pinyin } from 'pinyin-pro'

/** 解析科室下拉接口返回（optionselect / listAll 等） */
export function normalizeDepartPickResponse(res) {
  if (Array.isArray(res)) {
    return res.filter(d => d && d.id != null)
  }
  if (res && Array.isArray(res.data)) {
    return res.data.filter(d => d && d.id != null)
  }
  return []
}

/** 科室下拉：名称 / 编码 / 简码 / 拼音首字母模糊匹配 */
export function filterDepartPickList(list, query) {
  const source = list || []
  if (!query) {
    return source
  }
  const q = String(query).trim()
  if (!q) {
    return source
  }
  const queryUpper = q.toUpperCase()
  return source.filter(item => {
    if (!item || !item.name) {
      return false
    }
    const name = item.name
    const code = (item.code || '').toUpperCase()
    const referred = (item.referredName || '').toUpperCase()
    if (name.includes(q) || name.toUpperCase().includes(queryUpper) || code.includes(queryUpper) || referred.includes(queryUpper)) {
      return true
    }
    if (/^[a-zA-Z]+$/.test(q)) {
      try {
        const initials = pinyin(name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toUpperCase()
        if (initials.includes(queryUpper)) {
          return true
        }
      } catch (e) {
        return false
      }
    }
    return false
  })
}
