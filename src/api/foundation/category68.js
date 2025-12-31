import request from '@/utils/request'

// 查询68分类列表
export function listCategory68(query) {
  return request({
    url: '/foundation/category68/list',
    method: 'get',
    params: query
  })
}

// 查询68分类列表
export function listCategory68All(query) {
  return request({
    url: '/foundation/category68/listAll',
    method: 'get',
    params: query
  })
}

// 查询68分类树形列表
export function treeselect() {
  return request({
    url: '/foundation/category68/treeselect',
    method: 'get'
  })
}

// 查询68分类详细
export function getCategory68(category68Id) {
  return request({
    url: '/foundation/category68/' + category68Id,
    method: 'get'
  })
}

// 新增68分类
export function addCategory68(data) {
  return request({
    url: '/foundation/category68',
    method: 'post',
    data: data
  })
}

// 修改68分类
export function updateCategory68(data) {
  return request({
    url: '/foundation/category68',
    method: 'put',
    data: data
  })
}

// 删除68分类
export function delCategory68(category68Id) {
  return request({
    url: '/foundation/category68/' + category68Id,
    method: 'delete'
  })
}

