import request from '@/utils/request'

// 查询高值入库列表
export function listOrder(query) {
  return request({
    url: '/gz/order/list',
    method: 'get',
    params: query
  })
}

// 查询高值入库详细
export function getOrder(id) {
  return request({
    url: '/gz/order/' + id,
    method: 'get'
  })
}

// 新增高值入库
export function addOrder(data) {
  return request({
    url: '/gz/order',
    method: 'post',
    data: data
  })
}

// 修改高值入库
export function updateOrder(data) {
  return request({
    url: '/gz/order',
    method: 'put',
    data: data
  })
}

// 删除高值入库
export function delOrder(id) {
  return request({
    url: '/gz/order/' + id,
    method: 'delete'
  })
}

// 审核高值入库
export function auditOrder(data) {
  return request({
    url: '/gz/order/auditOrder',
    method: 'put',
    data: data
  })
}
