import request from '@/utils/request'

// 查询退库列表
export function listTkInventory(query) {
  return request({
    url: '/warehouse/tkInventory/list',
    method: 'get',
    params: query
  })
}

// 查询退库详细
export function getTkInventory(id) {
  return request({
    url: '/warehouse/tkInventory/' + id,
    method: 'get'
  })
}

// 新增退库
export function addTkInventory(data) {
  return request({
    url: '/warehouse/tkInventory/addTkInventory',
    method: 'post',
    data: data
  })
}

// 修改退库
export function updateTkInventory(data) {
  return request({
    url: '/warehouse/tkInventory/updateTkInventory',
    method: 'put',
    data: data
  })
}

// 删除退库
export function delTkInventory(id) {
  return request({
    url: '/warehouse/tkInventory/' + id,
    method: 'delete'
  })
}

// 审核退库
export function auditTkInventory(data) {
  return request({
    url: '/warehouse/tkInventory/auditTkInventory',
    method: 'put',
    data: data
  })
}


export function createTkEntriesByCkApply(id) {
  return request({
    url: '/warehouse/tkInventory/createTkEntriesByCkApply',
    method: 'get',
    params: query
  })
}
