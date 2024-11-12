import request from '@/utils/request'

// 查询库存明细列表
export function listInventory(query) {
  return request({
    url: '/warehouse/inventory/list',
    method: 'get',
    params: query
  })
}

// 查询库存明细汇总列表
export function listInventorySummary(query) {
  return request({
    url: '/warehouse/inventory/listInventorySummary',
    method: 'get',
    params: query
  })
}

// 查询库存明细详细
export function getInventory(id) {
  return request({
    url: '/warehouse/inventory/' + id,
    method: 'get'
  })
}

// 按仓库筛选实时库存耗材
export function listInventoryMaterialAll(query) {
  return request({
    url: '/warehouse/inventory/listInventoryMaterialAll',
    method: 'get',
    params: query
  })
}

// 新增库存明细
export function addInventory(data) {
  return request({
    url: '/warehouse/inventory',
    method: 'post',
    data: data
  })
}

// 修改库存明细
export function updateInventory(data) {
  return request({
    url: '/warehouse/inventory',
    method: 'put',
    data: data
  })
}

// 删除库存明细
export function delInventory(id) {
  return request({
    url: '/warehouse/inventory/' + id,
    method: 'delete'
  })
}


// 盘点过滤库存明细列表
export function listPDFilter(query) {
  return request({
    url: '/warehouse/inventory/listPDFilter',
    method: 'get',
    params: query
  })
}
