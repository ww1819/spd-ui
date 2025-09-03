import request from '@/utils/request'

// 查询科室库存列表
export function listInventory(query) {
  return request({
    url: '/department/inventory/list',
    method: 'get',
    params: query
  })
}

// 查询科室库存详细
export function getInventory(id) {
  return request({
    url: '/department/inventory/' + id,
    method: 'get'
  })
}

// 新增科室库存
export function addInventory(data) {
  return request({
    url: '/department/inventory',
    method: 'post',
    data: data
  })
}

// 修改科室库存
export function updateInventory(data) {
  return request({
    url: '/department/inventory',
    method: 'put',
    data: data
  })
}

// 删除科室库存
export function delInventory(id) {
  return request({
    url: '/department/inventory/' + id,
    method: 'delete'
  })
}

// 查询库存汇总列表
export function listInventorySummary(query) {
  return request({
    url: '/department/inventory/summary',
    method: 'get',
    params: query
  })
}

// 查询科室进销存明细列表
export function listDepartmentInOutDetail(query) {
  return request({
    url: '/department/inventory/inout',
    method: 'get',
    params: query
  })
}