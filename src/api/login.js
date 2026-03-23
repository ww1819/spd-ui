import request from '@/utils/request'

// 登录方法（耗材前端传 systemType: 'hc'、customerId 时后端校验耗材状态，停用提示「耗材系统已经被停用」）
export function login(username, password, code, uuid, customerId, systemType) {
  const data = {
    username,
    password,
    code,
    uuid
  }
  if (customerId !== undefined && customerId !== null && customerId !== '') {
    data.customerId = customerId
  }
  if (systemType !== undefined && systemType !== null && systemType !== '') {
    data.systemType = systemType
  }
  return request({
    url: '/login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/getInfo',
    method: 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}

// 登录页租户下拉选项（未登录可访问）。耗材传 systemType=hc 仅返回耗材启用租户
export function getCustomerOptions(systemType) {
  return request({
    url: '/getCustomerOptions',
    headers: {
      isToken: false
    },
    method: 'get',
    params: systemType ? { systemType } : {}
  })
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: '/captchaImage',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}