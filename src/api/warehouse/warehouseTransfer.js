import request from '@/utils/request'

// 查询调拨申请列表
export function listWarehouseTransfer(query) {
  return request({
    url: '/warehouse/warehouseTransfer/list',
    method: 'get',
    params: query
  })
}

// 查询调拨申请详细
export function getWarehouseTransfer(id) {
  return request({
    url: '/warehouse/warehouseTransfer/' + id,
    method: 'get'
  })
}

// 新增调拨申请
export function addWarehouseTransfer(data) {
  return request({
    url: '/warehouse/warehouseTransfer',
    method: 'post',
    data: data
  })
}

// 修改调拨申请
export function updateWarehouseTransfer(data) {
  return request({
    url: '/warehouse/warehouseTransfer',
    method: 'put',
    data: data
  })
}

// 删除调拨申请
export function delWarehouseTransfer(id) {
  return request({
    url: '/warehouse/warehouseTransfer/' + id,
    method: 'delete'
  })
}

// 审核调拨申请
export function auditWarehouseTransfer(data) {
  return request({
    url: '/warehouse/warehouseTransfer/auditTransfer',
    method: 'put',
    data: data
  })
}

