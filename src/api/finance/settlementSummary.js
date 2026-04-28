import request from '@/utils/request'

export function getSettlementSummaryData(query) {
  return request({
    url: '/finance/settlementSummary/data',
    method: 'get',
    params: query
  })
}

/** 财务结算汇总筛选：仓库下拉（仅需登录） */
export function fetchFinancePickWarehouses() {
  return request({
    url: '/finance/settlementSummary/pick/warehouses',
    method: 'get',
    headers: { hideError: true }
  })
}

/** 财务结算汇总筛选：科室下拉（仅需登录） */
export function fetchFinancePickDepartments() {
  return request({
    url: '/finance/settlementSummary/pick/departments',
    method: 'get',
    headers: { hideError: true }
  })
}

/** 财务结算汇总筛选：按 id 取供应商简要（仅需登录） */
export function fetchFinancePickSupplierById(id) {
  return request({
    url: '/finance/settlementSummary/pick/supplier/' + id,
    method: 'get',
    headers: { hideError: true }
  })
}
