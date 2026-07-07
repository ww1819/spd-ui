import request from '@/utils/request'

/** 备货出/退库明细（按院内码等条件直接查明细行） */
export function listStockOutboundRefundEntries(query) {
  return request({
    url: '/gz/stockQuery/outboundRefund/entry/list',
    method: 'get',
    params: query
  })
}

/** 备货仓库院内码扣减追溯（流水+出库/退货单） */
export function traceDepotInventory(inHospitalCode) {
  return request({
    url: '/gz/stockQuery/depotInventory/trace',
    method: 'get',
    params: { inHospitalCode }
  })
}
