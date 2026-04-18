import request from '@/utils/request'

export function listHisExternalDb(query) {
  return request({
    url: '/his/externalDb/list',
    method: 'get',
    params: query
  })
}

export function getHisExternalDb(tenantId) {
  return request({
    url: '/his/externalDb/' + encodeURIComponent(tenantId),
    method: 'get'
  })
}

export function addHisExternalDb(data) {
  return request({
    url: '/his/externalDb',
    method: 'post',
    data: data
  })
}

export function updateHisExternalDb(data) {
  return request({
    url: '/his/externalDb',
    method: 'put',
    data: data
  })
}

export function delHisExternalDb(tenantId) {
  return request({
    url: '/his/externalDb/' + encodeURIComponent(tenantId),
    method: 'delete'
  })
}
