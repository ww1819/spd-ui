import request from '@/utils/request'

// 查询高值备货出库列表
export function listOrder(query) {
  return request({
    url: '/gz/shipment/list',
    method: 'get',
    params: query
  })
}

// 查询高值备货出库详细
export function getOrder(id) {
  return request({
    url: '/gz/shipment/' + id,
    method: 'get'
  })
}

// 新增高值备货出库
export function addOrder(data) {
  return request({
    url: '/gz/shipment',
    method: 'post',
    data: data
  })
}

// 修改高值备货出库
export function updateOrder(data) {
  return request({
    url: '/gz/shipment',
    method: 'put',
    data: data
  })
}

// 删除高值备货出库
export function delOrder(id) {
  return request({
    url: '/gz/shipment/' + id,
    method: 'delete'
  })
}

// 审核高值备货出库
export function auditOrder(data) {
  return request({
    url: '/gz/shipment/auditOrder',
    method: 'put',
    data: data
  })
}

// 根据院内码查询是否有未出库的出库单
export function checkInHospitalCode(data) {
  return request({
    url: '/gz/shipment/checkInHospitalCode',
    method: 'post',
    data: data
  })
}

/** 备货出库：按院内码+仓库查询一条可用备货库存 */
export function getDepotByInHospitalCodeForOutbound(inHospitalCode, warehouseId) {
  return request({
    url: '/gz/shipment/depotInventory/byInHospitalCode',
    method: 'get',
    params: { inHospitalCode, warehouseId }
  })
}

// 查询高值单据明细变更记录
export function listEntryChangeLog(billType, billId) {
  return request({
    url: '/gz/changeLog/list',
    method: 'get',
    params: { billType, billId }
  })
}

