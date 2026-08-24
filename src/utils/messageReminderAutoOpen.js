const SESSION_KEY = 'spd_message_reminder_auto_opened'

export function clearMessageReminderAutoOpenFlag() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch (e) {
    // ignore
  }
}

/** 登录后按授权自动打开消息提醒弹窗（同一会话仅一次） */
export function tryAutoOpenMessageReminder(store) {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) {
      return
    }
    const popupKeys = store.getters.messageReminderPopupKeys
    if (popupKeys == null || !Array.isArray(popupKeys) || popupKeys.length === 0) {
      return
    }
    const authKeys = store.getters.messageReminderKeys
    const all = ['warehouse', 'department', 'data']
    const allowedAuth = authKeys == null ? all : authKeys
    const effective = popupKeys.filter(k => allowedAuth.includes(k))
    if (!effective.length) {
      return
    }
    sessionStorage.setItem(SESSION_KEY, '1')
    store.dispatch('app/openWarehouseReminder', { category: effective[0] })
  } catch (e) {
    // ignore
  }
}
