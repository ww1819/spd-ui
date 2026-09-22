import { isExternal } from '@/utils/validate'

export function normalizeMenuPath(menuPath) {
  if (!menuPath || typeof menuPath !== 'string') {
    return ''
  }
  const normalized = menuPath.replace(/\\/g, '/')
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1)
  }
  return normalized
}

export function joinMenuPath(basePath, routePath) {
  if (isExternal(routePath)) {
    return routePath
  }
  if (isExternal(basePath)) {
    return basePath
  }
  const base = normalizeMenuPath(basePath)
  const segment = (routePath == null ? '' : String(routePath)).replace(/\\/g, '/')
  if (!segment) {
    return base
  }
  if (segment.startsWith('/')) {
    return normalizeMenuPath(segment)
  }
  if (!base || base === '/') {
    return normalizeMenuPath('/' + segment.replace(/^\//, ''))
  }
  return normalizeMenuPath(base + '/' + segment)
}

export function visibleChildren(item) {
  return ((item && item.children) || []).filter(child => child && !child.hidden)
}

export function menuTitle(item) {
  return (item && item.meta && item.meta.title) || ''
}

export function menuIcon(item) {
  return (item && item.meta && item.meta.icon) || ''
}

export function resolveMenuTo(item, basePath) {
  if (!item) return ''
  const path = item.path == null ? '' : String(item.path)
  if (isExternal(path)) {
    return path
  }
  const full = joinMenuPath(basePath, path)
  if (item.query) {
    try {
      const query = typeof item.query === 'string' ? JSON.parse(item.query) : item.query
      return { path: full, query }
    } catch (e) {
      return full
    }
  }
  return full
}

export function pathOfTo(to) {
  if (!to) return ''
  if (typeof to === 'string') return normalizeMenuPath(to)
  return normalizeMenuPath(to.path)
}

export function isActivePath(routePath, to) {
  const target = pathOfTo(to)
  const current = normalizeMenuPath(routePath)
  if (!target || !current) return false
  return current === target || current.startsWith(target + '/')
}

export function isLeafMenu(item) {
  const kids = visibleChildren(item)
  if (!kids.length) return true
  if (item && item.alwaysShow) return false
  return kids.length === 1 && visibleChildren(kids[0]).length === 0
}

/** 可点击进页的菜单；按钮权限（path 为空/#、无页面组件）不进京东分栏链接 */
export function isNavigableMenuLink(item) {
  if (!item || item.hidden) return false
  const path = item.path == null ? '' : String(item.path).trim()
  if (!path || path === '#') return false
  const comp = item.component
  if (comp === false) return false
  return true
}

export function collectLeafMenus(routers, limit) {
  const max = limit == null ? 8 : limit
  const acc = []
  const walk = (routes, parentPath) => {
    (routes || []).forEach((route) => {
      if (!route || route.hidden || acc.length >= max) return
      const full = joinMenuPath(parentPath, route.path)
      const kids = visibleChildren(route)
      if (!kids.length) {
        const title = menuTitle(route)
        if (title && title !== '首页' && full && !isExternal(full) && isNavigableMenuLink(route)) {
          acc.push({
            path: full,
            title,
            icon: menuIcon(route)
          })
        }
        return
      }
      walk(kids, full)
    })
  }
  walk(getFirstLevelMenus(routers), '')
  return acc
}

export function getFirstLevelMenus(routers) {
  const list = []
  ;(routers || []).forEach((menu) => {
    if (!menu || menu.hidden) return
    if ((menu.path === '/' || menu.path === '') && visibleChildren(menu).length) {
      visibleChildren(menu).forEach((child) => {
        list.push({
          ...child,
          path: joinMenuPath(menu.path, child.path)
        })
      })
      return
    }
    list.push(menu)
  })
  return list
}

export function firstLevelKey(item, index) {
  return (item && (item.uniqueId || item.path)) || `nav_${index}`
}

export function isActiveFirstLevel(routePath, item) {
  if (isLeafMenu(item)) {
    const kids = visibleChildren(item)
    const target = kids.length === 1 && !(item && item.alwaysShow)
      ? resolveMenuTo(kids[0], item.path)
      : resolveMenuTo(item, '')
    return isActivePath(routePath, target)
  }
  const base = normalizeMenuPath(item.path)
  const current = normalizeMenuPath(routePath)
  if (!base || !current) return false
  return current === base || current.startsWith(base + '/')
}

/**
 * 京东式分组：二级为分组标题，三级为可点链接。
 * 只有二级叶子时，用一级标题做假二级，把这些叶子当成三级，避免面板里有的分组有链接、有的只有一行标题。
 */
export function buildMegaGroups(item) {
  if (!item) {
    return { groups: [], leafTo: null }
  }
  if (isLeafMenu(item)) {
    const kids = visibleChildren(item)
    const leafTo = kids.length === 1 && !(item && item.alwaysShow)
      ? resolveMenuTo(kids[0], item.path)
      : resolveMenuTo(item, '')
    return { groups: [], leafTo }
  }
  const base = item.path
  const folders = []
  const leafLinks = []
  visibleChildren(item).forEach((child) => {
    const childBase = joinMenuPath(base, child.path)
    const grand = visibleChildren(child)
    if (!grand.length) {
      leafLinks.push({
        title: menuTitle(child),
        to: resolveMenuTo(child, base)
      })
      return
    }
    folders.push({
      title: menuTitle(child),
      icon: menuIcon(child),
      to: null,
      children: grand.flatMap((g) => {
        const gKids = visibleChildren(g).filter(isNavigableMenuLink)
        // 仅有按钮子级时，仍展示本级页面入口，不把「期初新增」等按钮展平成菜单
        if (!gKids.length) {
          if (!isNavigableMenuLink(g)) return []
          return [{
            title: menuTitle(g),
            to: resolveMenuTo(g, childBase)
          }]
        }
        const gBase = joinMenuPath(childBase, g.path)
        return gKids.map((gg) => ({
          title: menuTitle(gg),
          to: resolveMenuTo(gg, gBase)
        }))
      })
    })
  })
  const groups = folders.slice()
  // 目录分组在前、叶子分组在后：库房为「入库 | 出库 / 盘点 | 库房」
  if (leafLinks.length) {
    groups.push({
      title: menuTitle(item) || '功能菜单',
      icon: menuIcon(item),
      to: null,
      children: leafLinks
    })
  }
  return { groups, leafTo: null }
}
