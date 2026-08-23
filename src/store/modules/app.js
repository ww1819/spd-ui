import Cookies from 'js-cookie'

const state = {
  sidebar: {
    opened: Cookies.get('sidebarStatus') ? !!+Cookies.get('sidebarStatus') : true,
    withoutAnimation: false,
    hide: false
  },
  device: 'desktop',
  size: Cookies.get('size') || 'medium',
  /** 消息提醒弹层：在主内容区（AppMain）内展示 */
  warehouseReminderVisible: false,
  /** 消息提醒左侧分类：warehouse | department | data */
  messageReminderCategory: 'warehouse',
  /** 仓库预警内子 Tab：apply | purchase | inventory | nearExpiry */
  warehouseReminderSubTab: 'apply',
  /** 科室预警内子 Tab：unreceivedConfirm | inventory | expiry */
  departmentReminderSubTab: 'unreceivedConfirm',
  /** 侧栏叶子菜单点击：{ path, tick }，用于同页从侧栏进入时重置弹窗 */
  sidebarNavTick: null
}

const mutations = {
  TOGGLE_SIDEBAR: state => {
    if (state.sidebar.hide) {
      return false;
    }
    state.sidebar.opened = !state.sidebar.opened
    state.sidebar.withoutAnimation = false
    if (state.sidebar.opened) {
      Cookies.set('sidebarStatus', 1)
    } else {
      Cookies.set('sidebarStatus', 0)
    }
  },
  CLOSE_SIDEBAR: (state, withoutAnimation) => {
    Cookies.set('sidebarStatus', 0)
    state.sidebar.opened = false
    state.sidebar.withoutAnimation = withoutAnimation
  },
  TOGGLE_DEVICE: (state, device) => {
    state.device = device
  },
  SET_SIZE: (state, size) => {
    state.size = size
    Cookies.set('size', size)
  },
  SET_SIDEBAR_HIDE: (state, status) => {
    state.sidebar.hide = status
  },
  SET_WAREHOUSE_REMINDER_VISIBLE: (state, visible) => {
    state.warehouseReminderVisible = !!visible
  },
  SET_MESSAGE_REMINDER_CATEGORY: (state, category) => {
    const allowed = ['warehouse', 'department', 'data']
    state.messageReminderCategory = allowed.includes(category) ? category : 'warehouse'
  },
  SET_WAREHOUSE_REMINDER_SUB_TAB: (state, subTab) => {
    const allowed = ['apply', 'purchase', 'inventory', 'nearExpiry']
    const normalized = subTab === 'all' ? 'apply' : subTab
    state.warehouseReminderSubTab = allowed.includes(normalized) ? normalized : 'apply'
  },
  SET_DEPARTMENT_REMINDER_SUB_TAB: (state, subTab) => {
    const allowed = ['unreceivedConfirm', 'inventory', 'expiry']
    const normalized = subTab === 'all' ? 'unreceivedConfirm' : subTab
    state.departmentReminderSubTab = allowed.includes(normalized) ? normalized : 'unreceivedConfirm'
  },
  SET_SIDEBAR_NAV_TICK: (state, payload) => {
    if (!payload || !payload.path) {
      state.sidebarNavTick = null
      return
    }
    state.sidebarNavTick = {
      path: String(payload.path),
      tick: payload.tick || Date.now()
    }
  }
}

const actions = {
  toggleSideBar({ commit }) {
    commit('TOGGLE_SIDEBAR')
  },
  closeSideBar({ commit }, { withoutAnimation }) {
    commit('CLOSE_SIDEBAR', withoutAnimation)
  },
  toggleDevice({ commit }, device) {
    commit('TOGGLE_DEVICE', device)
  },
  setSize({ commit }, size) {
    commit('SET_SIZE', size)
  },
  toggleSideBarHide({ commit }, status) {
    commit('SET_SIDEBAR_HIDE', status)
  },
  openWarehouseReminder({ commit }, payload) {
    const mainAllowed = ['warehouse', 'department', 'data']
    const warehouseSubAllowed = ['apply', 'purchase', 'inventory', 'nearExpiry']
    const departmentSubAllowed = ['unreceivedConfirm', 'inventory', 'expiry']
    let cat = 'warehouse'
    let warehouseSub = 'apply'
    let departmentSub = 'unreceivedConfirm'
    if (payload && typeof payload === 'object') {
      if (mainAllowed.includes(payload.category)) {
        cat = payload.category
      } else if (warehouseSubAllowed.includes(payload.category) || payload.category === 'all') {
        cat = 'warehouse'
        warehouseSub = payload.category === 'all' ? 'apply' : payload.category
      } else if (departmentSubAllowed.includes(payload.category) || payload.category === 'all') {
        cat = 'department'
        departmentSub = payload.category === 'all' ? 'unreceivedConfirm' : payload.category
      }
      if (warehouseSubAllowed.includes(payload.subTab) || payload.subTab === 'all') {
        warehouseSub = payload.subTab === 'all' ? 'apply' : payload.subTab
      }
      if (departmentSubAllowed.includes(payload.subTab) || payload.subTab === 'all') {
        departmentSub = payload.subTab === 'all' ? 'unreceivedConfirm' : payload.subTab
      }
    }
    commit('SET_MESSAGE_REMINDER_CATEGORY', cat)
    commit('SET_WAREHOUSE_REMINDER_SUB_TAB', warehouseSub)
    commit('SET_DEPARTMENT_REMINDER_SUB_TAB', departmentSub)
    commit('SET_WAREHOUSE_REMINDER_VISIBLE', true)
  },
  closeWarehouseReminder({ commit }) {
    commit('SET_WAREHOUSE_REMINDER_VISIBLE', false)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
