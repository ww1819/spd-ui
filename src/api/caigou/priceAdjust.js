import request from '@/utils/request'

export function listPriceAdjust(query) {
  return request({
    url: '/caigou/priceAdjust/list',
    method: 'get',
    params: query
  })
}

export function getPriceAdjust(id) {
  return request({
    url: '/caigou/priceAdjust/' + id,
    method: 'get'
  })
}

export function addPriceAdjust(data) {
  return request({
    url: '/caigou/priceAdjust',
    method: 'post',
    data: data
  })
}

export function updatePriceAdjust(data) {
  return request({
    url: '/caigou/priceAdjust',
    method: 'put',
    data: data
  })
}

export function submitPriceAdjust(ids) {
  return request({
    url: '/caigou/priceAdjust/submit',
    method: 'put',
    data: { ids: Array.isArray(ids) ? ids : [ids] }
  })
}

export function auditPriceAdjust(ids) {
  return request({
    url: '/caigou/priceAdjust/audit',
    method: 'put',
    data: { ids: Array.isArray(ids) ? ids : [ids] }
  })
}

export function delPriceAdjust(ids) {
  return request({
    url: '/caigou/priceAdjust/' + ids,
    method: 'delete'
  })
}
