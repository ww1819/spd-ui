import request from '@/utils/request'

// 查询设备字典列表
export function listEquipmentDict(query) {
  return request({
    url: '/foundation/equipmentDict/list',
    method: 'get',
    params: query
  })
}

// 查询所有设备字典列表
export function listEquipmentDictAll(query) {
  return request({
    url: '/foundation/equipmentDict/listAll',
    method: 'get',
    params: query
  })
}

// 查询设备字典详细
export function getEquipmentDict(id) {
  return request({
    url: '/foundation/equipmentDict/' + id,
    method: 'get'
  })
}

// 新增设备字典
export function addEquipmentDict(data) {
  return request({
    url: '/foundation/equipmentDict',
    method: 'post',
    data: data
  })
}

// 修改设备字典
export function updateEquipmentDict(data) {
  return request({
    url: '/foundation/equipmentDict',
    method: 'put',
    data: data
  })
}

// 删除设备字典
export function delEquipmentDict(id) {
  return request({
    url: '/foundation/equipmentDict/' + id,
    method: 'delete'
  })
}

// 导出设备字典
export function exportEquipmentDict(query) {
  return request({
    url: '/foundation/equipmentDict/export',
    method: 'post',
    params: query
  })
}

