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

/** 汇总申领明细数量（首页今日统计等） */
export function sumApplyEntryQty(query) {
  return request({
    url: '/department/apply/stats/todayEntryQtySum',
    method: 'get',
    params: query,
    headers: { hideError: true }
  })
}

/** 科室申领操作人下拉（科室数据权限；有申请科室时仅该科室关联用户） */
export function listDeptApplyOperatorOptions(departmentId) {
  return request({
    url: '/department/apply/operatorOptions',
    method: 'get',
    params: { departmentId }
  })
}

// 新增科室申领
export function addApply(data, config = {}) {
  return request({
    url: '/department/apply',
    method: 'post',
    data: data,
    ...config
  })
}

// 修改科室申领
export function updateApply(data, config = {}) {
  return request({
    url: '/department/apply',
    method: 'put',
    data: data,
    ...config
  })
}

// 删除科室申领（id 可为单个 id 或逗号分隔的多个 id，如 "1,2,3"）
export function delApply(id) {
  const ids = Array.isArray(id) ? id.join(',') : id;
  return request({
    url: '/department/apply/' + ids,
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
