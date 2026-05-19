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

/** 汇总申购明细数量（首页今日统计等） */
export function sumPurchaseEntryQty(query) {
  return request({
    url: '/department/purchase/stats/todayEntryQtySum',
    method: 'get',
    params: query,
    headers: { hideError: true }
  })
}

// 新增科室申购
export function addPurchase(data, config = {}) {
  return request({
    url: '/department/purchase',
    method: 'post',
    data: data,
    ...config
  })
}

// 修改科室申购
export function updatePurchase(data, config = {}) {
  return request({
    url: '/department/purchase',
    method: 'put',
    data: data,
    ...config
  })
}

// 删除科室申购（id 可为单个 id 或逗号分隔的多个 id，如 "1,2,3"）
export function delPurchase(id) {
  const ids = Array.isArray(id) ? id.join(',') : id;
  return request({
    url: '/department/purchase/' + ids,
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

/** 科室申购整单作废（出库引用弹窗） */
export function voidDepPurchaseApplyWhole(data) {
  return request({
    url: '/department/purchase/voidWhole',
    method: 'post',
    data
  })
}