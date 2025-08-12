import request from '@/utils/request'

// 查询设备信息管理列表
export function listEquipment(query) {
  return request({
    url: '/equipment/info/list',
    method: 'get',
    params: query
  })
}

// 查询设备信息管理详细
export function getEquipment(id) {
  return request({
    url: '/equipment/info/' + id,
    method: 'get'
  })
}

// 根据资产编号查询设备信息
export function getEquipmentByAssetCode(assetCode) {
  return request({
    url: '/equipment/info/assetCode/' + assetCode,
    method: 'get'
  })
}

// 新增设备信息管理
export function addEquipment(data) {
  return request({
    url: '/equipment/info',
    method: 'post',
    data: data
  })
}

// 修改设备信息管理
export function updateEquipment(data) {
  return request({
    url: '/equipment/info',
    method: 'put',
    data: data
  })
}

// 删除设备信息管理
export function delEquipment(id) {
  return request({
    url: '/equipment/info/' + id,
    method: 'delete'
  })
}

// 导出设备信息管理
export function exportEquipment(query) {
  return request({
    url: '/equipment/info/export',
    method: 'post',
    data: query
  })
}

// 查询设备信息统计
export function getEquipmentStatistics(query) {
  return request({
    url: '/equipment/info/statistics',
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