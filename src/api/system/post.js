import request from '@/utils/request'

// 查询岗位列表
export function listPost(query) {
  return request({
    url: '/system/post/list',
    method: 'get',
    params: query
  })
}

// 查询岗位详细
export function getPost(postId) {
  return request({
    url: '/system/post/' + postId,
    method: 'get'
  })
}

// 新增岗位
export function addPost(data) {
  return request({
    url: '/system/post',
    method: 'post',
    data: data
  })
}

// 修改岗位
export function updatePost(data) {
  return request({
    url: '/system/post',
    method: 'put',
    data: data
  })
}

// 删除岗位
export function delPost(postId) {
  return request({
    url: '/system/post/' + postId,
    method: 'delete'
  })
}

/** 耗材岗位：客户已开通菜单树（hc_customer_menu），用于新增授权 */
export function menuTreeselect(tenantId) {
  return request({
    url: '/system/post/menuTreeselect',
    method: 'get',
    params: { tenantId }
  })
}

/** 耗材岗位：菜单树 + 已勾选菜单 ID（sys_post_menu） */
export function roleMenuTreeselectPost(postId) {
  return request({
    url: '/system/post/roleMenuTreeselect/' + postId,
    method: 'get'
  })
}
