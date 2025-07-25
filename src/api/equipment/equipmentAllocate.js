import request from '@/utils/request'

// 查询设备分配列表
export function listEquipmentAllocate(query) {
  return request({
    url: '/equipment/allocate/list',
    method: 'get',
    params: query
  })
}

// 查询设备分配详细
export function getEquipmentAllocate(allocateId) {
  return request({
    url: '/equipment/allocate/' + allocateId,
    method: 'get'
  })
}

// 新增设备分配
export function addEquipmentAllocate(data) {
  return request({
    url: '/equipment/allocate',
    method: 'post',
    data: data
  })
}

// 修改设备分配
export function updateEquipmentAllocate(data) {
  return request({
    url: '/equipment/allocate',
    method: 'put',
    data: data
  })
}

// 删除设备分配
export function delEquipmentAllocate(allocateId) {
  return request({
    url: '/equipment/allocate/' + allocateId,
    method: 'delete'
  })
}

// 导出设备分配
export function exportEquipmentAllocate(query) {
  return request({
    url: '/equipment/allocate/export',
    method: 'get',
    params: query
  })
} 