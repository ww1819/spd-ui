import request from '@/utils/request'

// 查询高值退货列表
export function listGoods(query) {
  return request({
    url: '/gz/goods/list',
    method: 'get',
    params: query
  })
}

// 查询高值退货详细
export function getGoods(id) {
  return request({
    url: '/gz/goods/' + id,
    method: 'get'
  })
}

// 新增高值退货
export function addGoods(data) {
  return request({
    url: '/gz/goods',
    method: 'post',
    data: data
  })
}

// 修改高值退货
export function updateGoods(data) {
  return request({
    url: '/gz/goods',
    method: 'put',
    data: data
  })
}

// 删除高值退货
export function delGoods(id) {
  return request({
    url: '/gz/goods/' + id,
    method: 'delete'
  })
}

// 审核高值退货
export function auditGoods(data) {
  return request({
    url: '/gz/goods/auditGoods',
    method: 'put',
    data: data
  })
}
