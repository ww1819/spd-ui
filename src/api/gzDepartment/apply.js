import request from '@/utils/request'

// 查询高值科室申领列表
export function listApply(query) {
  return request({
    url: '/gzDepartment/apply/list',
    method: 'get',
    params: query
  })
}

// 查询高值科室申领详细
export function getApply(id) {
  return request({
    url: '/gzDepartment/apply/' + id,
    method: 'get'
  })
}

// 新增高值科室申领
export function addApply(data) {
  return request({
    url: '/gzDepartment/apply',
    method: 'post',
    data: data
  })
}

// 修改高值科室申领
export function updateApply(data) {
  return request({
    url: '/gzDepartment/apply',
    method: 'put',
    data: data
  })
}

// 删除高值科室申领
export function delApply(id) {
  return request({
    url: '/gzDepartment/apply/' + id,
    method: 'delete'
  })
}

// 审核科室申领
export function auditApply(data) {
  return request({
    url: '/gzDepartment/apply/auditApply',
    method: 'put',
    data: data
  })
}
