import request from '@/utils/request'

export function listMenusByCustomerId(customerIdOrTenantId) {
  const tenantId = customerIdOrTenantId != null ? String(customerIdOrTenantId) : ''
  return request({
    url: '/material/system/customerMenuManage/list',
    method: 'get',
    params: { tenantId }
  })
}

export function changeMenuStatus(data) {
  return request({
    url: '/material/system/customerMenuManage/changeStatus',
    method: 'put',
    data: data
  })
}

export function getMenuStatusLogs(tenantId, menuId) {
  return request({
    url: '/material/system/customerMenuManage/statusLog',
    method: 'get',
    params: { tenantId, menuId }
  })
}

export function getMenuPeriodLogs(tenantId, menuId) {
  return request({
    url: '/material/system/customerMenuManage/periodLog',
    method: 'get',
    params: { tenantId, menuId }
  })
}
