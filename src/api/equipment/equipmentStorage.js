import request from '@/utils/request'

// 查询设备入库列表
export function listEquipmentStorage(query) {
  return request({
    url: '/equipment/storage/list',
    method: 'get',
    params: query
  })
}

// 查询设备入库详细
export function getEquipmentStorage(storageId) {
  return request({
    url: '/equipment/storage/' + storageId,
    method: 'get'
  })
}

// 新增设备入库
export function addEquipmentStorage(data) {
  return request({
    url: '/equipment/storage',
    method: 'post',
    data: data
  })
}

// 修改设备入库
export function updateEquipmentStorage(data) {
  return request({
    url: '/equipment/storage',
    method: 'put',
    data: data
  })
}

// 删除设备入库
export function delEquipmentStorage(storageId) {
  return request({
    url: '/equipment/storage/' + storageId,
    method: 'delete'
  })
}

// 导出设备入库
export function exportEquipmentStorage(query) {
  return request({
    url: '/equipment/storage/export',
    method: 'get',
    params: query
  })
}

// 审核设备入库
export function auditEquipmentStorage(storageId) {
  return request({
    url: '/equipment/storage/audit/' + storageId,
    method: 'put'
  })
} 