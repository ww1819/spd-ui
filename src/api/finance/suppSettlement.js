import request from '@/utils/request'

export function listSuppSettlement(query) {
  return request({
    url: '/finance/suppSettlement/list',
    method: 'get',
    params: query
  })
}

export function getSuppSettlement(id) {
  return request({
    url: '/finance/suppSettlement/' + id,
    method: 'get'
  })
}

export function listInvoices(suppSettlementId) {
  return request({
    url: '/finance/suppSettlement/' + suppSettlementId + '/invoices',
    method: 'get'
  })
}

export function addInvoiceLink(suppSettlementId, invoiceId) {
  return request({
    url: '/finance/suppSettlement/addInvoice',
    method: 'post',
    params: { suppSettlementId, invoiceId }
  })
}

export function removeInvoiceLink(suppSettlementId, invoiceId) {
  return request({
    url: '/finance/suppSettlement/removeInvoice',
    method: 'delete',
    params: { suppSettlementId, invoiceId }
  })
}
