import request from '@/utils/request'

export function listJcReport(query) {
  return request({
    url: '/foundation/jcReport/list',
    method: 'get',
    params: query
  })
}

export function getJcReport(id) {
  return request({
    url: '/foundation/jcReport/' + id,
    method: 'get'
  })
}

export function addJcReport(data) {
  return request({
    url: '/foundation/jcReport',
    method: 'post',
    data: data
  })
}

export function batchSaveJcReport(data) {
  return request({
    url: '/foundation/jcReport/batch',
    method: 'post',
    data: data
  })
}

export function updateJcReport(data) {
  return request({
    url: '/foundation/jcReport',
    method: 'put',
    data: data
  })
}

export function delJcReport(id) {
  return request({
    url: '/foundation/jcReport/' + id,
    method: 'delete'
  })
}
