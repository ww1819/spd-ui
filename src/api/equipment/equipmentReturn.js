import request from '@/utils/request'

// 查询设备归还列表
export function listEquipmentReturn(query) {
  return request({
    url: '/equipment/return/list',
    method: 'get',
    params: query
  })
}

// 查询设备归还详细
export function getEquipmentReturn(returnId) {
  return request({
    url: '/equipment/return/' + returnId,
    method: 'get'
  })
}

// 新增设备归还
export function addEquipmentReturn(data) {
  return request({
    url: '/equipment/return',
    method: 'post',
    data: data
  })
}

// 修改设备归还
export function updateEquipmentReturn(data) {
  return request({
    url: '/equipment/return',
    method: 'put',
    data: data
  })
}

// 删除设备归还
export function delEquipmentReturn(returnId) {
  return request({
    url: '/equipment/return/' + returnId,
    method: 'delete'
  })
}

// 导出设备归还
export function exportEquipmentReturn(query) {
  return request({
    url: '/equipment/return/export',
    method: 'get',
    params: query
  })
} 