import request from '@/utils/request'

/**
 * 查询制单模板列表（按模板名称模糊）
 */
export function listApplyTemplate(query) {
  return request({
    url: '/department/applyTemplate/list',
    method: 'get',
    params: query
  })
}

/**
 * 获取制单模板详情（含明细）
 */
export function getApplyTemplate(id) {
  return request({
    url: '/department/applyTemplate/' + id,
    method: 'get'
  })
}

/**
 * 新增制单模板（含明细）
 */
export function addApplyTemplate(data) {
  return request({
    url: '/department/applyTemplate',
    method: 'post',
    data
  })
}

/**
 * 修改制单模板（含明细）
 */
export function updateApplyTemplate(data) {
  return request({
    url: '/department/applyTemplate',
    method: 'put',
    data
  })
}

/**
 * 删除制单模板（及明细）
 */
export function deleteApplyTemplate(id) {
  return request({
    url: '/department/applyTemplate/' + id,
    method: 'delete'
  })
}
