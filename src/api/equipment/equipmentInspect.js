import request from '@/utils/request'

// 查询设备巡检列表
export function listEquipmentInspect(query) {
  return request({
    url: '/equipment/inspect/list',
    method: 'get',
    params: query
  })
}

// 查询设备巡检详细
export function getEquipmentInspect(inspectId) {
  return request({
    url: '/equipment/inspect/' + inspectId,
    method: 'get'
  })
}

// 新增设备巡检
export function addEquipmentInspect(data) {
  return request({
    url: '/equipment/inspect',
    method: 'post',
    data: data
  })
}

// 修改设备巡检
export function updateEquipmentInspect(data) {
  return request({
    url: '/equipment/inspect',
    method: 'put',
    data: data
  })
}

// 删除设备巡检
export function delEquipmentInspect(inspectId) {
  return request({
    url: '/equipment/inspect/' + inspectId,
    method: 'delete'
  })
}

// 导出设备巡检
export function exportEquipmentInspect(query) {
  return request({
    url: '/equipment/inspect/export',
    method: 'get',
    params: query
  })
} 