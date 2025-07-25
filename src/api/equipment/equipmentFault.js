import request from '@/utils/request'

// 查询设备故障列表
export function listEquipmentFault(query) {
  return request({
    url: '/equipment/fault/list',
    method: 'get',
    params: query
  })
}

// 查询设备故障详细
export function getEquipmentFault(faultId) {
  return request({
    url: '/equipment/fault/' + faultId,
    method: 'get'
  })
}

// 新增设备故障
export function addEquipmentFault(data) {
  return request({
    url: '/equipment/fault',
    method: 'post',
    data: data
  })
}

// 修改设备故障
export function updateEquipmentFault(data) {
  return request({
    url: '/equipment/fault',
    method: 'put',
    data: data
  })
}

// 删除设备故障
export function delEquipmentFault(faultId) {
  return request({
    url: '/equipment/fault/' + faultId,
    method: 'delete'
  })
}

// 导出设备故障
export function exportEquipmentFault(query) {
  return request({
    url: '/equipment/fault/export',
    method: 'get',
    params: query
  })
} 