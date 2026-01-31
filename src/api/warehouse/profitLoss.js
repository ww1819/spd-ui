import request from '@/utils/request'

// 查询盈亏单列表
export function listProfitLoss(query) {
  return request({
    url: '/warehouse/profitLoss/list',
    method: 'get',
    params: query
  })
}

// 查询盈亏单详情（含明细）
export function getProfitLoss(id) {
  return request({
    url: '/warehouse/profitLoss/' + id,
    method: 'get'
  })
}

// 根据已审核盘点单ID加载有盈亏明细（草稿，不落库）
export function loadDraft(stocktakingId) {
  return request({
    url: '/warehouse/profitLoss/loadDraft',
    method: 'get',
    params: { stocktakingId }
  })
}

// 新增盈亏单
export function addProfitLoss(data) {
  return request({
    url: '/warehouse/profitLoss',
    method: 'post',
    data: data
  })
}

// 修改盈亏单
export function updateProfitLoss(data) {
  return request({
    url: '/warehouse/profitLoss',
    method: 'put',
    data: data
  })
}

// 删除盈亏单
export function delProfitLoss(id) {
  return request({
    url: '/warehouse/profitLoss/' + id,
    method: 'delete'
  })
}

// 审核盈亏单
export function auditProfitLoss(id) {
  return request({
    url: '/warehouse/profitLoss/audit/' + id,
    method: 'put'
  })
}
