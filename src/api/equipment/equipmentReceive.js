import request from '@/utils/request'

// 查询设备领用列表
export function listEquipmentReceive(query) {
  return request({
    url: '/equipment/receive/list',
    method: 'get',
    params: query
  })
}

// 查询设备领用详细
export function getEquipmentReceive(receiveId) {
  return request({
    url: '/equipment/receive/' + receiveId,
    method: 'get'
  })
}

// 新增设备领用
export function addEquipmentReceive(data) {
  return request({
    url: '/equipment/receive',
    method: 'post',
    data: data
  })
}

// 修改设备领用
export function updateEquipmentReceive(data) {
  return request({
    url: '/equipment/receive',
    method: 'put',
    data: data
  })
}

// 删除设备领用
export function delEquipmentReceive(receiveId) {
  return request({
    url: '/equipment/receive/' + receiveId,
    method: 'delete'
  })
}

// 导出设备领用
export function exportEquipmentReceive(query) {
  return request({
    url: '/equipment/receive/export',
    method: 'get',
    params: query
  })
} 