import { login, logout, getInfo, getCurrentTenant } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'

const user = {
  state: {
    token: getToken(),
    name: '',
    userId: '',
    avatar: '',
    roles: [],
    permissions: [],
    // 租户信息（与设备前端一致）：登录/ getInfo 带回，供请求头 X-Tenant-Id 与租户数据隔离
    tenant: null,
    tenantSyncedAt: 0
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_TENANT: (state, tenant) => {
      state.tenant = tenant
    },
    SET_TENANT_SYNCED_AT: (state, ts) => {
      state.tenantSyncedAt = ts || 0
    },
    SET_NAME: (state, name) => {
      state.name = name
    },
    SET_ID: (state, userId) => {
      state.userId = userId
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions
    }
  },

  actions: {
    // 登录（耗材前端传 systemType: 'hc'，后端校验 hc_status/hc_planned_disable_time，停用提示「耗材系统已经被停用」）
    Login({ commit }, userInfo) {
      const username = userInfo.username.trim()
      const password = userInfo.password
      const code = userInfo.code
      const uuid = userInfo.uuid
      const customerId = userInfo.customerId
      const systemType = userInfo.systemType != null ? userInfo.systemType : 'hc'
      return new Promise((resolve, reject) => {
        login(username, password, code, uuid, customerId, systemType).then(res => {
          setToken(res.token)
          commit('SET_TOKEN', res.token)
          if (res.tenant) {
            commit('SET_TENANT', res.tenant)
          } else {
            commit('SET_TENANT', null)
          }
          commit('SET_TENANT_SYNCED_AT', Date.now())
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 获取用户信息
    GetInfo({ commit, state }) {
      return new Promise((resolve, reject) => {
        getInfo().then(res => {
          const user = res.user
          const avatar = (user.avatar == "" || user.avatar == null) ? require("@/assets/images/profile.jpg") : process.env.VUE_APP_BASE_API + user.avatar;
          if (res.roles && res.roles.length > 0) {
            commit('SET_ROLES', res.roles)
          } else {
            commit('SET_ROLES', ['ROLE_DEFAULT'])
          }
          // 权限与角色解耦：租户/无角色用户按钮权限来自后端 sys_user_menu（须始终写入 store，否则 v-hasPermi 全 false）
          if (res.permissions != null) {
            commit('SET_PERMISSIONS', Array.isArray(res.permissions) ? res.permissions : [...res.permissions])
          }
          commit('SET_NAME', user.userName)
          commit('SET_ID', user.userId)
          commit('SET_AVATAR', avatar)
          if (res.tenant) {
            commit('SET_TENANT', res.tenant)
          } else {
            commit('SET_TENANT', null)
          }
          commit('SET_TENANT_SYNCED_AT', Date.now())
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 退出系统
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        logout(state.token).then(() => {
          commit('SET_TOKEN', '')
          commit('SET_ROLES', [])
          commit('SET_PERMISSIONS', [])
          commit('SET_TENANT', null)
          commit('SET_TENANT_SYNCED_AT', 0)
          removeToken()
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        commit('SET_TENANT', null)
        commit('SET_TENANT_SYNCED_AT', 0)
        removeToken()
        resolve()
      })
    },
    RefreshTenant({ commit, state }, force = false) {
      return new Promise((resolve) => {
        if (!state.token) {
          resolve(null)
          return
        }
        const now = Date.now()
        if (!force && state.tenant && state.tenant.customerId && (now - (state.tenantSyncedAt || 0) < 15000)) {
          resolve(state.tenant)
          return
        }
        getCurrentTenant().then(res => {
          if (res && res.tenant) {
            commit('SET_TENANT', res.tenant)
          }
          commit('SET_TENANT_SYNCED_AT', Date.now())
          resolve(res && res.tenant ? res.tenant : null)
        }).catch(() => {
          resolve(null)
        })
      })
    },
  }
}

export default user
