import request from '@/utils/request'

// 查询库房分类列表
export function listWarehouseCategory(query) {
  return request({
    url: '/foundation/warehouseCategory/list',
    method: 'get',
    params: query
  })
}

// 查询库房分类列表
export function listWarehouseCategoryAll(query) {
  return request({
    url: '/foundation/warehouseCategory/listAll',
    method: 'get',
    params: query
  })
}

// 查询库房分类详细
export function getWarehouseCategory(warehouseCategoryId) {
  return request({
    url: '/foundation/warehouseCategory/' + warehouseCategoryId,
    method: 'get'
  })
}

// 新增库房分类
export function addWarehouseCategory(data) {
  return request({
    url: '/foundation/warehouseCategory',
    method: 'post',
    data: data
  })
}

// 修改库房分类
export function updateWarehouseCategory(data) {
  return request({
    url: '/foundation/warehouseCategory',
    method: 'put',
    data: data
  })
}

// 删除库房分类
export function delWarehouseCategory(warehouseCategoryId) {
  return request({
    url: '/foundation/warehouseCategory/' + warehouseCategoryId,
    method: 'delete'
  })
}
