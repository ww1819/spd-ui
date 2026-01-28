import request from '@/utils/request'

// 查询待审核申领单列表（仅状态为1）
export function listApplyAudit(query) {
  return request({
    url: '/department/apply/list',
    method: 'get',
    params: query
  })
}

// 查询申领单详情
export function getApplyAudit(id) {
  return request({
    url: '/department/apply/' + id,
    method: 'get'
  })
}

// 审核通过
export function auditApply(data) {
  return request({
    url: '/department/apply/auditApply',
    method: 'put',
    data: data
  })
}

// 审核驳回
export function rejectApply(data) {
  return request({
    url: '/department/apply/reject',
    method: 'put',
    data: data
  })
}
