import request from '@/utils/request'

// 查询设备盘点列表
export function listEquipmentCheck(query) {
  return request({
    url: '/equipment/check/list',
    method: 'get',
    params: query
  })
}

// 查询设备盘点详细
export function getEquipmentCheck(checkId) {
  return request({
    url: '/equipment/check/' + checkId,
    method: 'get'
  })
}

// 新增设备盘点
export function addEquipmentCheck(data) {
  return request({
    url: '/equipment/check',
    method: 'post',
    data: data
  })
}

// 修改设备盘点
export function updateEquipmentCheck(data) {
  return request({
    url: '/equipment/check',
    method: 'put',
    data: data
  })
}

// 删除设备盘点
export function delEquipmentCheck(checkId) {
  return request({
    url: '/equipment/check/' + checkId,
    method: 'delete'
  })
}

// 导出设备盘点
export function exportEquipmentCheck(query) {
  return request({
    url: '/equipment/check/export',
    method: 'get',
    params: query
  })
} 