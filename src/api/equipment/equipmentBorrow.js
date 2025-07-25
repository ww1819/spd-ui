import request from '@/utils/request'

// 查询设备借用列表
export function listEquipmentBorrow(query) {
  return request({
    url: '/equipment/borrow/list',
    method: 'get',
    params: query
  })
}

// 查询设备借用详细
export function getEquipmentBorrow(borrowId) {
  return request({
    url: '/equipment/borrow/' + borrowId,
    method: 'get'
  })
}

// 新增设备借用
export function addEquipmentBorrow(data) {
  return request({
    url: '/equipment/borrow',
    method: 'post',
    data: data
  })
}

// 修改设备借用
export function updateEquipmentBorrow(data) {
  return request({
    url: '/equipment/borrow',
    method: 'put',
    data: data
  })
}

// 删除设备借用
export function delEquipmentBorrow(borrowId) {
  return request({
    url: '/equipment/borrow/' + borrowId,
    method: 'delete'
  })
}

// 导出设备借用
export function exportEquipmentBorrow(query) {
  return request({
    url: '/equipment/borrow/export',
    method: 'get',
    params: query
  })
} 