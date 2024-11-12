import request from '@/utils/request'

// 查询耗材分类维护列表
export function listMaterialCategory(query) {
  return request({
    url: '/foundation/materialCategory/list',
    method: 'get',
    params: query
  })
}

// 查询耗材分类维护详细
export function getMaterialCategory(materialCategoryId) {
  return request({
    url: '/foundation/materialCategory/' + materialCategoryId,
    method: 'get'
  })
}

// 新增耗材分类维护
export function addMaterialCategory(data) {
  return request({
    url: '/foundation/materialCategory',
    method: 'post',
    data: data
  })
}

// 修改耗材分类维护
export function updateMaterialCategory(data) {
  return request({
    url: '/foundation/materialCategory',
    method: 'put',
    data: data
  })
}

// 删除耗材分类维护
export function delMaterialCategory(materialCategoryId) {
  return request({
    url: '/foundation/materialCategory/' + materialCategoryId,
    method: 'delete'
  })
}
