/**
 * 侧栏/顶栏/抽屉标题等「主题风格」色面解析。
 * sideTheme: theme-dark | theme-light | theme-medical | theme-teal | theme-sky | theme-navy | theme-brand
 */
export function resolveSideThemeChrome(sideTheme) {
  const key = sideTheme || 'theme-dark'
  switch (key) {
    case 'theme-medical':
      return { bg: '#0c4a6e', on: '#ffffff', lightText: true }
    case 'theme-teal':
      return { bg: '#0f766e', on: '#ffffff', lightText: true }
    case 'theme-navy':
    case 'theme-brand':
      return { bg: '#2C569A', on: '#ffffff', lightText: true }
    case 'theme-sky':
      // 柔蓝底偏浅，抽屉标题用稍深一档保证白字可读
      return { bg: '#3A6BB0', on: '#ffffff', lightText: true }
    case 'theme-light':
      return { bg: '#2563eb', on: '#ffffff', lightText: true }
    case 'theme-dark':
    default:
      return { bg: '#1c2430', on: '#ffffff', lightText: true }
  }
}

/** 写入 html 根节点 CSS 变量，供各页抽屉标题等复用 */
export function applySideThemeCssVars(sideTheme) {
  if (typeof document === 'undefined') return
  const chrome = resolveSideThemeChrome(sideTheme)
  const root = document.documentElement
  root.style.setProperty('--spd-side-theme', chrome.bg)
  root.style.setProperty('--spd-side-theme-on', chrome.on)
}
