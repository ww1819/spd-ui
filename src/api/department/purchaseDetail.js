import request from '@/utils/request'

/** 科室采购表明细 */
export function listPurchaseDetail(query) {
  return request({
    url: '/department/purchaseDetail/list',
    method: 'get',
    params: query
  })
}

/** 科室采购表汇总 */
export function listPurchaseSummary(query) {
  return request({
    url: '/department/purchaseDetail/summary',
    method: 'get',
    params: query
  })
}
