import request from '@/utils/request'

export function listJcPeriod(query) {
  return request({
    url: '/foundation/jcPeriod/list',
    method: 'get',
    params: query
  })
}

export function listJcPeriodAll(query) {
  return request({
    url: '/foundation/jcPeriod/listAll',
    method: 'get',
    params: query
  })
}

export function getJcPeriod(id) {
  return request({
    url: '/foundation/jcPeriod/' + id,
    method: 'get'
  })
}

export function addJcPeriod(data) {
  return request({
    url: '/foundation/jcPeriod',
    method: 'post',
    data: data
  })
}

export function updateJcPeriod(data) {
  return request({
    url: '/foundation/jcPeriod',
    method: 'put',
    data: data
  })
}

export function delJcPeriod(id) {
  return request({
    url: '/foundation/jcPeriod/' + id,
    method: 'delete'
  })
}
