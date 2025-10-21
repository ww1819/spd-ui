import request from '@/utils/request'

// 查询退货列表
export function listThInventory(query) {
  return request({
    url: '/warehouse/thInventory/list',
    method: 'get',
    params: query
  })
}

// 查询退货详细
export function getThInventory(id) {
  return request({
    url: '/warehouse/thInventory/' + id,
    method: 'get'
  })
}

// 新增退货
export function addThInventory(data) {
  return request({
    url: '/warehouse/thInventory/addThInventory',
    method: 'post',
    data: data
  })
}

// 修改退货
export function updateThInventory(data) {
  return request({
    url: '/warehouse/thInventory/updateThInventory',
    method: 'put',
    data: data
  })
}

// 删除退货
export function delThInventory(id) {
  return request({
    url: '/warehouse/thInventory/' + id,
    method: 'delete'
  })
}

// 审核退货
export function auditThInventory(data) {
  return request({
    url: '/warehouse/thInventory/auditThInventory',
    method: 'put',
    data: data
  })
}



export function createThEntriesByRkApply(data) {
  return request({
    url: '/warehouse/thInventory/createThEntriesByRkApply',
    method: 'get',
    params: query
  })
}

export function createThEntriesByTkApply(data) {
  return request({
    url: '/warehouse/thInventory/createThEntriesByTkApply',
    method: 'get',
    params: query
  })
}
