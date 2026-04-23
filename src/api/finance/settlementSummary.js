import request from '@/utils/request'

export function getSettlementSummaryData(query) {
  return request({
    url: '/finance/settlementSummary/data',
    method: 'get',
    params: query,
  })
}
