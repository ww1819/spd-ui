import request from '@/utils/request'

// 查询设备维护列表
export function listEquipmentMaintenance(query) {
  return request({
    url: '/equipment/maintenance/list',
    method: 'get',
    params: query
  })
}

// 查询设备维护详细
export function getEquipmentMaintenance(maintenanceId) {
  return request({
    url: '/equipment/maintenance/' + maintenanceId,
    method: 'get'
  })
}

// 新增设备维护
export function addEquipmentMaintenance(data) {
  return request({
    url: '/equipment/maintenance',
    method: 'post',
    data: data
  })
}

// 修改设备维护
export function updateEquipmentMaintenance(data) {
  return request({
    url: '/equipment/maintenance',
    method: 'put',
    data: data
  })
}

// 删除设备维护
export function delEquipmentMaintenance(maintenanceId) {
  return request({
    url: '/equipment/maintenance/' + maintenanceId,
    method: 'delete'
  })
}

// 导出设备维护
export function exportEquipmentMaintenance(query) {
  return request({
    url: '/equipment/maintenance/export',
    method: 'get',
    params: query
  })
} 