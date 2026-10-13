import request from '@/utils/request'

export function listScrapBill(query) {
  return request({
    url: '/warehouse/scrap/list',
    method: 'get',
    params: query
  })
}

export function getScrapBill(id) {
  return request({
    url: '/warehouse/scrap/' + id,
    method: 'get'
  })
}

export function addScrapBill(data) {
  return request({
    url: '/warehouse/scrap',
    method: 'post',
    data: data
  })
}

export function updateScrapBill(data) {
  return request({
    url: '/warehouse/scrap',
    method: 'put',
    data: data
  })
}

export function submitScrapBill(ids) {
  return request({
    url: '/warehouse/scrap/submit',
    method: 'post',
    data: { ids: Array.isArray(ids) ? ids : [ids] }
  })
}

export function auditScrapBill(ids) {
  return request({
    url: '/warehouse/scrap/audit',
    method: 'post',
    data: { ids: Array.isArray(ids) ? ids : [ids] }
  })
}

export function listScrapDetailQuery(query) {
  return request({
    url: '/warehouse/scrap/query/detail',
    method: 'get',
    params: query
  })
}

export function listScrapSummaryQuery(query) {
  return request({
    url: '/warehouse/scrap/query/summary',
    method: 'get',
    params: query
  })
}

export function delScrapBill(ids) {
  return request({
    url: '/warehouse/scrap/' + ids,
    method: 'delete'
  })
}
