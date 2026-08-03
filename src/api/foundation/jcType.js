import request from '@/utils/request'

export function listJcType(query) {
  return request({
    url: '/foundation/jcType/list',
    method: 'get',
    params: query
  })
}

export function listJcTypeAll(query) {
  return request({
    url: '/foundation/jcType/listAll',
    method: 'get',
    params: query
  })
}

export function getJcType(id) {
  return request({
    url: '/foundation/jcType/' + id,
    method: 'get'
  })
}

export function addJcType(data) {
  return request({
    url: '/foundation/jcType',
    method: 'post',
    data: data
  })
}

export function updateJcType(data) {
  return request({
    url: '/foundation/jcType',
    method: 'put',
    data: data
  })
}

export function delJcType(id) {
  return request({
    url: '/foundation/jcType/' + id,
    method: 'delete'
  })
}
