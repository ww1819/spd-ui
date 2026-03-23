import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index'
import ParentView from '@/components/ParentView'
import InnerLink from '@/layout/components/InnerLink'

const permission = {
  state: {
    routes: [],
    addRoutes: [],
    defaultRoutes: [],
    topbarRouters: [],
    sidebarRouters: []
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes
      state.routes = constantRoutes.concat(routes)
    },
    SET_DEFAULT_ROUTES: (state, routes) => {
      state.defaultRoutes = constantRoutes.concat(routes)
    },
    SET_TOPBAR_ROUTES: (state, routes) => {
      state.topbarRouters = routes
    },
    SET_SIDEBAR_ROUTERS: (state, routes) => {
      state.sidebarRouters = routes
    },
  },
  actions: {
    // 生成路由（getRouters 失败时必须 reject，否则路由守卫 next 不会被调用，会卡在登录后进不去首页）
    GenerateRoutes({ commit }) {
      return new Promise((resolve, reject) => {
        // 向后端请求路由数据
        getRouters().then(res => {
          const sdata = JSON.parse(JSON.stringify(res.data))
          const rdata = JSON.parse(JSON.stringify(res.data))
          const sidebarRoutes = filterAsyncRouter(sdata)
          const rewriteRoutes = filterAsyncRouter(rdata, false, true)
          const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
          rewriteRoutes.push({ path: '*', redirect: '/404', hidden: true })
          router.addRoutes(asyncRoutes);
          commit('SET_ROUTES', rewriteRoutes)
          commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat(sidebarRoutes))
          commit('SET_DEFAULT_ROUTES', sidebarRoutes)
          commit('SET_TOPBAR_ROUTES', sidebarRoutes)
          resolve(rewriteRoutes)
        }).catch(err => reject(err))
      })
    }
  }
}

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter((route, index) => {
    // 为每个路由添加唯一的ID，避免key重复
    if (!route.uniqueId) {
      route.uniqueId = `route_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }
    // vue-router 要求 route 必须有 path，后端可能返回空或 null
    if (route.path == null || String(route.path).trim() === '') {
      route.path = `/_${route.uniqueId}`
    } else {
      route.path = String(route.path).trim()
    }

    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = []
  childrenMap.forEach((el, index) => {
    // 为每个子路由添加唯一ID
    if (!el.uniqueId) {
      el.uniqueId = `child_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }
    if (el.path == null || String(el.path).trim() === '') {
      el.path = `/_${el.uniqueId}`
    } else {
      el.path = String(el.path).trim()
    }
    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach((c, cIndex) => {
          // 为嵌套的子路由添加唯一ID
          if (!c.uniqueId) {
            c.uniqueId = `nested_${Date.now()}_${cIndex}_${Math.random().toString(36).substr(2, 9)}`
          }
          const cPath = (c.path != null && String(c.path).trim() !== '') ? String(c.path).trim() : `/_${c.uniqueId || cIndex}`
          c.path = (el.path || '') + '/' + cPath
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c))
            return
          }
          children.push(c)
        })
        return
      }
    }
    if (lastRouter) {
      const basePath = (lastRouter.path != null && lastRouter.path !== '') ? lastRouter.path : '/'
      el.path = basePath + '/' + (el.path != null && el.path !== '' ? el.path : el.uniqueId)
    }
    children = children.concat(el)
  })
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes) {
  const res = []
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export const loadView = (view) => {
  if (process.env.NODE_ENV === 'development') {
    return (resolve) => require([`@/views/${view}`], resolve)
  } else {
    // 使用 import 实现生产环境的路由懒加载
    return () => import(`@/views/${view}`)
  }
}

export default permission
