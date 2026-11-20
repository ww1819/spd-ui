import request from '@/utils/request'

/** 备货出/退库表明细分页 */
export function listOutboundRefundEntries(query) {
  return request({
    url: '/gz/stockQuery/outboundRefund/entry/list',
    method: 'get',
    params: query
  })
}

/** 备货入/退货表明细分页 */
export function listInboundRefundEntries(query) {
  return request({
    url: '/gz/stockQuery/inboundRefund/entry/list',
    method: 'get',
    params: query
  })
}

/** 跟台表明细分页 */
export function listFollowEntries(query) {
  return request({
    url: '/gz/stockQuery/follow/entry/list',
    method: 'get',
    params: query
  })
}

/** 按院内码追溯备货库存变动（出/退库表无匹配时的提示） */
export function traceDepotInventory(inHospitalCode) {
  return request({
    url: '/gz/stockQuery/depotInventory/trace',
    method: 'get',
    params: { inHospitalCode }
  })
}
