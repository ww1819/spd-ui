import request from '@/utils/request'

// 查询设备保养列表
export function listEquipmentMaintain(query) {
  return request({
    url: '/equipment/maintain/list',
    method: 'get',
    params: query
  })
}

// 查询设备保养详细
export function getEquipmentMaintain(maintainId) {
  return request({
    url: '/equipment/maintain/' + maintainId,
    method: 'get'
  })
}

// 新增设备保养
export function addEquipmentMaintain(data) {
  return request({
    url: '/equipment/maintain',
    method: 'post',
    data: data
  })
}

// 修改设备保养
export function updateEquipmentMaintain(data) {
  return request({
    url: '/equipment/maintain',
    method: 'put',
    data: data
  })
}

// 删除设备保养
export function delEquipmentMaintain(maintainId) {
  return request({
    url: '/equipment/maintain/' + maintainId,
    method: 'delete'
  })
}

// 导出设备保养
export function exportEquipmentMaintain(query) {
  return request({
    url: '/equipment/maintain/export',
    method: 'get',
    params: query
  })
} 