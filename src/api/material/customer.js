import request from '@/utils/request'

/** 耗材侧客户列表（供客户菜单功能管理下拉等，与设备共用数据） */
export function listHcCustomers(query) {
  return request({
    url: '/material/system/customer/list',
    method: 'get',
    params: query
  })
}

/** 租户类型枚举（新增客户时选择） */
export function getTenantEnumList() {
  return request({
    url: '/material/system/customer/tenantEnumList',
    method: 'get'
  })
}

/** 新增客户 */
export function addCustomer(data) {
  return request({
    url: '/material/system/customer',
    method: 'post',
    data: data
  })
}

/** 删除客户 */
export function delCustomer(customerId) {
  return request({
    url: '/material/system/customer/' + customerId,
    method: 'delete'
  })
}

/** 耗材侧客户详情（含 hcStatus、hcPlannedDisableTime） */
export function getHcCustomer(customerId) {
  return request({
    url: '/material/system/customer/' + customerId,
    method: 'get'
  })
}

/** 耗材侧客户更新（客户名称、备注、耗材状态、耗材系统计划停用时间） */
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

/** 耗材功能重置（耗材客户菜单、super 岗位、super_01 权限重置为系统设置下非平台管理功能） */
export function resetMaterialFunctions(customerId) {
  return request({
    url: '/material/system/customer/resetMaterial/' + customerId,
    method: 'put'
  })
}

/** 平台级全库初始化（body.confirmToken 须为后端约定常量） */
export function initFullDatabase(confirmToken) {
  return request({
    url: '/material/system/customer/initFullDatabase',
    method: 'post',
    data: { confirmToken }
  })
}

/** 按租户物理删除耗材侧数据（body.confirm 须为 PURGE_HC） */
export function purgeConsumablesData(customerId) {
  return request({
    url: '/material/system/customer/' + customerId + '/purgeConsumablesData',
    method: 'post',
    data: { confirm: 'PURGE_HC' }
  })
}
