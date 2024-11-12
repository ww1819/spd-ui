import request from '@/utils/request'

// 查询高值出库列表
export function listShipment(query) {
  return request({
    url: '/gz/shipment/list',
    method: 'get',
    params: query
  })
}

// 查询高值出库详细
export function getShipment(id) {
  return request({
    url: '/gz/shipment/' + id,
    method: 'get'
  })
}

// 新增高值出库
export function addShipment(data) {
  return request({
    url: '/gz/shipment',
    method: 'post',
    data: data
  })
}

// 修改高值出库
export function updateShipment(data) {
  return request({
    url: '/gz/shipment',
    method: 'put',
    data: data
  })
}

// 删除高值出库
export function delShipment(id) {
  return request({
    url: '/gz/shipment/' + id,
    method: 'delete'
  })
}

// 审核高值出库
export function auditShipment(data) {
  return request({
    url: '/gz/shipment/auditShipment',
    method: 'put',
    data: data
  })
}
