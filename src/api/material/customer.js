import request from '@/utils/request'

/** 耗材侧客户列表（供客户菜单功能管理下拉等，与设备共用数据） */
export function listHcCustomers(query) {
  return request({
    url: '/material/system/customer/list',
    method: 'get',
    params: query
  })
}

/** 耗材侧客户详情（含 hcStatus、hcPlannedDisableTime） */
export function getHcCustomer(customerId) {
  return request({
    url: '/material/system/customer/' + customerId,
    method: 'get'
  })
}

/** 耗材侧客户更新（仅客户名称、备注、耗材状态、耗材计划停用时间） */
export function updateHcCustomer(data) {
  return request({
    url: '/material/system/customer',
    method: 'put',
    data: data
  })
}

/** 耗材侧客户启停用（更新 hc_status，写耗材启停用记录与时间段） */
export function changeHcStatus(data) {
  return request({
    url: '/material/system/customer/changeHcStatus',
    method: 'put',
    data: data
  })
}

export function getCustomerStatusLogs(tenantId) {
  return request({
    url: '/material/system/customer/statusLog',
    method: 'get',
    params: { tenantId }
  })
}

export function getCustomerPeriodLogs(tenantId) {
  return request({
    url: '/material/system/customer/periodLog',
    method: 'get',
    params: { tenantId }
  })
}

/** 耗材客户权限：分配用菜单树（排除客户管理、客户菜单功能管理） */
export function treeselectHcMenu() {
  return request({
    url: '/material/system/customer/treeselectMenu',
    method: 'get'
  })
}

/** 耗材客户权限：已分配菜单ID列表 */
export function getHcCustomerMenuIds(customerId) {
  return request({
    url: '/material/system/customer/menuIds/' + customerId,
    method: 'get'
  })
}

/** 耗材客户权限：保存（覆盖） */
export function saveHcCustomerMenus(customerId, menuIds) {
  return request({
    url: '/material/system/customer/menu',
    method: 'put',
    params: { customerId },
    data: { menuIds: Array.isArray(menuIds) ? menuIds : [] }
  })
}
