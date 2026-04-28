import request from '@/utils/request'

// 查询新品申购审批列表（低敏：仅需登录，与 /list 数据一致）
export function listNewProductAudit(query) {
  return request({
    url: '/department/newProductAudit/pick/list',
    method: 'get',
    params: query
  })
}

// 查询新品申购申请详细（低敏：仅需登录）
export function getNewProductAudit(id) {
  return request({
    url: '/department/newProductAudit/pick/' + id,
    method: 'get'
  })
}

// 审核通过
export function auditNewProductApply(id) {
  return request({
    url: '/department/newProductAudit/audit/' + id,
    method: 'put'
  })
}

// 驳回
export function rejectNewProductApply(data) {
  return request({
    url: '/department/newProductAudit/reject',
    method: 'put',
    data: data
  })
}

// 导出新品申购审批
export function exportNewProductAudit(query) {
  return request({
    url: '/department/newProductAudit/export',
    method: 'get',
    params: query
  })
}
