import request from '@/utils/request'

// 查询采购审批列表
export function listPurchaseApproval(query) {
  return request({
    url: '/equipment/purchaseApproval/list',
    method: 'get',
    params: query
  })
}

// 查询采购审批详细
export function getPurchaseApproval(id) {
  return request({
    url: '/equipment/purchaseApproval/' + id,
    method: 'get'
  })
}

// 审批采购申请
export function approvePurchaseApproval(data) {
  return request({
    url: '/equipment/purchaseApproval/approve',
    method: 'post',
    data: data
  })
}

// 拒绝采购申请
export function rejectPurchaseApproval(data) {
  return request({
    url: '/equipment/purchaseApproval/reject',
    method: 'post',
    data: data
  })
}

// 导出采购审批
export function exportPurchaseApproval(query) {
  return request({
    url: '/equipment/purchaseApproval/export',
    method: 'post',
    params: query
  })
}

