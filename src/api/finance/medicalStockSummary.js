import request from '@/utils/request'

export function listMedicalInboundSummary(query) {
  return request({
    url: '/finance/medicalStockSummary/inbound/list',
    method: 'get',
    params: query
  })
}

export function listMedicalOutboundSummary(query) {
  return request({
    url: '/finance/medicalStockSummary/outbound/list',
    method: 'get',
    params: query
  })
}

export function exportMedicalInboundSummary(query) {
  return request({
    url: '/finance/medicalStockSummary/inbound/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}

export function exportMedicalOutboundSummary(query) {
  return request({
    url: '/finance/medicalStockSummary/outbound/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}
