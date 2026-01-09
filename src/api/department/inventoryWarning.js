import request from '@/utils/request'

// 查询科室库存预警设置列表
export function listInventoryWarning(query) {
  return request({
    url: '/department/inventoryWarning/list',
    method: 'get',
    params: query
  })
}

// 查询科室库存预警设置详细
export function getInventoryWarning(id) {
  return request({
    url: '/department/inventoryWarning/' + id,
    method: 'get'
  })
}

// 新增科室库存预警设置
export function addInventoryWarning(data) {
  return request({
    url: '/department/inventoryWarning',
    method: 'post',
    data: data
  })
}

// 修改科室库存预警设置
export function updateInventoryWarning(data) {
  return request({
    url: '/department/inventoryWarning',
    method: 'put',
    data: data
  })
}

// 删除科室库存预警设置
export function delInventoryWarning(id) {
  return request({
    url: '/department/inventoryWarning/' + id,
    method: 'delete'
  })
}

