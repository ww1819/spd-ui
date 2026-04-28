import request from '@/utils/request'

/** 应用版本（匿名，无需登录） */
export function getAppVersion() {
  return request({
    url: '/common/version',
    method: 'get',
    headers: { isToken: false, hideError: true }
  })
}
