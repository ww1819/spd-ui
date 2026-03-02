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
