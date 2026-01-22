import request from '@/utils/request'

// 查询科室批量消耗列表
export function listConsume(query) {
  return request({
    url: '/department/batchConsume/list',
    method: 'get',
    params: query
  })
}

// 查询科室批量消耗详细
export function getConsume(id) {
  return request({
    url: '/department/batchConsume/' + id,
    method: 'get'
  })
}

// 新增科室批量消耗
export function addConsume(data) {
  return request({
    url: '/department/batchConsume',
    method: 'post',
    data: data
  })
}

// 修改科室批量消耗
export function updateConsume(data) {
  return request({
    url: '/department/batchConsume',
    method: 'put',
    data: data
  })
}

// 删除科室批量消耗
export function delConsume(id) {
  return request({
    url: '/department/batchConsume/' + id,
    method: 'delete'
  })
}

// 审核科室批量消耗
export function auditConsume(data) {
  return request({
    url: '/department/batchConsume/audit',
    method: 'put',
    data: data
  })
}

// 导出科室批量消耗
export function exportConsume(query) {
  return request({
    url: '/department/batchConsume/export',
    method: 'post',
    params: query
  })
}
