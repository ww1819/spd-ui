import request from '@/utils/request'

// 查询申购单列表（支持全部、未审核、已审核）
export function listPurchaseAudit(query) {
  return request({
    url: '/department/purchase/list',
    method: 'get',
    params: query
  })
}

// 查询申购单详情
export function getPurchaseAudit(id) {
  return request({
    url: '/department/purchase/' + id,
    method: 'get'
  })
}

// 审核通过
export function auditPurchase(data) {
  return request({
    url: '/department/purchase/auditApply',
    method: 'put',
    data: data
  })
}

// 审核驳回
export function rejectPurchase(data) {
  return request({
    url: '/department/purchase/reject',
    method: 'put',
    data: data
  })
}
