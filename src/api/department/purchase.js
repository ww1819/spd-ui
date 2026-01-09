import request from '@/utils/request'

// 查询科室申购列表
export function listPurchase(query) {
  return request({
    url: '/department/purchase/list',
    method: 'get',
    params: query
  })
}

// 查询科室申购详细
export function getPurchase(id) {
  return request({
    url: '/department/purchase/' + id,
    method: 'get'
  })
}

// 新增科室申购
export function addPurchase(data) {
  return request({
    url: '/department/purchase',
    method: 'post',
    data: data
  })
}

// 修改科室申购
export function updatePurchase(data) {
  return request({
    url: '/department/purchase',
    method: 'put',
    data: data
  })
}

// 删除科室申购
export function delPurchase(id) {
  return request({
    url: '/department/purchase/' + id,
    method: 'delete'
  })
}

// 审核科室申购
export function auditPurchase(data) {
  return request({
    url: '/department/purchase/auditApply',
    method: 'put',
    data: data
  })
}

// 驳回科室申购
export function rejectPurchase(data) {
  return request({
    url: '/department/purchase/reject',
    method: 'put',
    data: data
  })
}