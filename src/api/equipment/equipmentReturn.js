import request from '@/utils/request'

// 查询设备退货列表
export function listEquipmentReturn(query) {
  return request({
    url: '/equipment/return/list',
    method: 'get',
    params: query
  })
}

// 查询设备退货详细
export function getEquipmentReturn(returnId) {
  return request({
    url: '/equipment/return/' + returnId,
    method: 'get'
  })
}

// 新增设备退货
export function addEquipmentReturn(data) {
  return request({
    url: '/equipment/return',
    method: 'post',
    data: data
  })
}

// 修改设备退货
export function updateEquipmentReturn(data) {
  return request({
    url: '/equipment/return',
    method: 'put',
    data: data
  })
}

// 删除设备退货
export function delEquipmentReturn(returnId) {
  return request({
    url: '/equipment/return/' + returnId,
    method: 'delete'
  })
}

// 导出设备退货
export function exportEquipmentReturn(query) {
  return request({
    url: '/equipment/return/export',
    method: 'get',
    params: query
  })
}

// 审核设备退货
export function auditEquipmentReturn(returnId) {
  return request({
    url: '/equipment/return/audit/' + returnId,
    method: 'put'
  })
}
