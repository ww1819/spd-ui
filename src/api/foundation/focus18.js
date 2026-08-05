import request from '@/utils/request'

export function listFocus18(query) {
  return request({
    url: '/foundation/focus18/list',
    method: 'get',
    params: query
  })
}

export function listFocus18All(query) {
  return request({
    url: '/foundation/focus18/listAll',
    method: 'get',
    params: query,
    timeout: 60000
  })
}

/** 左侧树：耗材类别（去重，轻量） */
export function listFocus18Categories() {
  return request({
    url: '/foundation/focus18/categories',
    method: 'get'
  })
}

export function getFocus18(id) {
  return request({
    url: '/foundation/focus18/' + id,
    method: 'get'
  })
}

export function addFocus18(data) {
  return request({
    url: '/foundation/focus18',
    method: 'post',
    data: data
  })
}

export function updateFocus18(data) {
  return request({
    url: '/foundation/focus18',
    method: 'put',
    data: data
  })
}

export function delFocus18(id) {
  return request({
    url: '/foundation/focus18/' + id,
    method: 'delete'
  })
}
