import request from '@/utils/request'

// 查询转科申请列表
export function listDepartmentTransfer(query) {
  return request({
    url: '/department/transfer/list',
    method: 'get',
    params: query
  })
}

// 查询转科申请详细
export function getDepartmentTransfer(id) {
  return request({
    url: '/department/transfer/' + id,
    method: 'get'
  })
}

// 新增转科申请
export function addDepartmentTransfer(data) {
  return request({
    url: '/department/transfer',
    method: 'post',
    data: data
  })
}

// 修改转科申请
export function updateDepartmentTransfer(data) {
  return request({
    url: '/department/transfer',
    method: 'put',
    data: data
  })
}

// 删除转科申请
export function delDepartmentTransfer(id) {
  return request({
    url: '/department/transfer/' + id,
    method: 'delete'
  })
}

// 审核转科申请
export function auditDepartmentTransfer(data) {
  return request({
    url: '/department/transfer/auditApply',
    method: 'put',
    data: data
  })
}

