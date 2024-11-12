import request from '@/utils/request'

// 查询高值备货库存明细列表
export function listDepotInventory(query) {
  return request({
    url: '/gz/depotInventory/list',
    method: 'get',
    params: query
  })
}

// 查询高值备货库存明细详细
export function getDepotInventory(id) {
  return request({
    url: '/gz/depotInventory/' + id,
    method: 'get'
  })
}

// 新增高值备货库存明细
export function addDepotInventory(data) {
  return request({
    url: '/gz/depotInventory',
    method: 'post',
    data: data
  })
}

// 修改高值备货库存明细
export function updateDepotInventory(data) {
  return request({
    url: '/gz/depotInventory',
    method: 'put',
    data: data
  })
}

// 删除高值备货库存明细
export function delDepotInventory(id) {
  return request({
    url: '/gz/depotInventory/' + id,
    method: 'delete'
  })
}
