import request from '@/utils/request'

/** 获取当前用户某键的配置值（可选接口：后端未部署时 404 不弹全局红条，列仍按默认全部显示） */
export function getUserUiConfig(configKey) {
  return request({
    url: '/system/userUiConfig/get',
    method: 'get',
    params: { configKey },
    hideError: true
  })
}

/** 保存当前用户配置（失败时在业务里提示，避免与全局 404 重复弹窗） */
export function saveUserUiConfig(data) {
  return request({
    url: '/system/userUiConfig/save',
    method: 'post',
    data,
    hideError: true
  })
}
