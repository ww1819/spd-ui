import request from '@/utils/request'

export function listWhSettlement(query) {
  return request({
    url: '/finance/whSettlement/list',
    method: 'get',
    params: query
  })
}

export function getWhSettlement(id) {
  return request({
    url: '/finance/whSettlement/' + id,
    method: 'get'
  })
}

export function addWhSettlement(data) {
  return request({
    url: '/finance/whSettlement',
    method: 'post',
    data: data
  })
}

export function updateWhSettlement(data) {
  return request({
    url: '/finance/whSettlement',
    method: 'put',
    data: data
  })
}

export function delWhSettlement(id) {
  return request({
    url: '/finance/whSettlement/' + id,
    method: 'delete'
  })
}

export function extractData(params) {
  return request({
    url: '/finance/whSettlement/extractData',
    method: 'get',
    params: params
  })
}

export function saveEntries(billId, entries) {
  return request({
    url: '/finance/whSettlement/saveEntries',
    method: 'post',
    params: { billId },
    data: entries || []
  })
}

export function removeEntries(billId, entryIds) {
  return request({
    url: '/finance/whSettlement/removeEntries',
    method: 'delete',
    params: { billId },
    data: entryIds || []
  })
}

export function auditWhSettlement(id) {
  return request({
    url: '/finance/whSettlement/audit/' + id,
    method: 'put'
  })
}
