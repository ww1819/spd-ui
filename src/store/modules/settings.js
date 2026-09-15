import defaultSettings from '@/settings'

const { sideTheme, showSettings, navPosition, tagsView, fixedHeader, sidebarLogo, dynamicTitle, theme: defaultTheme } = defaultSettings

function readStorageSetting() {
  try {
    return JSON.parse(localStorage.getItem('layout-setting')) || {}
  } catch (e) {
    return {}
  }
}

function resolveNavPosition(storage) {
  if (storage.navPosition === 'top' || storage.navPosition === 'side') {
    return storage.navPosition
  }
  if (storage.topNav === true) {
    return 'top'
  }
  if (storage.topNav === false) {
    return 'side'
  }
  return navPosition || 'side'
}

/** 旧默认深色侧栏与右侧列表风格冲突；新版默认浅色，已保存过新版的才沿用深色 */
function resolveSideTheme(storage) {
  if (storage.layoutStyleVer >= 2 && (storage.sideTheme === 'theme-dark' || storage.sideTheme === 'theme-light')) {
    return storage.sideTheme
  }
  return sideTheme || 'theme-light'
}

/** 旧默认 #409EFF 与列表主按钮不一致，未自定义过的迁到 #2563eb */
function resolveTheme(storage) {
  if (storage.theme && storage.theme !== '#409EFF') {
    return storage.theme
  }
  return defaultTheme || '#2563eb'
}

const storageSetting = readStorageSetting()
const state = {
  title: '',
  theme: resolveTheme(storageSetting),
  sideTheme: resolveSideTheme(storageSetting),
  showSettings: showSettings,
  navPosition: resolveNavPosition(storageSetting),
  tagsView: storageSetting.tagsView === undefined ? tagsView : storageSetting.tagsView,
  fixedHeader: storageSetting.fixedHeader === undefined ? fixedHeader : storageSetting.fixedHeader,
  sidebarLogo: storageSetting.sidebarLogo === undefined ? sidebarLogo : storageSetting.sidebarLogo,
  dynamicTitle: storageSetting.dynamicTitle === undefined ? dynamicTitle : storageSetting.dynamicTitle
}
const mutations = {
  CHANGE_SETTING: (state, { key, value }) => {
    if (Object.prototype.hasOwnProperty.call(state, key)) {
      state[key] = value
    }
  }
}

const actions = {
  changeSetting({ commit }, data) {
    commit('CHANGE_SETTING', data)
  },
  setTitle({ commit }, title) {
    state.title = title
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
