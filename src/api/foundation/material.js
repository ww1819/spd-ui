import request from '@/utils/request'

// 查询耗材产品列表
export function listMaterial(query) {
  return request({
    url: '/foundation/material/list',
    method: 'get',
    params: query
  })
}

// 查询所有耗材产品列表
export function listMaterialAll(query) {
  return request({
    url: '/foundation/material/listAll',
    method: 'get',
    params: query
  })
}

// 查询耗材产品详细
export function getMaterial(id) {
  return request({
    url: '/foundation/material/' + id,
    method: 'get'
  })
}

// 新增耗材产品
export function addMaterial(data) {
  return request({
    url: '/foundation/material',
    method: 'post',
    data: data
  })
}

// 修改耗材产品
export function updateMaterial(data) {
  return request({
    url: '/foundation/material',
    method: 'put',
    data: data
  })
}

// 删除耗材产品
export function delMaterial(id) {
  return request({
    url: '/foundation/material/' + id,
    method: 'delete'
  })
}
