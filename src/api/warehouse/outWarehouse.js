import request from '@/utils/request'

// 查询出库列表
export function listOutWarehouse(query) {
  return request({
    url: '/warehouse/outWarehouse/list',
    method: 'get',
    params: query
  })
}

// 查询出库详细
export function getOutWarehouse(id) {
  return request({
    url: '/warehouse/outWarehouse/' + id,
    method: 'get'
  })
}

// 新增出库
export function addOutWarehouse(data) {
  return request({
    url: '/warehouse/outWarehouse/addOutWarehouse',
    method: 'post',
    data: data
  })
}

// 修改出库
export function updateOutWarehouse(data) {
  return request({
    url: '/warehouse/outWarehouse/updateOutWarehouse',
    method: 'put',
    data: data
  })
}

// 删除出库
export function delOutWarehouse(id) {
  return request({
    url: '/warehouse/outWarehouse/' + id,
    method: 'delete'
  })
}

// 审核出库
export function auditOutWarehouse(data) {
  return request({
    url: '/warehouse/outWarehouse/auditOutWarehouse',
    method: 'put',
    data: data
  })
}

// 查询出退库列表
export function listCTKWarehouse(query) {
  return request({
    url: '/warehouse/rthWarehouse/CTKList',
    method: 'get',
    params: query
  })
}

// 查询出退库汇总列表
export function listCTKWarehouseSummary(query) {
  return request({
    url: '/warehouse/rthWarehouse/CTKListSummary',
    method: 'get',
    params: query
  })
}


export function getOutWarehouseDetailByDApply(query) {
  return request({
    url: '/warehouse/rthWarehouse/getDApplyDetail',
    method: 'get',
    params: query
  })
}
