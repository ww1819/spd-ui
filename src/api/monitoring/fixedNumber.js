import request from '@/utils/request'

// 查询定数监测列表
export function listFixedNumber(query) {
  return request({
    url: '/monitoring/fixedNumber/list',
    method: 'get',
    params: query
  })
}

// 查询定数监测详细
export function getFixedNumber(id) {
  return request({
    url: '/monitoring/fixedNumber/' + id,
    method: 'get'
  })
}

// 新增定数监测
export function addFixedNumber(data) {
  return request({
    url: '/monitoring/fixedNumber',
    method: 'post',
    data: data
  })
}

// 修改定数监测
export function updateFixedNumber(data) {
  return request({
    url: '/monitoring/fixedNumber',
    method: 'put',
    data: data
  })
}

// 删除定数监测
export function delFixedNumber(id) {
  return request({
    url: '/monitoring/fixedNumber/' + id,
    method: 'delete'
  })
}

// 导出定数监测
export function exportFixedNumber(query) {
  return request({
    url: '/monitoring/fixedNumber/export',
    method: 'get',
    params: query
  })
}

