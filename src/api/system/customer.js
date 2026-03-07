import request from '@/utils/request'

export function getTenantEnumList() {
  return request({
    url: '/equipment/system/customer/tenantEnumList',
    method: 'get'
  })
}

export function listCustomer(query) {
  return request({
    url: '/equipment/system/customer/list',
    method: 'get',
    params: query
  })
}

export function getCustomer(customerId) {
  return request({
    url: '/equipment/system/customer/' + customerId,
    method: 'get'
  })
}

export function addCustomer(data) {
  return request({
    url: '/equipment/system/customer',
    method: 'post',
    data: data
  })
}

export function updateCustomer(data) {
  return request({
    url: '/equipment/system/customer',
    method: 'put',
    data: data
  })
}

export function delCustomer(customerId) {
  return request({
    url: '/equipment/system/customer/' + customerId,
    method: 'delete'
  })
}

export function changeCustomerStatus(data) {
  return request({
    url: '/equipment/system/customer/changeStatus',
    method: 'put',
    data: data
  })
}

export function getCustomerMenuIds(customerId) {
  return request({
    url: '/equipment/system/customer/menuIds/' + customerId,
    method: 'get'
  })
}

export function saveCustomerMenus(customerId, menuIds) {
  return request({
    url: '/equipment/system/customer/menu',
    method: 'put',
    params: { customerId },
    data: { menuIds: Array.isArray(menuIds) ? menuIds : [] }
  })
}
