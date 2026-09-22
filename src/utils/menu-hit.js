import { getToken } from '@/utils/auth'

const SKIP_EXACT = {
  '/': true,
  '/index': true,
  '/login': true,
  '/register': true,
  '/sso-callback': true,
  '/404': true,
  '/401': true,
  '/user/profile': true
}

let lastKey = ''
let lastAt = 0

export function trackRouteMenuHit(to) {
  if (!getToken() || !to) {
    return
  }
  let path = to.path ? String(to.path) : ''
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  if (!path || SKIP_EXACT[path] || SKIP_EXACT[to.path]) {
    return
  }
  if (path.indexOf('/redirect') === 0 || path.indexOf('/tenant-switch') === 0) {
    return
  }
  const title = (to.meta && to.meta.title) || ''
  if (!title || title === '首页') {
    return
  }
  const now = Date.now()
  if (path === lastKey && now - lastAt < 2500) {
    return
  }
  lastKey = path
  lastAt = now
  import('@/api/dashboard/home').then((mod) => {
    if (mod && mod.reportMenuHit) {
      mod.reportMenuHit({ path, title }).catch(() => {})
    }
  }).catch(() => {})
}
