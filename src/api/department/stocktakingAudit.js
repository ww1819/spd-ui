import request from '@/utils/request'

// 查询盘点审核列表
export function listStocktakingAudit(query) {
  return request({
    url: '/department/stocktaking/list',
    method: 'get',
    params: query
  })
}

// 查询盘点单详情
export function getStocktakingAudit(id) {
  return request({
    url: '/department/stocktaking/' + id,
    method: 'get'
  })
}

// 审核通过（服务端逐条落科室库存/流水，明细多时可能超过默认 10s）
export function auditStocktaking(data) {
  return request({
    url: '/department/stocktaking/auditStocktaking',
    method: 'put',
    data: data,
    timeout: 120000
  })
}

// 审核前库存一致性校验（逐条对账科室库存，明细多时可较慢）
export function checkStocktakingQty(data) {
  return request({
    url: '/department/stocktaking/auditStocktaking/checkQty',
    method: 'post',
    data: data,
    timeout: 120000
  })
}

// 审核驳回
export function rejectStocktaking(data) {
  return request({
    url: '/department/stocktaking/reject',
    method: 'put',
    data: data
  })
}

// 导出盘点审核
export function exportStocktakingAudit(query) {
  return request({
    url: '/department/stocktaking/export',
    method: 'post',
    params: query
  })
}
