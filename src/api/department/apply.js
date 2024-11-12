import request from '@/utils/request'

// 查询科室申领列表
export function listApply(query) {
  return request({
    url: '/department/apply/list',
    method: 'get',
    params: query
  })
}

// 查询科室申领详细
export function getApply(id) {
  return request({
    url: '/department/apply/' + id,
    method: 'get'
  })
}

// 新增科室申领
export function addApply(data) {
  return request({
    url: '/department/apply',
    method: 'post',
    data: data
  })
}

// 修改科室申领
export function updateApply(data) {
  return request({
    url: '/department/apply',
    method: 'put',
    data: data
  })
}

// 删除科室申领
export function delApply(id) {
  return request({
    url: '/department/apply/' + id,
    method: 'delete'
  })
}

// 审核科室申领
export function auditApply(data) {
  return request({
    url: '/department/apply/auditApply',
    method: 'put',
    data: data
  })
}
