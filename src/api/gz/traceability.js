import request from '@/utils/request'

// 查询高值追溯单列表
export function listTraceability(query) {
  return request({
    url: '/gz/traceability/list',
    method: 'get',
    params: query
  })
}

// 查询高值追溯单详细
export function getTraceability(id) {
  return request({
    url: '/gz/traceability/' + id,
    method: 'get'
  })
}

// 新增高值追溯单
export function addTraceability(data) {
  return request({
    url: '/gz/traceability',
    method: 'post',
    data: data
  })
}

// 修改高值追溯单
export function updateTraceability(data) {
  return request({
    url: '/gz/traceability',
    method: 'put',
    data: data
  })
}

// 删除高值追溯单
export function delTraceability(id) {
  return request({
    url: '/gz/traceability/' + id,
    method: 'delete'
  })
}

// 审核高值追溯单
export function auditTraceability(id) {
  return request({
    url: '/gz/traceability/audit/' + id,
    method: 'put'
  })
}

// 反审核高值追溯单
export function unauditTraceability(id) {
  return request({
    url: '/gz/traceability/unaudit/' + id,
    method: 'put'
  })
}

// 导出高值追溯单
export function exportTraceability(query) {
  return request({
    url: '/gz/traceability/export',
    method: 'post',
    params: query
  })
}

// 查询追溯单明细列表（用于使用追溯明细表）
export function listTraceabilityEntry(query) {
  return request({
    url: '/gz/traceability/entry/list',
    method: 'get',
    params: query
  })
}
