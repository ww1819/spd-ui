import request from '@/utils/request'

export function listPurchaseAggAudit(query) {
  return request({
    url: '/department/purchaseAgg/list',
    method: 'get',
    params: query
  })
}

export function getPurchaseAggAudit(id) {
  return request({
    url: '/department/purchaseAgg/' + id,
    method: 'get'
  })
}

export function auditPurchaseAgg(data) {
  return request({
    url: '/department/purchaseAgg/auditApply',
    method: 'put',
    data: data
  })
}

export function rejectPurchaseAgg(data) {
  return request({
    url: '/department/purchaseAgg/reject',
    method: 'put',
    data: data
  })
}
