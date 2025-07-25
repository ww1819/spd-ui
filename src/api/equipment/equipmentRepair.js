import request from '@/utils/request'

// 查询设备维修列表
export function listEquipmentRepair(query) {
  return request({
    url: '/equipment/repair/list',
    method: 'get',
    params: query
  })
}

// 查询设备维修详细
export function getEquipmentRepair(repairId) {
  return request({
    url: '/equipment/repair/' + repairId,
    method: 'get'
  })
}

// 新增设备维修
export function addEquipmentRepair(data) {
  return request({
    url: '/equipment/repair',
    method: 'post',
    data: data
  })
}

// 修改设备维修
export function updateEquipmentRepair(data) {
  return request({
    url: '/equipment/repair',
    method: 'put',
    data: data
  })
}

// 删除设备维修
export function delEquipmentRepair(repairId) {
  return request({
    url: '/equipment/repair/' + repairId,
    method: 'delete'
  })
}

// 导出设备维修
export function exportEquipmentRepair(query) {
  return request({
    url: '/equipment/repair/export',
    method: 'get',
    params: query
  })
} 