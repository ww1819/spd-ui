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

// 审核通过
export function auditStocktaking(data) {
  return request({
    url: '/department/stocktaking/auditStocktaking',
    method: 'put',
    data: data
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
