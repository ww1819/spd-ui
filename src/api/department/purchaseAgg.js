import request from '@/utils/request'

/** 汇总申购明细数量（首页今日统计等） */
export function sumPurchaseAggEntryQty(query) {
  return request({
    url: '/department/purchaseAgg/stats/todayEntryQtySum',
    method: 'get',
    params: query,
    headers: { hideError: true }
  })
}

export function listPurchaseAgg(query) {
  return request({
    url: '/department/purchaseAgg/list',
    method: 'get',
    params: query
  })
}

export function getPurchaseAgg(id) {
  return request({
    url: '/department/purchaseAgg/' + id,
    method: 'get'
  })
}

export function addPurchaseAgg(data, config = {}) {
  return request({
    url: '/department/purchaseAgg',
    method: 'post',
    data: data,
    ...config
  })
}

export function updatePurchaseAgg(data, config = {}) {
  return request({
    url: '/department/purchaseAgg',
    method: 'put',
    data: data,
    ...config
  })
}

export function delPurchaseAgg(id) {
  const ids = Array.isArray(id) ? id.join(',') : id
  return request({
    url: '/department/purchaseAgg/' + ids,
    method: 'delete'
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
