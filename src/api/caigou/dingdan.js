import request from '@/utils/request'

// 查询采购订单列表
export function listDingdan(query) {
  return request({
    url: '/caigou/dingdan/list',
    method: 'get',
    params: query
  })
}

// 查询采购订单详细
export function getDingdan(id) {
  return request({
    url: '/caigou/dingdan/' + id,
    method: 'get'
  })
}

// 新增采购订单
export function addDingdan(data) {
  return request({
    url: '/caigou/dingdan',
    method: 'post',
    data: data
  })
}

// 修改采购订单
export function updateDingdan(data) {
  return request({
    url: '/caigou/dingdan',
    method: 'put',
    data: data
  })
}

// 删除采购订单
export function delDingdan(ids) {
  return request({
    url: '/caigou/dingdan/' + ids,
    method: 'delete'
  })
}

// 审核采购订单
export function auditDingdan(data) {
  return request({
    url: '/caigou/dingdan/audit',
    method: 'put',
    data: data
  })
}
