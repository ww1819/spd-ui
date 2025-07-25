import request from '@/utils/request'

// 查询设备检验列表
export function listEquipmentInspection(query) {
  return request({
    url: '/equipment/inspection/list',
    method: 'get',
    params: query
  })
}

// 查询设备检验详细
export function getEquipmentInspection(inspectionId) {
  return request({
    url: '/equipment/inspection/' + inspectionId,
    method: 'get'
  })
}

// 新增设备检验
export function addEquipmentInspection(data) {
  return request({
    url: '/equipment/inspection',
    method: 'post',
    data: data
  })
}

// 修改设备检验
export function updateEquipmentInspection(data) {
  return request({
    url: '/equipment/inspection',
    method: 'put',
    data: data
  })
}

// 删除设备检验
export function delEquipmentInspection(inspectionId) {
  return request({
    url: '/equipment/inspection/' + inspectionId,
    method: 'delete'
  })
}

// 导出设备检验
export function exportEquipmentInspection(query) {
  return request({
    url: '/equipment/inspection/export',
    method: 'get',
    params: query
  })
} 