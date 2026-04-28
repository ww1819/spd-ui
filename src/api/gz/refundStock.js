import request from '@/utils/request'

// 查询高值备货退库列表
export function listGoods(query) {
  return request({
    url: '/gz/refundStock/list',
    method: 'get',
    params: query
  })
}

// 查询高值备货退库详细
export function getGoods(id) {
  return request({
    url: '/gz/refundStock/' + id,
    method: 'get'
  })
}

// 新增高值备货退库
export function addGoods(data) {
  return request({
    url: '/gz/refundStock',
    method: 'post',
    data: data
  })
}

// 修改高值备货退库
export function updateGoods(data) {
  return request({
    url: '/gz/refundStock',
    method: 'put',
    data: data
  })
}

// 删除高值备货退库
export function delGoods(id) {
  return request({
    url: '/gz/refundStock/' + id,
    method: 'delete'
  })
}

// 审核高值备货退库
export function auditGoods(data) {
  return request({
    url: '/gz/refundStock/auditStock',
    method: 'put',
    data: data
  })
}

