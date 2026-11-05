import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isRelogin } from '@/utils/request'
import { scheduleMainContentScrollReset } from '@/utils/reset-main-scroll'
import { tryAutoOpenMessageReminder } from '@/utils/messageReminderAutoOpen'
import { trackRouteMenuHit } from '@/utils/menu-hit'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/register', '/sso-callback']

/** 浏览器整页刷新（F5/地址栏刷新），非顶部「刷新当前页」SPA 重建 */
function isBrowserPageReload() {
  try {
    const nav = typeof performance !== 'undefined' && performance.getEntriesByType
      ? performance.getEntriesByType('navigation')[0]
      : null
    if (nav && nav.type === 'reload') {
      return true
    }
    // 旧 API 兜底：TYPE_RELOAD = 1
    if (typeof performance !== 'undefined' && performance.navigation
      && performance.navigation.type === 1) {
      return true
    }
  } catch (e) {
    /* ignore */
  }
  return false
}

function isHomePath(path) {
  return path === '/' || path === '/index' || path === '/index/'
}

/** 整页刷新后只处理一次：强制回首页（顶部刷新按钮走 /redirect 不算整页刷新） */
let bootReloadHomeHandled = false

function shouldForceHomeAfterBrowserReload(to) {
  if (bootReloadHomeHandled) {
    return false
  }
  bootReloadHomeHandled = true
  if (!isBrowserPageReload()) {
    return false
  }
  if (!to || isHomePath(to.path) || to.path === '/login') {
    return false
  }
  return true
}

router.beforeEach((to, from, next) => {
  NProgress.start()
  if (getToken()) {
    to.meta.title && store.dispatch('settings/setTitle', to.meta.title)
    /* has token*/
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      if (store.getters.roles.length === 0) {
        isRelogin.show = true
        // 判断当前用户是否已拉取完user_info信息
        store.dispatch('GetInfo').then(() => {
          isRelogin.show = false
          store.dispatch('GenerateRoutes').then(accessRoutes => {
            // 根据roles权限生成可访问的路由表
            router.addRoutes(accessRoutes) // 动态添加可访问路由表
            tryAutoOpenMessageReminder(store)
            if (to.meta && to.meta.paused === true) {
              Message.warning('当前菜单功能已被暂停使用')
              next({ path: '/', replace: true })
            } else if (shouldForceHomeAfterBrowserReload(to)) {
              next({ path: '/', replace: true })
            } else {
              next({ ...to, replace: true }) // hack方法 确保addRoutes已完成
            }
          }).catch(err => {
            isRelogin.show = false
            const msg = (err && (err.message || err.msg)) || err || '获取菜单失败'
            Message.error(typeof msg === 'string' ? msg : '获取菜单失败')
            store.dispatch('LogOut').then(() => {
              next(`/login?redirect=${to.fullPath}`)
            })
          })
        }).catch(err => {
          isRelogin.show = false
          const msg = (err && (err.message || err.msg)) || err || '获取用户信息失败'
          Message.error(typeof msg === 'string' ? msg : '获取用户信息失败')
          store.dispatch('LogOut').then(() => {
            next(`/login?redirect=${to.fullPath}`)
          })
        })
      } else {
        if (to.meta && to.meta.paused === true) {
          Message.warning('当前菜单功能已被暂停使用')
          NProgress.done()
          next(false)
          return
        }
        if (shouldForceHomeAfterBrowserReload(to)) {
          next({ path: '/', replace: true })
          return
        }
        next()
      }
    }
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      next(`/login?redirect=${to.fullPath}`) // 否则全部重定向到登录页
      NProgress.done()
    }
  }
})

router.afterEach((to) => {
  NProgress.done()
  scheduleMainContentScrollReset()
  trackRouteMenuHit(to)
})
