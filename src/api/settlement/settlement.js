import request from '@/utils/request'

// 查询结算列表
export function listSettlement(query) {
  return request({
    url: '/settlement/settlement/list',
    method: 'get',
    params: query
  })
}

// 查询结算详细
export function getSettlement(id) {
  return request({
    url: '/settlement/settlement/' + id,
    method: 'get'
  })
}

// 新增结算
export function addSettlement(data) {
  return request({
    url: '/settlement/settlement',
    method: 'post',
    data: data
  })
}

// 修改结算
export function updateSettlement(data) {
  return request({
    url: '/settlement/settlement',
    method: 'put',
    data: data
  })
}

// 删除结算
export function delSettlement(id) {
  return request({
    url: '/settlement/settlement/' + id,
    method: 'delete'
  })
}

// 审核结算
export function auditSettlement(data) {
  return request({
    url: '/settlement/settlement/auditSettlement',
    method: 'put',
    data: data
  })
}

// 查询结算明细：根据供应商、日期范围、仓库结算类型查询出库明细
export function getSettlementDetails(query) {
  return request({
    url: '/settlement/settlement/details',
    method: 'get',
    params: query
  })
}

