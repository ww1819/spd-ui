import request from '@/utils/request'

// 查询货位列表
export function listLocation(query) {
  return request({
    url: '/foundation/location/list',
    method: 'get',
    params: query
  })
}

// 查询货位列表
export function listLocationAll(query) {
  return request({
    url: '/foundation/location/listAll',
    method: 'get',
    params: query
  })
}

// 查询货位树形列表
export function treeselect() {
  return request({
    url: '/foundation/location/treeselect',
    method: 'get'
  })
}

// 查询货位详细
export function getLocation(locationId) {
  return request({
    url: '/foundation/location/' + locationId,
    method: 'get'
  })
}

// 新增货位
export function addLocation(data) {
  return request({
    url: '/foundation/location',
    method: 'post',
    data: data
  })
}

// 修改货位
export function updateLocation(data) {
  return request({
    url: '/foundation/location',
    method: 'put',
    data: data
  })
}

// 删除货位
export function delLocation(locationId) {
  return request({
    url: '/foundation/location/' + locationId,
    method: 'delete'
  })
}

