import request from '@/utils/request'

// 查询入库列表
export function listWarehouse(query) {
  return request({
    url: '/warehouse/warehouse/list',
    method: 'get',
    params: query
  })
}

// 查询入库详细
export function getInWarehouse(id) {
  return request({
    url: '/warehouse/warehouse/' + id,
    method: 'get'
  })
}



// 新增入库
export function addWarehouse(data) {
  return request({
    url: '/warehouse/warehouse',
    method: 'post',
    data: data
  })
}

// 修改入库
export function updateWarehouse(data) {
  return request({
    url: '/warehouse/warehouse',
    method: 'put',
    data: data
  })
}

// 删除入库
export function delWarehouse(id) {
  return request({
    url: '/warehouse/warehouse/' + id,
    method: 'delete'
  })
}

// 审核入库
export function auditWarehouse(data) {
  return request({
    url: '/warehouse/warehouse/auditWarehouse',
    method: 'put',
    data: data
  })
}

// 查询入退货明细列表
export function listRTHWarehouse(query) {
  return request({
    url: '/warehouse/rthWarehouse/RTHList',
    method: 'get',
    params: query
  })
}

// 查询入退货汇总列表
export function listRTHSummary(query) {
  return request({
    url: '/warehouse/rthWarehouse/listRTHSummary',
    method: 'get',
    params: query
  })
}



