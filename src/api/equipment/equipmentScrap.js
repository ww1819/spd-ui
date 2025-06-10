import request from '@/utils/request'

// 查询设备报废列表
export function listEquipmentScrap(query) {
  return request({
    url: '/equipment/equipmentScrap/list',
    method: 'get',
    params: query
  })
}

// 查询设备报废详细
export function getEquipmentScrap(scrapId) {
  return request({
    url: '/equipment/equipmentScrap/' + scrapId,
    method: 'get'
  })
}

// 新增设备报废
export function addEquipmentScrap(data) {
  return request({
    url: '/equipment/equipmentScrap',
    method: 'post',
    data: data
  })
}

// 修改设备报废
export function updateEquipmentScrap(data) {
  return request({
    url: '/equipment/equipmentScrap',
    method: 'put',
    data: data
  })
}

// 删除设备报废
export function delEquipmentScrap(scrapId) {
  return request({
    url: '/equipment/equipmentScrap/' + scrapId,
    method: 'delete'
  })
}

// 导出设备报废
export function exportEquipmentScrap(query) {
  return request({
    url: '/equipment/equipmentScrap/export',
    method: 'get',
    params: query
  })
}

// 查询设备信息列表
export function listEquipmentInfo(query) {
  return request({
    url: '/equipment/equipmentInfo/list',
    method: 'get',
    params: query
  })
} 