import request from '@/utils/request'

// 查询高值备货入库列表
export function listOrder(query) {
  return request({
    url: '/gz/order/list',
    method: 'get',
    params: query
  })
}

// 查询高值备货入库详细
export function getOrder(id) {
  return request({
    url: '/gz/order/' + id,
    method: 'get'
  })
}

/** 主单下院内码明细（打印条码兜底，不依赖备货库存数量） */
export function listOrderInhospitalcode(orderId) {
  return request({
    url: '/gz/order/' + orderId + '/inhospitalcodeList',
    method: 'get'
  })
}

// 新增高值备货入库
export function addOrder(data) {
  return request({
    url: '/gz/order',
    method: 'post',
    data: data
  })
}

// 修改高值备货入库
export function updateOrder(data) {
  return request({
    url: '/gz/order',
    method: 'put',
    data: data
  })
}

// 删除高值备货入库
export function delOrder(id) {
  return request({
    url: '/gz/order/' + id,
    method: 'delete'
  })
}

// 审核高值备货入库
export function auditOrder(data) {
  return request({
    url: '/gz/order/auditOrder',
    method: 'put',
    data: data
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