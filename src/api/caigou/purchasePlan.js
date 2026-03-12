import request from '@/utils/request'

// 查询采购计划列表
export function listPurchasePlan(query) {
  return request({
    url: '/caigou/jihua/list',
    method: 'get',
    params: query
  })
}

// 查询采购计划详细
export function getPurchasePlan(id) {
  return request({
    url: '/caigou/jihua/' + id,
    method: 'get'
  })
}

// 新增采购计划
export function addPurchasePlan(data) {
  return request({
    url: '/caigou/jihua',
    method: 'post',
    data: data
  })
}

// 修改采购计划
export function updatePurchasePlan(data) {
  return request({
    url: '/caigou/jihua',
    method: 'put',
    data: data
  })
}

// 删除采购计划
export function delPurchasePlan(id) {
  return request({
    url: '/caigou/jihua/' + id,
    method: 'delete'
  })
}

// 审核采购计划
export function auditPurchasePlan(data) {
  return request({
    url: '/caigou/jihua/audit',
    method: 'put',
    data: data
  })
}

// 导出采购计划
export function exportPurchasePlan(query) {
  return request({
    url: '/caigou/jihua/export',
    method: 'post',
    params: query
  })
}

// 根据采购计划明细ID查询关联的申购明细（科室申购单单号、申购科室、申购数量、制单人、制单时间、审核人、审核时间）
export function getApplyDetails(entryId) {
  return request({
    url: '/caigou/jihua/applyDetails',
    method: 'get',
    params: { entryId }
  })
}

// 根据采购计划ID查询关联的申购单号列表（表头引用申购单号弹窗用）
export function getApplyBillNoList(planId) {
  return request({
    url: '/caigou/jihua/applyBillNoList',
    method: 'get',
    params: { planId }
  })
}
