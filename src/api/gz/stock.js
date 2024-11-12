import request from '@/utils/request'

// 查询高值退库列表
export function listStock(query) {
  return request({
    url: '/gz/stock/list',
    method: 'get',
    params: query
  })
}

// 查询高值退库详细
export function getStock(id) {
  return request({
    url: '/gz/stock/' + id,
    method: 'get'
  })
}

// 新增高值退库
export function addStock(data) {
  return request({
    url: '/gz/stock',
    method: 'post',
    data: data
  })
}

// 修改高值退库
export function updateStock(data) {
  return request({
    url: '/gz/stock',
    method: 'put',
    data: data
  })
}

// 删除高值退库
export function delStock(id) {
  return request({
    url: '/gz/stock/' + id,
    method: 'delete'
  })
}

// 审核退库
export function auditStock(data) {
  return request({
    url: '/gz/stock/auditStock',
    method: 'put',
    data: data
  })
}
