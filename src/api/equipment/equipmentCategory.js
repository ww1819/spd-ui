import request from '@/utils/request'

// 查询设备分类列表
export function listEquipmentCategory(query) {
  return request({
    url: '/equipment/category/list',
    method: 'get',
    params: query
  })
}

// 查询设备分类详细
export function getEquipmentCategory(categoryId) {
  return request({
    url: '/equipment/category/' + categoryId,
    method: 'get'
  })
}

// 新增设备分类
export function addEquipmentCategory(data) {
  return request({
    url: '/equipment/category',
    method: 'post',
    data: data
  })
}

// 修改设备分类
export function updateEquipmentCategory(data) {
  return request({
    url: '/equipment/category',
    method: 'put',
    data: data
  })
}

// 删除设备分类
export function delEquipmentCategory(categoryId) {
  return request({
    url: '/equipment/category/' + categoryId,
    method: 'delete'
  })
}

// 查询设备分类下拉树列表
export function treeselect() {
  return request({
    url: '/equipment/category/treeselect',
    method: 'get'
  })
} 