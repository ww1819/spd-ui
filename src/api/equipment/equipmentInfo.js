import request from '@/utils/request'

// 查询设备信息列表
export function listEquipmentInfo(query) {
  return request({
    url: '/equipment/equipmentInfo/list',
    method: 'get',
    params: query
  })
}

// 查询设备信息详细
export function getEquipmentInfo(equipmentId) {
  return request({
    url: '/equipment/equipmentInfo/' + equipmentId,
    method: 'get'
  })
}

// 新增设备信息
export function addEquipmentInfo(data) {
  return request({
    url: '/equipment/equipmentInfo',
    method: 'post',
    data: data
  })
}

// 修改设备信息
export function updateEquipmentInfo(data) {
  return request({
    url: '/equipment/equipmentInfo',
    method: 'put',
    data: data
  })
}

// 删除设备信息
export function delEquipmentInfo(equipmentId) {
  return request({
    url: '/equipment/equipmentInfo/' + equipmentId,
    method: 'delete'
  })
}

// 导出设备信息
export function exportEquipmentInfo(query) {
  return request({
    url: '/equipment/equipmentInfo/export',
    method: 'get',
    params: query
  })
}

// 查询设备分类列表
export function listCategory(query) {
  return request({
    url: '/equipment/category/list',
    method: 'get',
    params: query
  })
} 